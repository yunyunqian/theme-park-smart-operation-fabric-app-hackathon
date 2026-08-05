import type { AIInsight, OperationsAlert } from '../../rayfin/data/operations';
import { DatabaseProvider } from '../providers/databaseProvider';
import { cleaningUrgencyScore, maintenanceRiskScore } from './scoringService';
import { clamp } from '../utils/formatters';

const vary = (value: number, spread: number) => Math.round(clamp(value + (Math.random() - 0.5) * spread));
const simulationTimeoutMs = 45_000;

function withSimulationTimeout<T>(operation: Promise<T>): Promise<T> {
  return Promise.race([
    operation,
    new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error('Fabric generated APIs did not respond to the simulation read batch within 45 seconds.')), simulationTimeoutMs)),
  ]);
}

export class DatabaseSimulationService {
  private timer?: number;
  private running = false;

  constructor(private readonly database = new DatabaseProvider()) {}

  start(onPersisted?: () => void, onError?: (error: unknown) => void): void {
    if (this.timer) return;
    const run = () => void this.tick().then(onPersisted).catch((error: unknown) => {
      console.error('Database simulation tick failed.', error);
      onError?.(error);
    });
    run();
    this.timer = window.setInterval(run, 30_000);
  }

  stop(): void {
    if (this.timer) window.clearInterval(this.timer);
    this.timer = undefined;
  }

  async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const [parks, rides, rideTelemetry, washrooms, washroomTelemetry, zones, assets, alerts, insights] = await withSimulationTimeout(Promise.all([
        this.database.getParks(), this.database.getRides(), this.database.getRideTelemetry(), this.database.getWashrooms(), this.database.getWashroomTelemetry(), this.database.getCrowdZones(), this.database.getMaintenanceAssets(), this.database.getAlerts(), this.database.getInsights(),
      ]));
      const now = new Date();
      for (const ride of rides) {
        const previous = rideTelemetry.get(ride.id);
        if (!previous) continue;
        const wait = vary(ride.currentWaitTime, 14);
        const motorTemperature = vary(previous.motorTemperature, 5);
        const vibrationScore = vary(previous.vibrationScore, 8);
        const downtimeEvents = Math.max(0, previous.downtimeEvents + (Math.random() > 0.96 ? 1 : 0));
        const cycleCount = previous.cycleCount + 1;
        const risk = maintenanceRiskScore(vibrationScore, motorTemperature, downtimeEvents, cycleCount);
        await Promise.all([
          this.database.rides.update(ride.id, { previousWaitTime: ride.currentWaitTime, currentWaitTime: wait, lastUpdated: now }),
          this.database.rideTelemetry.create({ id: crypto.randomUUID(), rideId: ride.id, timestamp: now, motorTemperature, vibrationScore, cycleCount, downtimeEvents, maintenanceRiskScore: risk, faultCode: risk >= 80 ? `AUTO-${ride.id.slice(0, 5)}` : undefined, recommendedAction: risk >= 80 ? 'Schedule an immediate engineering inspection.' : risk >= 60 ? 'Increase inspection frequency.' : 'Continue standard monitoring.' }),
        ]);
        const asset = assets.find((item) => item.assetName === ride.name);
        if (asset) await this.database.maintenance.update(asset.id, { riskScore: risk, currentStatus: risk >= 80 ? 'Inspection Required' : risk >= 60 ? 'Monitor' : 'Operational' });
      }
      for (const washroom of washrooms) {
        const previous = washroomTelemetry.get(washroom.id);
        if (!previous) continue;
        const occupancy = vary(previous.occupancy, 18);
        const soapLevel = Math.max(0, previous.soapLevel - (Math.random() > 0.6 ? 1 : 0));
        const paperTowelLevel = Math.max(0, previous.paperTowelLevel - (Math.random() > 0.55 ? 1 : 0));
        const toiletPaperLevel = Math.max(0, previous.toiletPaperLevel - (Math.random() > 0.7 ? 1 : 0));
        const minutesSinceCleaned = (now.getTime() - new Date(previous.lastCleanedTime).getTime()) / 60_000;
        const urgency = cleaningUrgencyScore(occupancy, previous.trafficCount + 1, minutesSinceCleaned, [soapLevel, paperTowelLevel, toiletPaperLevel], previous.maintenanceIssueCount);
        await this.database.washroomTelemetry.create({ ...previous, id: crypto.randomUUID(), timestamp: now, occupancy, trafficCount: previous.trafficCount + 1, soapLevel, paperTowelLevel, toiletPaperLevel, cleaningUrgencyScore: urgency });
      }
      for (const zone of zones) {
        const crowdScore = vary(zone.crowdScore, 16);
        await this.database.crowdZones.update(zone.id, { crowdScore, congestionStatus: crowdScore >= 85 ? 'Critical' : crowdScore >= 65 ? 'Busy' : crowdScore >= 35 ? 'Moderate' : 'Low' });
      }
      for (const park of parks) {
        const parkRides = rides.filter((ride) => ride.parkId === park.id);
        const parkZones = zones.filter((zone) => zone.parkId === park.id);
        const averageWaitTime = Math.round(parkRides.reduce((sum, ride) => sum + ride.currentWaitTime, 0) / Math.max(1, parkRides.length));
        const crowdScore = Math.round(parkZones.reduce((sum, zone) => sum + zone.crowdScore, 0) / Math.max(1, parkZones.length));
        await this.database.parks.update(park.id, { averageWaitTime, crowdScore, operationalStatus: crowdScore >= 85 ? 'Critical' : crowdScore >= 65 ? 'Busy' : crowdScore >= 40 ? 'Elevated' : 'Normal', healthScore: Math.max(60, 100 - Math.round(crowdScore * 0.08)), lastUpdated: now });
      }
      const highestRisk = assets.sort((a, b) => b.riskScore - a.riskScore)[0];
      if (highestRisk?.riskScore >= 65) {
        const alert: OperationsAlert = { id: crypto.randomUUID(), category: 'maintenance', severity: highestRisk.riskScore >= 80 ? 'critical' : 'high', title: `${highestRisk.assetName} risk elevated`, description: `Maintenance risk reached ${highestRisk.riskScore}.`, relatedEntityId: highestRisk.id, relatedEntityType: 'MaintenanceAsset', recommendedAction: 'Review telemetry and schedule an inspection window.', createdTime: now, acknowledged: false };
        const insight: AIInsight = { id: crypto.randomUUID(), category: 'maintenance', severity: alert.severity, title: alert.title, description: alert.description, relatedScreen: 'maintenance', relatedEntityId: highestRisk.id, recommendation: alert.recommendedAction, createdTime: now };
        const existingAlert = alerts.find((item) => item.relatedEntityId === highestRisk.id && item.category === 'maintenance');
        const existingInsight = insights.find((item) => item.relatedEntityId === highestRisk.id && item.category === 'maintenance');
        await Promise.all([
          existingAlert ? this.database.alerts.update(existingAlert.id, alert) : this.database.alerts.create(alert),
          existingInsight ? this.database.insights.update(existingInsight.id, insight) : this.database.insights.create(insight),
        ]);
      }
    } finally {
      this.running = false;
    }
  }
}