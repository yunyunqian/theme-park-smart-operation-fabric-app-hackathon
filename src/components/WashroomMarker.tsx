import { Toilet } from 'lucide-react'
import { Marker, Tooltip } from 'react-leaflet'
import type { Washroom, WashroomTelemetry } from '../types/operations'
import { minutesAgo } from '../utils/dateTime'
import { createMapIcon } from '../utils/mapIcons'

export function WashroomMarker({ washroom }: { washroom: Washroom & { telemetry: WashroomTelemetry } }) {
  const urgency = washroom.telemetry.cleaningUrgency
  const color = urgency >= 70 ? '#e5484d' : urgency >= 40 ? '#eab308' : '#22a06b'
  return <Marker position={[washroom.latitude, washroom.longitude]} icon={createMapIcon(Toilet, color, 'Public washroom')}><Tooltip direction="top" className="map-tooltip"><strong>{washroom.name}</strong><span>Washroom · {washroom.telemetry.occupancy}% occupancy</span><span>Supplies: {Math.min(washroom.telemetry.soapLevel, washroom.telemetry.paperTowelLevel, washroom.telemetry.toiletPaperLevel)}% min</span><span>Urgency: {urgency} · {washroom.telemetry.nextCleaningWindow}</span><small>Cleaned {minutesAgo(washroom.telemetry.lastCleaned)}</small></Tooltip></Marker>
}
