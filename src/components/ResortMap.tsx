import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { ArrowLeft as RotateCcw, Crosshair, Flame, Toilet as Bath } from 'lucide-react'
import type { OperationsData, ParkOperationsSummary } from '../types/operations'
import { minutesAgo } from '../utils/dateTime'
import { heatColor } from '../utils/formatters'
import { AttractionMarker } from './AttractionMarker'
import { HeatMapLayer } from './HeatMapLayer'
import { ParkOverlay } from './ParkOverlay'
import { WashroomMarker } from './WashroomMarker'

function MapFly({ selected, parks }: { selected?: ParkOperationsSummary; parks: ParkOperationsSummary[] }) {
  const map = useMap()
  useEffect(() => {
    if (selected) map.flyTo([selected.latitude, selected.longitude], 15, { duration: 1.2 })
    else map.fitBounds(parks.map((park) => [park.latitude, park.longitude]), { padding: [40, 40], maxZoom: 13 })
  }, [map, parks, selected])
  return null
}

export function ResortMap({ data }: { data: OperationsData }) {
  const [selected, setSelected] = useState<ParkOperationsSummary>()
  const [hovered, setHovered] = useState<ParkOperationsSummary>()
  const [showWashrooms, setShowWashrooms] = useState(true)
  const [showHeat, setShowHeat] = useState(true)
  const active = hovered ?? selected
  const selectedRides = selected ? data.rides.filter((ride) => ride.parkId === selected.id) : []
  if (!data.parks.length) return <div className="resort-map-wrap"><div className="loading-state"><strong>No park coordinates are available in Fabric SQL</strong></div></div>
  const center: [number, number] = [
    data.parks.reduce((sum, park) => sum + park.latitude, 0) / data.parks.length,
    data.parks.reduce((sum, park) => sum + park.longitude, 0) / data.parks.length,
  ]
  return <div className="resort-map-wrap">
    <MapContainer center={center} zoom={13} minZoom={2} maxZoom={16} zoomControl={false} attributionControl={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
      {showHeat && <HeatMapLayer parks={data.parks}/>}<MapFly selected={selected} parks={data.parks}/>
      {!selected && data.parks.map((park) => <ParkOverlay key={park.id} park={park} onHover={setHovered} onSelect={setSelected}/>) }
      {selectedRides.map((ride) => <AttractionMarker key={ride.id} ride={ride} telemetry={data.rideTelemetry.find((item) => item.rideId === ride.id)}/>)}
      {selected && showWashrooms && data.washrooms.filter((room) => room.park === selected.name).map((room) => <WashroomMarker key={room.id} washroom={room}/>)}
    </MapContainer>
    <div className="map-toolbar"><button className={showHeat ? 'active' : ''} onClick={() => setShowHeat(!showHeat)}><Flame size={16}/>Crowd heat</button><button className={showWashrooms ? 'active' : ''} onClick={() => setShowWashrooms(!showWashrooms)}><Bath size={16}/>Washrooms</button><button onClick={() => setSelected(undefined)} title="Reset resort view"><RotateCcw size={16}/></button></div>
    <div className="map-legend"><span><i className="low"/>Low</span><span><i className="medium"/>Moderate</span><span><i className="high"/>Busy</span><span><i className="critical"/>Critical</span></div>
    {selected && <div className="zoom-breadcrumb"><Crosshair size={14}/>{selected.name}<button onClick={() => setSelected(undefined)}>Resort view</button></div>}
    {active && <div className="park-hover-card"><header><div><small>OPERATIONAL ZONE</small><h2>{active.name}</h2></div><span className={`status ${active.status.toLowerCase()}`}>{active.status}</span></header><div className="hover-score"><strong style={{ color: heatColor(active.guestDensity) }}>{active.guestDensity}</strong><span>Crowd<br/>score</span></div><dl><div><dt>Average wait</dt><dd>{active.averageWait} min</dd></div><div><dt>Longest wait</dt><dd>{active.longestWait} min</dd></div><div><dt>Ride availability</dt><dd>{active.openAttractions} open · {active.closedAttractions} closed</dd></div><div><dt>Operational health</dt><dd>{active.operationalHealth}%</dd></div></dl><footer>Updated {minutesAgo(active.lastUpdated)}</footer></div>}
  </div>
}
