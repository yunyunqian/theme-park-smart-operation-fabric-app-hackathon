import { DatabaseProvider } from '../providers/databaseProvider';
import type { OperationsAlert, OperationsData, ParkOperationsSummary, RideTelemetry, RideWaitTime, ScreenId, WashroomTelemetry } from '../types/operations';

const iso = (value: Date | string) => new Date(value).toISOString();

export class OperationsService {
  constructor(private readonly database = new DatabaseProvider()) {}

  async getSnapshot(): Promise<OperationsData> {
    const [parks, lands, rides, rideTelemetry, washrooms, washroomTelemetry, crowdZones, alerts, insights, assets, weather] = await Promise.all([
      this.database.getParks(), this.database.getLands(), this.database.getRides(), this.database.getRideTelemetry(), this.database.getWashrooms(), this.database.getWashroomTelemetry(), this.database.getCrowdZones(), this.database.getAlerts(), this.database.getInsights(), this.database.getMaintenanceAssets(), this.database.getWeather(),
    ]);
    const parkById = new Map(parks.map((park) => [park.id, park]));
    const landById = new Map(lands.map((land) => [land.id, land]));
    const ridesView: RideWaitTime[] = rides.map((ride) => ({
      id: ride.id, name: ride.name, parkId: ride.parkId, park: parkById.get(ride.parkId)?.name ?? '', land: landById.get(ride.landId)?.name ?? '', latitude: ride.latitude, longitude: ride.longitude,
      waitTime: ride.currentWaitTime, isOpen: ride.currentStatus === 'Open', lastUpdated: iso(ride.lastUpdated), trend: ride.currentWaitTime > ride.previousWaitTime ? 'up' : ride.currentWaitTime < ride.previousWaitTime ? 'down' : 'stable',
    }));
    const parkSummaries: ParkOperationsSummary[] = parks.map((park) => {
      const parkRides = ridesView.filter((ride) => ride.parkId === park.id);
      const longest = [...parkRides].sort((left, right) => right.waitTime - left.waitTime)[0];
      const openAttractions = parkRides.filter((ride) => ride.isOpen).length;
      return { id: park.id, name: park.name, shortName: park.shortName, latitude: park.latitude, longitude: park.longitude, color: park.color, status: park.operationalStatus === 'Closed' ? 'Critical' : park.operationalStatus, averageWait: park.averageWaitTime, longestWait: longest?.waitTime ?? 0, busiestAttraction: longest?.name ?? '', openAttractions, closedAttractions: parkRides.length - openAttractions, guestDensity: park.crowdScore, temperature: weather?.temperature ?? 0, operationalHealth: park.healthScore, lastUpdated: iso(park.lastUpdated) };
    });
    const rideTelemetryView: RideTelemetry[] = rides.flatMap((ride) => {
      const telemetry = rideTelemetry.get(ride.id);
      if (!telemetry) return [];
      const asset = assets.find((item) => item.assetName === ride.name);
      return [{ rideId: ride.id, rideName: ride.name, park: parkById.get(ride.parkId)?.name ?? '', land: landById.get(ride.landId)?.name ?? '', assetType: ride.attractionType, currentStatus: ride.currentStatus, operatingHoursToday: Math.round(telemetry.cycleCount / 55), cycleCountToday: telemetry.cycleCount, motorTemperature: telemetry.motorTemperature, vibrationScore: telemetry.vibrationScore, downtimeFrequency: telemetry.downtimeEvents, faultCode: telemetry.faultCode ?? null, lastInspectionDate: iso(asset?.lastInspectionDate ?? telemetry.timestamp), nextPlannedMaintenance: iso(asset?.nextMaintenanceDate ?? telemetry.timestamp), predictedFailureRisk: telemetry.maintenanceRiskScore, recommendedAction: telemetry.recommendedAction }];
    });
    const washroomsView = washrooms.flatMap((washroom) => {
      const telemetry = washroomTelemetry.get(washroom.id);
      if (!telemetry) return [];
      const view: WashroomTelemetry = { washroomId: washroom.id, occupancy: telemetry.occupancy, trafficLast15Min: telemetry.trafficCount, lastCleaned: iso(telemetry.lastCleanedTime), assignedCastMember: telemetry.assignedCastMember, soapLevel: telemetry.soapLevel, paperTowelLevel: telemetry.paperTowelLevel, toiletPaperLevel: telemetry.toiletPaperLevel, maintenanceIssueCount: telemetry.maintenanceIssueCount, cleaningUrgency: telemetry.cleaningUrgencyScore, nextCleaningWindow: iso(telemetry.nextCleaningTime) };
      return [{ id: washroom.id, name: washroom.name, park: parkById.get(washroom.parkId)?.name ?? '', land: landById.get(washroom.landId)?.name ?? '', latitude: washroom.latitude, longitude: washroom.longitude, type: washroom.facilityType, capacity: washroom.capacity, accessible: washroom.accessibilityEnabled, telemetry: view }];
    });
    const alertsView: OperationsAlert[] = alerts.map((alert) => ({ id: alert.id, category: alert.category, severity: alert.severity, message: alert.description, location: alert.title, createdAt: iso(alert.createdTime) }));
    return {
      parks: parkSummaries,
      rides: ridesView,
      weather: { temperature: weather?.temperature ?? 0, apparentTemperature: weather?.temperature ?? 0, humidity: weather?.humidity ?? 0, precipitationProbability: weather?.precipitationProbability ?? 0, windSpeed: weather?.windSpeed ?? 0, uvIndex: 0, weatherCode: weather?.weatherCode ?? 0, observedAt: iso(weather?.timestamp ?? new Date()), source: 'database' },
      washrooms: washroomsView,
      rideTelemetry: rideTelemetryView,
      crowdZones: crowdZones.map((zone) => ({ id: zone.id, name: zone.name, parkId: zone.parkId, waitTimeNormalized: zone.crowdScore, simulatedTraffic: zone.crowdScore, weatherImpact: 0, pressureScore: zone.crowdScore })),
      alerts: alertsView,
      insights: insights.map((insight) => ({ id: insight.id, category: insight.category, severity: insight.severity, title: insight.title, description: insight.description, relatedScreen: insight.relatedScreen as ScreenId, relatedEntityId: insight.relatedEntityId, recommendation: insight.recommendation, createdTime: iso(insight.createdTime) })),
      weatherAvailable: Boolean(weather),
      lastSuccessfulRefresh: new Date().toISOString(),
      waitTimeSource: 'Fabric SQL',
    };
  }
}
