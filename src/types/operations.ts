export type ParkStatus = 'Normal' | 'Elevated' | 'Busy' | 'Critical'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface Park {
  id: string
  name: string
  shortName: string
  latitude: number
  longitude: number
  color: string
}

export interface Land {
  id: string
  parkId: string
  name: string
}

export interface Ride {
  id: string
  name: string
  parkId: string
  park: string
  land: string
  latitude: number
  longitude: number
}

export interface RideWaitTime extends Ride {
  waitTime: number
  isOpen: boolean
  lastUpdated: string
  trend: 'up' | 'down' | 'stable'
}

export interface WeatherSnapshot {
  temperature: number
  apparentTemperature: number
  humidity: number
  precipitationProbability: number
  windSpeed: number
  uvIndex: number
  weatherCode: number
  observedAt: string
  source: 'database'
}

export interface Washroom {
  id: string
  name: string
  park: string
  land: string
  latitude: number
  longitude: number
  type: string
  capacity: number
  accessible: boolean
}

export interface WashroomTelemetry {
  washroomId: string
  occupancy: number
  trafficLast15Min: number
  lastCleaned: string
  assignedCastMember: string
  soapLevel: number
  paperTowelLevel: number
  toiletPaperLevel: number
  maintenanceIssueCount: number
  cleaningUrgency: number
  nextCleaningWindow: string
}

export interface RideTelemetry {
  rideId: string
  rideName: string
  park: string
  land: string
  assetType: string
  currentStatus: string
  operatingHoursToday: number
  cycleCountToday: number
  motorTemperature: number
  vibrationScore: number
  downtimeFrequency: number
  faultCode: string | null
  lastInspectionDate: string
  nextPlannedMaintenance: string
  predictedFailureRisk: number
  recommendedAction: string
}

export interface MaintenanceAlert {
  id: string
  rideId: string
  severity: RiskLevel
  message: string
  createdAt: string
}

export interface OperationsAlert {
  id: string
  category: 'crowd' | 'ride' | 'weather' | 'washroom' | 'maintenance'
  severity: RiskLevel
  message: string
  location: string
  createdAt: string
}

export interface CrowdZone {
  id: string
  name: string
  parkId: string
  waitTimeNormalized: number
  simulatedTraffic: number
  weatherImpact: number
  pressureScore: number
}

export interface AssistantMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ParkOperationsSummary extends Park {
  status: ParkStatus
  averageWait: number
  longestWait: number
  busiestAttraction: string
  openAttractions: number
  closedAttractions: number
  guestDensity: number
  temperature: number
  operationalHealth: number
  lastUpdated: string
}

export interface OperationsData {
  parks: ParkOperationsSummary[]
  rides: RideWaitTime[]
  weather: WeatherSnapshot
  washrooms: Array<Washroom & { telemetry: WashroomTelemetry }>
  rideTelemetry: RideTelemetry[]
  crowdZones: CrowdZone[]
  alerts: OperationsAlert[]
  insights: Array<{ id: string; category: string; severity: RiskLevel; title: string; description: string; relatedScreen: ScreenId; relatedEntityId?: string; recommendation: string; createdTime: string }>
  weatherAvailable: boolean
  lastSuccessfulRefresh: string
  waitTimeSource: 'Fabric SQL'
}

export type ScreenId =
  | 'operations'
  | 'crowd'
  | 'rides'
  | 'washrooms'
  | 'maintenance'
  | 'assistant'