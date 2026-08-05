import type { MaintenanceAsset, Ride } from '../../rayfin/data/operations';
import { AlertRepository, MaintenanceRepository, RideRepository, WashroomTelemetryRepository } from '../repositories/operationsRepositories';

export class OperationalCommandService {
  constructor(
    private readonly maintenance = new MaintenanceRepository(),
    private readonly washrooms = new WashroomTelemetryRepository(),
    private readonly rides = new RideRepository(),
    private readonly alerts = new AlertRepository(),
  ) {}

  postManualMaintenanceUpdate(id: string, update: Partial<MaintenanceAsset>) { return this.maintenance.update(id, update); }
  postWashroomCleaningEvent(washroomId: string, assignedCastMember: string) { return this.washrooms.recordCleaning(washroomId, assignedCastMember); }
  postRideOperationalEvent(rideId: string, status: Ride['currentStatus'], waitTime: number) { return this.rides.recordOperationalEvent(rideId, status, waitTime); }
  postAlertAcknowledgement(alertId: string) { return this.alerts.acknowledge(alertId); }
}