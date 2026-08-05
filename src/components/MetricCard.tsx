import type { LucideIcon } from 'lucide-react'

export function MetricCard({ label, value, detail, icon: Icon, tone = 'blue' }: { label: string; value: string; detail?: string; icon: LucideIcon; tone?: string }) {
  return <div className={`metric-card tone-${tone}`}><div className="metric-icon"><Icon size={18}/></div><div><small>{label}</small><strong>{value}</strong>{detail && <span>{detail}</span>}</div></div>
}
