import {
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
} from './operations.js';

export type AppSchema = {
	AIInsight: AIInsight;
	CrowdZone: CrowdZone;
	Land: Land;
	MaintenanceAsset: MaintenanceAsset;
	OperationsAlert: OperationsAlert;
	Park: Park;
	Ride: Ride;
	RideTelemetry: RideTelemetry;
	Washroom: Washroom;
	WashroomTelemetry: WashroomTelemetry;
	WeatherSnapshot: WeatherSnapshot;
};

export const schema = [
	Park,
	Land,
	Ride,
	RideTelemetry,
	Washroom,
	WashroomTelemetry,
	WeatherSnapshot,
	CrowdZone,
	OperationsAlert,
	AIInsight,
	MaintenanceAsset,
];
