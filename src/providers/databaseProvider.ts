import type { IDataProvider, IInsightProvider, ITelemetryProvider } from './contracts';
import { AIInsightRepository, AlertRepository, CrowdZoneRepository, LandRepository, MaintenanceRepository, ParkRepository, RideRepository, RideTelemetryRepository, WashroomRepository, WashroomTelemetryRepository, WeatherRepository } from '../repositories/operationsRepositories';

export class DatabaseProvider implements IDataProvider, ITelemetryProvider, IInsightProvider {
  readonly parks = new ParkRepository();
  readonly lands = new LandRepository();
  readonly rides = new RideRepository();
  readonly rideTelemetry = new RideTelemetryRepository();
  readonly washrooms = new WashroomRepository();
  readonly washroomTelemetry = new WashroomTelemetryRepository();
  readonly crowdZones = new CrowdZoneRepository();
  readonly maintenance = new MaintenanceRepository();
  readonly alerts = new AlertRepository();
  readonly insights = new AIInsightRepository();
  readonly weather = new WeatherRepository();

  getParks() { return this.parks.list(); }
  getLands() { return this.lands.list(); }
  getRides() { return this.rides.list(); }
  getRideTelemetry() { return this.rideTelemetry.latestByRide(); }
  getWashrooms() { return this.washrooms.list(); }
  getWashroomTelemetry() { return this.washroomTelemetry.latestByWashroom(); }
  getCrowdZones() { return this.crowdZones.list(); }
  getMaintenanceAssets() { return this.maintenance.list(); }
  getAlerts() { return this.alerts.listActive(); }
  getInsights() { return this.insights.list(); }
  async getWeather() { return (await this.weather.list())[0]; }
}