import { AlertTriangle, Clock3, MapPin, RadioTower } from 'lucide-react'
import type { OperationsData, ScreenId } from '../types/operations'
import { AIInsightPanel } from './AIInsightPanel'
import { MetricCard } from './MetricCard'
import { OperationsRibbon } from './OperationsRibbon'
import { ResortMap } from './ResortMap'

export function OperationsCommandCenter({ data, onNavigate }: { data: OperationsData; onNavigate: (screen: ScreenId) => void }) {
  const openRides = data.rides.filter((ride) => ride.isOpen)
  const averageWait = Math.round(openRides.reduce((sum, ride) => sum + ride.waitTime, 0) / Math.max(1, openRides.length))
  const availability = Math.round(openRides.length / Math.max(1, data.rides.length) * 100)
  return <div className="operations-screen"><OperationsRibbon data={data}/><div className="overview-metrics"><MetricCard label="Parks monitored" value={String(data.parks.length)} detail="From Fabric SQL" icon={MapPin} tone="green"/><MetricCard label="Average wait" value={`${averageWait} min`} detail="Across open attractions" icon={Clock3}/><MetricCard label="Ride availability" value={`${availability}%`} detail={`${openRides.length} attractions operating`} icon={RadioTower} tone="green"/><MetricCard label="Operational alerts" value={String(data.alerts.length)} detail="Requires attention" icon={AlertTriangle} tone="orange"/></div><div className="command-grid"><ResortMap data={data}/><AIInsightPanel data={data} onNavigate={onNavigate}/></div><div className="park-strip">{data.parks.map((park) => <div key={park.id}><span className={`park-code status-${park.status.toLowerCase()}`}>{park.shortName}</span><span><strong>{park.name}</strong><small>{park.averageWait} min avg wait</small></span><div className="health-mini"><small>Health</small><strong>{park.operationalHealth}%</strong></div></div>)}</div></div>
}
