import type {
  AIInsight,
  CrowdZone,
  Land,
  MaintenanceAsset,
  OperationsAlert,
  Park,
  Ride,
  RideTelemetry,
  Washroom,
  WashroomTelemetry,
  WeatherSnapshot,
} from '../../rayfin/data/operations';
import { getRayfinClient } from '../services/rayfinClient';

const parkFields = ['id', 'name', 'shortName', 'latitude', 'longitude', 'color', 'operationalStatus', 'averageWaitTime', 'crowdScore', 'healthScore', 'lastUpdated'] as const;
const landFields = ['id', 'parkId', 'name'] as const;
const rideFields = ['id', 'parkId', 'landId', 'name', 'attractionType', 'latitude', 'longitude', 'currentStatus', 'currentWaitTime', 'previousWaitTime', 'lastUpdated'] as const;
const rideTelemetryFields = ['id', 'rideId', 'timestamp', 'motorTemperature', 'vibrationScore', 'cycleCount', 'downtimeEvents', 'maintenanceRiskScore', 'faultCode', 'recommendedAction'] as const;
const washroomFields = ['id', 'parkId', 'landId', 'name', 'facilityType', 'latitude', 'longitude', 'capacity', 'accessibilityEnabled'] as const;
const washroomTelemetryFields = ['id', 'washroomId', 'timestamp', 'occupancy', 'trafficCount', 'soapLevel', 'paperTowelLevel', 'toiletPaperLevel', 'maintenanceIssueCount', 'cleaningUrgencyScore', 'lastCleanedTime', 'assignedCastMember', 'nextCleaningTime'] as const;
const weatherFields = ['id', 'timestamp', 'temperature', 'humidity', 'windSpeed', 'precipitationProbability', 'weatherCode'] as const;
const crowdFields = ['id', 'parkId', 'name', 'crowdScore', 'congestionStatus'] as const;
const alertFields = ['id', 'category', 'severity', 'title', 'description', 'relatedEntityId', 'relatedEntityType', 'recommendedAction', 'createdTime', 'acknowledged'] as const;
const insightFields = ['id', 'category', 'severity', 'title', 'description', 'relatedScreen', 'relatedEntityId', 'recommendation', 'createdTime'] as const;
const maintenanceFields = ['id', 'assetName', 'assetType', 'parkId', 'currentStatus', 'riskScore', 'nextMaintenanceDate', 'lastInspectionDate'] as const;

export class ParkRepository {
  list(): Promise<Park[]> { return getRayfinClient().data.Park.select([...parkFields]).execute(); }
  create(value: Park): Promise<Park> { return getRayfinClient().data.Park.create(value); }
  update(id: string, value: Partial<Park>): Promise<Park> { return getRayfinClient().data.Park.update({ id }, value); }
}

export class LandRepository {
  list(): Promise<Land[]> { return getRayfinClient().data.Land.select([...landFields]).execute(); }
  create(value: Land): Promise<Land> { return getRayfinClient().data.Land.create(value); }
}

export class RideRepository {
  list(): Promise<Ride[]> { return getRayfinClient().data.Ride.select([...rideFields]).execute(); }
  create(value: Ride): Promise<Ride> { return getRayfinClient().data.Ride.create(value); }
  update(id: string, value: Partial<Ride>): Promise<Ride> { return getRayfinClient().data.Ride.update({ id }, value); }
  recordOperationalEvent(id: string, currentStatus: Ride['currentStatus'], currentWaitTime: number): Promise<Ride> {
    return this.update(id, { currentStatus, currentWaitTime, lastUpdated: new Date() });
  }
}

export class RideTelemetryRepository {
  list(): Promise<RideTelemetry[]> { return getRayfinClient().data.RideTelemetry.select([...rideTelemetryFields]).orderBy({ timestamp: 'desc' }).execute(); }
  create(value: RideTelemetry): Promise<RideTelemetry> { return getRayfinClient().data.RideTelemetry.create(value); }
  async latestByRide(): Promise<Map<string, RideTelemetry>> {
    const latest = new Map<string, RideTelemetry>();
    for (const row of await this.list()) if (!latest.has(row.rideId)) latest.set(row.rideId, row);
    return latest;
  }
}

export class WashroomRepository {
  list(): Promise<Washroom[]> { return getRayfinClient().data.Washroom.select([...washroomFields]).execute(); }
  create(value: Washroom): Promise<Washroom> { return getRayfinClient().data.Washroom.create(value); }
}

export class WashroomTelemetryRepository {
  list(): Promise<WashroomTelemetry[]> { return getRayfinClient().data.WashroomTelemetry.select([...washroomTelemetryFields]).orderBy({ timestamp: 'desc' }).execute(); }
  create(value: WashroomTelemetry): Promise<WashroomTelemetry> { return getRayfinClient().data.WashroomTelemetry.create(value); }
  async latestByWashroom(): Promise<Map<string, WashroomTelemetry>> {
    const latest = new Map<string, WashroomTelemetry>();
    for (const row of await this.list()) if (!latest.has(row.washroomId)) latest.set(row.washroomId, row);
    return latest;
  }
  async recordCleaning(washroomId: string, assignedCastMember: string): Promise<WashroomTelemetry> {
    const current = (await this.latestByWashroom()).get(washroomId);
    if (!current) throw new Error('Washroom telemetry was not found.');
    const now = new Date();
    return this.create({ ...current, id: crypto.randomUUID(), timestamp: now, occupancy: 0, trafficCount: 0, cleaningUrgencyScore: 0, lastCleanedTime: now, assignedCastMember, nextCleaningTime: new Date(now.getTime() + 90 * 60_000) });
  }
}

export class WeatherRepository {
  list(): Promise<WeatherSnapshot[]> { return getRayfinClient().data.WeatherSnapshot.select([...weatherFields]).orderBy({ timestamp: 'desc' }).execute(); }
  create(value: WeatherSnapshot): Promise<WeatherSnapshot> { return getRayfinClient().data.WeatherSnapshot.create(value); }
}

export class CrowdZoneRepository {
  list(): Promise<CrowdZone[]> { return getRayfinClient().data.CrowdZone.select([...crowdFields]).execute(); }
  create(value: CrowdZone): Promise<CrowdZone> { return getRayfinClient().data.CrowdZone.create(value); }
  update(id: string, value: Partial<CrowdZone>): Promise<CrowdZone> { return getRayfinClient().data.CrowdZone.update({ id }, value); }
}

export class AlertRepository {
  listActive(): Promise<OperationsAlert[]> { return getRayfinClient().data.OperationsAlert.select([...alertFields]).where({ acknowledged: { eq: false } }).orderBy({ createdTime: 'desc' }).execute(); }
  create(value: OperationsAlert): Promise<OperationsAlert> { return getRayfinClient().data.OperationsAlert.create(value); }
  update(id: string, value: Partial<OperationsAlert>): Promise<OperationsAlert> { return getRayfinClient().data.OperationsAlert.update({ id }, value); }
  acknowledge(id: string): Promise<OperationsAlert> { return getRayfinClient().data.OperationsAlert.update({ id }, { acknowledged: true }); }
}

export class AIInsightRepository {
  list(): Promise<AIInsight[]> { return getRayfinClient().data.AIInsight.select([...insightFields]).orderBy({ createdTime: 'desc' }).execute(); }
  create(value: AIInsight): Promise<AIInsight> { return getRayfinClient().data.AIInsight.create(value); }
  update(id: string, value: Partial<AIInsight>): Promise<AIInsight> { return getRayfinClient().data.AIInsight.update({ id }, value); }
}

export class MaintenanceRepository {
  list(): Promise<MaintenanceAsset[]> { return getRayfinClient().data.MaintenanceAsset.select([...maintenanceFields]).execute(); }
  create(value: MaintenanceAsset): Promise<MaintenanceAsset> { return getRayfinClient().data.MaintenanceAsset.create(value); }
  update(id: string, value: Partial<MaintenanceAsset>): Promise<MaintenanceAsset> { return getRayfinClient().data.MaintenanceAsset.update({ id }, value); }
}