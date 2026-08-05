import { Circle, Tooltip } from 'react-leaflet'
import type { ParkOperationsSummary } from '../types/operations'
import { heatColor } from '../utils/formatters'

export function ParkOverlay({ park, onHover, onSelect }: { park: ParkOperationsSummary; onHover: (park?: ParkOperationsSummary) => void; onSelect: (park: ParkOperationsSummary) => void }) {
  return <Circle center={[park.latitude, park.longitude]} radius={620} eventHandlers={{ mouseover: () => onHover(park), mouseout: () => onHover(undefined), click: () => onSelect(park) }} pathOptions={{ color: heatColor(park.guestDensity), fillColor: heatColor(park.guestDensity), fillOpacity: .38, weight: 3 }}><Tooltip direction="top" offset={[0, -10]} permanent className="park-label"><strong>{park.name}</strong><span>{park.averageWait} min avg · {park.guestDensity} crowd</span></Tooltip></Circle>
}
