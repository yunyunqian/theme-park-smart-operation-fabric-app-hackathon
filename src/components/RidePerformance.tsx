import { useDeferredValue, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowDown, ArrowUp, Minus, Search, X } from 'lucide-react'
import type { OperationsData, RideWaitTime } from '../types/operations'
import { minutesAgo } from '../utils/dateTime'

export function RidePerformance({ data }: { data: OperationsData }) {
  const [query, setQuery] = useState('')
  const [park, setPark] = useState('All parks')
  const [selected, setSelected] = useState<RideWaitTime>()
  const deferredQuery = useDeferredValue(query)
  const rides = data.rides.filter((ride) =>
    (park === 'All parks' || ride.park === park) && ride.name.toLowerCase().includes(deferredQuery.toLowerCase()),
  )
  const byPark = data.parks.map((item) => ({
    name: item.shortName,
    wait: item.averageWait,
    open: item.openAttractions,
    closed: item.closedAttractions,
  }))
  const top = [...data.rides].filter((ride) => ride.isOpen).sort((a, b) => b.waitTime - a.waitTime).slice(0, 3)

  return <div className="content-screen">
    <div className="screen-heading">
      <div><span className="eyebrow">PUBLIC LIVE DATA</span><h2>Ride Performance</h2><p>{data.waitTimeSource} · updated {minutesAgo(data.lastSuccessfulRefresh)}</p></div>
      <div className="filters">
        <label className="search"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search attractions"/></label>
        <select value={park} onChange={(event) => setPark(event.target.value)}><option>All parks</option>{data.parks.map((item) => <option key={item.id}>{item.name}</option>)}</select>
      </div>
    </div>
    <div className="chart-grid">
      <section className="chart-panel">
        <h3>Average wait by park</h3>
        <ResponsiveContainer width="100%" height={190}><BarChart data={byPark}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="wait" fill="#2d7ff9" radius={[4, 4, 0, 0]}/></BarChart></ResponsiveContainer>
      </section>
      <section className="chart-panel top-waits-panel">
        <h3>Top 3 longest waits</h3>
        <div className="top-wait-cards">{top.map((ride, index) => <button key={ride.id} onClick={() => setSelected(ride)}><span className="wait-rank">{String(index + 1).padStart(2, '0')}</span><span className="wait-ride"><strong>{ride.name}</strong><small>{ride.park} · {ride.land}</small></span><span className="wait-value"><strong>{ride.waitTime}</strong><small>min</small></span></button>)}</div>
      </section>
    </div>
    <section className="table-panel"><table><thead><tr><th>Attraction</th><th>Park / land</th><th>Wait</th><th>Status</th><th>Trend</th><th>Updated</th></tr></thead><tbody>{rides.slice(0, 18).map((ride) => <tr key={ride.id} onClick={() => setSelected(ride)}><td><strong>{ride.name}</strong></td><td>{ride.park}<small>{ride.land}</small></td><td><b>{ride.waitTime} min</b></td><td><span className={`availability ${ride.isOpen ? 'open' : 'closed'}`}>{ride.isOpen ? 'Open' : 'Closed'}</span></td><td>{ride.trend === 'up' ? <ArrowUp className="trend-up" size={17}/> : ride.trend === 'down' ? <ArrowDown className="trend-down" size={17}/> : <Minus size={17}/>}</td><td>{minutesAgo(ride.lastUpdated)}</td></tr>)}</tbody></table></section>
    {selected && <aside className="details-drawer"><button className="drawer-close" onClick={() => setSelected(undefined)}><X/></button><span className="eyebrow">ATTRACTION DETAIL</span><h2>{selected.name}</h2><p>{selected.park} · {selected.land}</p><div className="wait-hero"><strong>{selected.waitTime}</strong><span>minute<br/>current wait</span></div><dl><div><dt>Operating status</dt><dd>{selected.isOpen ? 'Open' : 'Closed'}</dd></div><div><dt>Trend</dt><dd>{selected.trend}</dd></div><div><dt>Last update</dt><dd>{minutesAgo(selected.lastUpdated)}</dd></div></dl></aside>}
  </div>
}