import { FerrisWheel } from 'lucide-react'
import { Marker, Tooltip } from 'react-leaflet'
import type { RideTelemetry, RideWaitTime } from '../types/operations'
import { minutesAgo } from '../utils/dateTime'
import { createMapIcon } from '../utils/mapIcons'

export function AttractionMarker({ ride, telemetry }: { ride: RideWaitTime; telemetry?: RideTelemetry }) {
  const color = !ride.isOpen ? '#7d8998' : ride.waitTime >= 70 ? '#e5484d' : ride.waitTime >= 45 ? '#eab308' : '#22a06b'
  return <Marker position={[ride.latitude, ride.longitude]} icon={createMapIcon(FerrisWheel, color, 'Attraction')}><Tooltip direction="top" className="map-tooltip"><strong>{ride.name}</strong><span>{ride.isOpen ? 'Open' : 'Closed'} · {ride.waitTime} min</span><span>Maintenance risk: {telemetry?.predictedFailureRisk ?? 0}%</span><small>Updated {minutesAgo(ride.lastUpdated)}</small></Tooltip></Marker>
}
