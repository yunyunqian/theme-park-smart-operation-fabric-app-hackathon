import { Circle } from 'react-leaflet'
import type { ParkOperationsSummary } from '../types/operations'
import { heatColor } from '../utils/formatters'

export function HeatMapLayer({ parks }: { parks: ParkOperationsSummary[] }) {
  return <>{parks.map((park) => <Circle key={park.id} center={[park.latitude, park.longitude]} radius={1100} pathOptions={{ fillColor: heatColor(park.guestDensity), fillOpacity: .24, color: heatColor(park.guestDensity), opacity: .55, weight: 2 }} />)}</>
}
