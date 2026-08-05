import { AlertTriangle, Droplets, PackageOpen, Toilet, Users } from 'lucide-react'
import type { OperationsData } from '../types/operations'
import { minutesAgo } from '../utils/dateTime'
import { riskLevel } from '../utils/formatters'
import { MetricCard } from './MetricCard'

const supplyLevel = (value: number) => value < 30 ? 'low' : value <= 70 ? 'medium' : 'high'
const occupancyLevel = (value: number) => value >= 80 ? 'high' : value >= 50 ? 'medium' : 'low'

export function WashroomIntelligence({ data }: { data: OperationsData }) {
  const sorted = [...data.washrooms].sort((a, b) => b.telemetry.cleaningUrgency - a.telemetry.cleaningUrgency)
  const serviceNow = sorted.filter((room) => room.telemetry.cleaningUrgency >= 70)
  const lowSupplies = sorted.filter((room) => Math.min(room.telemetry.soapLevel, room.telemetry.paperTowelLevel, room.telemetry.toiletPaperLevel) < 30)

  return <div className="content-screen">
    <div className="screen-heading">
      <div><span className="eyebrow">FABRIC SQL TELEMETRY</span><h2>Washroom Intelligence</h2><p>Persisted occupancy, traffic, supplies, and cleaning events.</p></div>
      <span className="database-pill">DATABASE LIVE</span>
    </div>
    <div className="overview-metrics">
      <MetricCard label="Service now" value={String(serviceNow.length)} detail="Urgency score ≥ 70" icon={AlertTriangle} tone="orange"/>
      <MetricCard label="Cleaning soon" value={String(sorted.filter((room) => room.telemetry.cleaningUrgency >= 40 && room.telemetry.cleaningUrgency < 70).length)} icon={Toilet}/>
      <MetricCard label="Supply alerts" value={String(lowSupplies.length)} icon={PackageOpen} tone="yellow"/>
      <MetricCard label="Traffic · 15 min" value={sorted.reduce((sum, room) => sum + room.telemetry.trafficLast15Min, 0).toLocaleString()} icon={Users} tone="green"/>
    </div>
    <div className="washroom-grid">{sorted.map((room) => {
      const supplies = [
        ['Soap', room.telemetry.soapLevel],
        ['Paper towel', room.telemetry.paperTowelLevel],
        ['Toilet paper', room.telemetry.toiletPaperLevel],
      ] as const
      return <article className={`washroom-card ${riskLevel(room.telemetry.cleaningUrgency)}`} key={room.id}>
        <header><div><small>{room.park} · {room.land}</small><h3>{room.name}</h3></div>{room.telemetry.cleaningUrgency >= 40 && <span className={`urgency-indicator ${room.telemetry.cleaningUrgency >= 70 ? 'critical' : 'warning'}`} title={room.telemetry.cleaningUrgency >= 70 ? 'High cleaning urgency' : 'Moderate cleaning urgency'} aria-label={room.telemetry.cleaningUrgency >= 70 ? 'High cleaning urgency' : 'Moderate cleaning urgency'}/>}</header>
        <div className="telemetry-pair"><span className="occupancy-telemetry"><small>Occupancy</small><span className={`occupancy-battery occupancy-${occupancyLevel(room.telemetry.occupancy)}`} role="meter" aria-label={`${room.telemetry.occupancy}% occupancy`} aria-valuenow={room.telemetry.occupancy} aria-valuemin={0} aria-valuemax={100}><i>{Array.from({ length: 5 }, (_, index) => <em className={index < Math.ceil(room.telemetry.occupancy / 20) ? 'active' : ''} key={index}/>)}</i><strong>{room.telemetry.occupancy}%</strong></span></span><span><Toilet size={15}/><strong>{minutesAgo(room.telemetry.lastCleaned)}</strong><small>Last cleaned</small></span></div>
        <div className="supplies"><strong><Droplets size={14}/>Supply levels</strong>{supplies.map(([label, value]) => <label className={`supply-${supplyLevel(value)}`} key={label}><span>{label}<b>{value}%</b></span><i><em style={{ width: `${value}%` }}/></i></label>)}</div>
        <footer><span>Assigned · {room.telemetry.assignedCastMember}</span><strong>{room.telemetry.nextCleaningWindow === 'Now' ? 'Service now' : `Next in ${room.telemetry.nextCleaningWindow}`}</strong></footer>
      </article>
    })}</div>
  </div>
}