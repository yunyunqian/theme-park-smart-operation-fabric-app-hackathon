import { authenticated, boolean, date, decimal, entity, int, set, text, uuid } from '@microsoft/rayfin-core';

@entity()
@authenticated('*')
export class Park {
  @uuid() id!: string;
  @text({ max: 120 }) name!: string;
  @text({ max: 8 }) shortName!: string;
  @decimal({ precision: 10, scale: 6 }) latitude!: number;
  @decimal({ precision: 10, scale: 6 }) longitude!: number;
  @text({ max: 16 }) color!: string;
  @set('Normal', 'Elevated', 'Busy', 'Critical', 'Closed') operationalStatus!: 'Normal' | 'Elevated' | 'Busy' | 'Critical' | 'Closed';
  @int() averageWaitTime!: number;
  @int() crowdScore!: number;
  @int() healthScore!: number;
  @date() lastUpdated!: Date;
}

@entity()
@authenticated('*')
export class Land {
  @uuid() id!: string;
  @uuid() parkId!: string;
  @text({ max: 120 }) name!: string;
}

@entity()
@authenticated('*')
export class Ride {
  @uuid() id!: string;
  @uuid() parkId!: string;
  @uuid() landId!: string;
  @text({ max: 160 }) name!: string;
  @text({ max: 80 }) attractionType!: string;
  @decimal({ precision: 10, scale: 6 }) latitude!: number;
  @decimal({ precision: 10, scale: 6 }) longitude!: number;
  @set('Open', 'Closed', 'Delayed', 'Maintenance') currentStatus!: 'Open' | 'Closed' | 'Delayed' | 'Maintenance';
  @int() currentWaitTime!: number;
  @int() previousWaitTime!: number;
  @date() lastUpdated!: Date;
}

@entity()
@authenticated('*')
export class RideTelemetry {
  @uuid() id!: string;
  @uuid() rideId!: string;
  @date() timestamp!: Date;
  @decimal() motorTemperature!: number;
  @decimal() vibrationScore!: number;
  @int() cycleCount!: number;
  @int() downtimeEvents!: number;
  @int() maintenanceRiskScore!: number;
  @text({ max: 40, optional: true }) faultCode?: string;
  @text({ max: 500 }) recommendedAction!: string;
}

@entity()
@authenticated('*')
export class Washroom {
  @uuid() id!: string;
  @uuid() parkId!: string;
  @uuid() landId!: string;
  @text({ max: 160 }) name!: string;
  @text({ max: 80 }) facilityType!: string;
  @decimal({ precision: 10, scale: 6 }) latitude!: number;
  @decimal({ precision: 10, scale: 6 }) longitude!: number;
  @int() capacity!: number;
  @boolean() accessibilityEnabled!: boolean;
}

@entity()
@authenticated('*')
export class WashroomTelemetry {
  @uuid() id!: string;
  @uuid() washroomId!: string;
  @date() timestamp!: Date;
  @int() occupancy!: number;
  @int() trafficCount!: number;
  @int() soapLevel!: number;
  @int() paperTowelLevel!: number;
  @int() toiletPaperLevel!: number;
  @int() maintenanceIssueCount!: number;
  @int() cleaningUrgencyScore!: number;
  @date() lastCleanedTime!: Date;
  @text({ max: 120 }) assignedCastMember!: string;
  @date() nextCleaningTime!: Date;
}

@entity()
@authenticated('*')
export class WeatherSnapshot {
  @uuid() id!: string;
  @date() timestamp!: Date;
  @decimal() temperature!: number;
  @int() humidity!: number;
  @decimal() windSpeed!: number;
  @int() precipitationProbability!: number;
  @int() weatherCode!: number;
}

@entity()
@authenticated('*')
export class CrowdZone {
  @uuid() id!: string;
  @uuid() parkId!: string;
  @text({ max: 160 }) name!: string;
  @int() crowdScore!: number;
  @set('Low', 'Moderate', 'Busy', 'Critical') congestionStatus!: 'Low' | 'Moderate' | 'Busy' | 'Critical';
}

@entity()
@authenticated('*')
export class OperationsAlert {
  @uuid() id!: string;
  @set('crowd', 'ride', 'weather', 'washroom', 'maintenance') category!: 'crowd' | 'ride' | 'weather' | 'washroom' | 'maintenance';
  @set('low', 'medium', 'high', 'critical') severity!: 'low' | 'medium' | 'high' | 'critical';
  @text({ max: 200 }) title!: string;
  @text({ max: 1000 }) description!: string;
  @uuid({ optional: true }) relatedEntityId?: string;
  @text({ max: 80 }) relatedEntityType!: string;
  @text({ max: 500 }) recommendedAction!: string;
  @date() createdTime!: Date;
  @boolean({ default: false }) acknowledged!: boolean;
}

@entity()
@authenticated('*')
export class AIInsight {
  @uuid() id!: string;
  @set('crowd', 'ride', 'weather', 'washroom', 'maintenance', 'operations') category!: 'crowd' | 'ride' | 'weather' | 'washroom' | 'maintenance' | 'operations';
  @set('low', 'medium', 'high', 'critical') severity!: 'low' | 'medium' | 'high' | 'critical';
  @text({ max: 200 }) title!: string;
  @text({ max: 1000 }) description!: string;
  @text({ max: 40 }) relatedScreen!: string;
  @uuid({ optional: true }) relatedEntityId?: string;
  @text({ max: 500 }) recommendation!: string;
  @date() createdTime!: Date;
}

@entity()
@authenticated('*')
export class MaintenanceAsset {
  @uuid() id!: string;
  @text({ max: 160 }) assetName!: string;
  @text({ max: 80 }) assetType!: string;
  @uuid() parkId!: string;
  @set('Operational', 'Monitor', 'Inspection Required', 'Out of Service') currentStatus!: 'Operational' | 'Monitor' | 'Inspection Required' | 'Out of Service';
  @int() riskScore!: number;
  @date() nextMaintenanceDate!: Date;
  @date() lastInspectionDate!: Date;
}