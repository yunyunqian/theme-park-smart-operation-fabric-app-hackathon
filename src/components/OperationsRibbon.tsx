import { AlertTriangle, CloudSun, Droplets, TicketCheck, Users, Wrench } from 'lucide-react'
import type { OperationsData } from '../types/operations'

export function OperationsRibbon({ data }: { data: OperationsData }) {
  const open = Math.round(data.rides.filter((ride) => ride.isOpen).length / Math.max(1, data.rides.length) * 100)
  const avg = Math.round(data.rides.filter((ride) => ride.isOpen).reduce((sum, ride) => sum + ride.waitTime, 0) / Math.max(1, data.rides.filter((ride) => ride.isOpen).length))
  const crowd = Math.round(data.parks.reduce((sum, park) => sum + park.guestDensity, 0) / Math.max(1, data.parks.length))
  const stats = [
    [CloudSun, 'Weather', `${Math.round(data.weather.temperature)}° · ${data.weather.precipitationProbability}% rain`],
    [Users, 'Crowd score', `${crowd}/100`], [TicketCheck, 'Resort avg wait', `${avg} min`],
    [TicketCheck, 'Open rides', `${open}%`], [AlertTriangle, 'Active alerts', String(data.alerts.length)],
    [Wrench, 'Maint. tickets', String(data.rideTelemetry.filter((ride) => ride.predictedFailureRisk >= 70).length)],
    [Droplets, 'Cleaning requests', String(data.washrooms.filter((room) => room.telemetry.cleaningUrgency >= 70).length)],
  ] as const
  return <div className="operations-ribbon">{stats.map(([Icon, label, value]) => <div key={label}><Icon size={15}/><span><small>{label}</small><strong>{value}</strong></span></div>)}</div>
}
