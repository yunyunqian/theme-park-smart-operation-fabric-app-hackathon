import { BrainCircuit, ChevronRight, Sparkles } from 'lucide-react'
import type { OperationsData, ScreenId } from '../types/operations'

export function AIInsightPanel({ data, onNavigate }: { data: OperationsData; onNavigate: (screen: ScreenId) => void }) {
  const insights = data.insights.slice(0, 5)
  const lead = insights[0]
  return <aside className="insight-panel"><div className="panel-title"><span><BrainCircuit size={19}/>AI Operations Summary</span><i className="live-dot"/></div><div className="ai-summary"><Sparkles size={16}/><p>{lead?.description ?? 'No active AI insights are stored in Fabric SQL.'}</p></div><h3>Priority insights</h3><div className="insight-list">{insights.map((insight) => <button key={insight.id} onClick={() => onNavigate(insight.relatedScreen)}><i className={`severity ${insight.severity}`}/><span><strong>{insight.title}</strong><small>{insight.recommendation}</small></span><ChevronRight size={15}/></button>)}</div><footer>Retrieved from AIInsights through the repository layer</footer></aside>
}
