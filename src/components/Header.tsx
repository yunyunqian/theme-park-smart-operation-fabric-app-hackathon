import { Bell, CloudSun, Radio } from 'lucide-react'
import type { WeatherSnapshot } from '../types/operations'
import { formatDate, formatTime, minutesAgo } from '../utils/dateTime'

export function Header({ title, weather, refreshedAt, now }: { title: string; weather?: WeatherSnapshot; refreshedAt?: string; now: Date }) {
  return <header className="top-header"><div><span className="eyebrow">Walt Disney World Resort · Operations</span><h1>{title}</h1></div><div className="header-right"><div className="header-stat"><CloudSun size={18}/><span><strong>{weather ? `${Math.round(weather.temperature)}°C` : '--'}</strong><small>{weather ? `${weather.humidity}% humidity` : 'Loading weather'}</small></span></div><div className="header-stat"><Radio size={18}/><span><strong>Fabric SQL</strong><small>{refreshedAt ? minutesAgo(refreshedAt) : 'Connecting'}</small></span></div><div className="clock"><strong>{formatTime(now)}</strong><small>{formatDate(now)}</small></div><button className="icon-button" title="Operational alerts"><Bell size={19}/><i/></button></div></header>
}
