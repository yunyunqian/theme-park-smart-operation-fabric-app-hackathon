import type { AIInsight, CrowdZone, Land, MaintenanceAsset, OperationsAlert, Park, Ride, RideTelemetry, Washroom, WashroomTelemetry, WeatherSnapshot } from '../../rayfin/data/operations';

export interface IDataProvider {
  getParks(): Promise<Park[]>;
  getLands(): Promise<Land[]>;
  getRides(): Promise<Ride[]>;
  getWashrooms(): Promise<Washroom[]>;
  getCrowdZones(): Promise<CrowdZone[]>;
  getMaintenanceAssets(): Promise<MaintenanceAsset[]>;
  getAlerts(): Promise<OperationsAlert[]>;
  getWeather(): Promise<WeatherSnapshot | undefined>;
}

export interface ITelemetryProvider {
  getRideTelemetry(): Promise<Map<string, RideTelemetry>>;
  getWashroomTelemetry(): Promise<Map<string, WashroomTelemetry>>;
}

export interface IInsightProvider {
  getInsights(): Promise<AIInsight[]>;
}