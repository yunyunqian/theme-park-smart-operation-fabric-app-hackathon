import { Activity, Bot, Gauge, Map, TableProperties, Wrench, type LucideIcon } from 'lucide-react'
import type { ScreenId } from '../types/operations'

const items: Array<{ id: ScreenId; label: string; icon: LucideIcon }> = [
  { id: 'operations', label: 'Operations Map', icon: Map }, { id: 'crowd', label: 'Crowd Heat Map', icon: Activity },
  { id: 'rides', label: 'Ride Performance', icon: TableProperties }, { id: 'washrooms', label: 'Washroom Intelligence', icon: Gauge },
  { id: 'maintenance', label: 'Predictive Maintenance', icon: Wrench }, { id: 'assistant', label: 'AI Operations Assistant', icon: Bot },
]

export function Sidebar({ active, onChange }: { active: ScreenId; onChange: (id: ScreenId) => void }) {
  return <aside className="sidebar"><div className="brand"><span className="brand-mark">OC</span><div><strong>Operations</strong><small>Command Centre</small></div></div><nav aria-label="Command center screens">{items.map(({ id, label, icon: Icon }) => <button key={id} className={active === id ? 'active' : ''} onClick={() => onChange(id)} title={label}><Icon size={19}/><span>{label}</span></button>)}</nav><div className="fabric-status"><i/><div><strong>Fabric stream active</strong><small>12.4K events/min</small></div></div></aside>
}
