import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Bot, CloudSun, LoaderCircle, Send, Sparkles, Users, User, Wrench } from 'lucide-react'
import { getOperationsAssistantResponse } from '../services/operationsAssistantService'
import type { AssistantMessage, OperationsData } from '../types/operations'
import { formatTime } from '../utils/dateTime'

const suggestedQuestions = [
  'Which rides are most at risk today?',
  'Show current operational incidents.',
  'Which park area has the highest wait times?',
  'What maintenance activities are scheduled for today?',
  'Recommend actions based on weather conditions.',
]

const summaryItems = (data: OperationsData) => {
  const highestRisk = [...data.rideTelemetry].sort((left, right) => right.predictedFailureRisk - left.predictedFailureRisk)[0]
  const busiestZone = [...data.crowdZones].sort((left, right) => right.pressureScore - left.pressureScore)[0]
  const maintenanceInsight = data.insights.find((insight) => insight.category === 'maintenance')
  const crowdInsight = data.insights.find((insight) => insight.category === 'crowd')
  const weatherInsight = data.insights.find((insight) => insight.category === 'weather')
  const criticalAlert = data.alerts.find((alert) => (alert.category === 'ride' || alert.category === 'maintenance') && (alert.severity === 'critical' || alert.severity === 'high'))

  return [
    { key: 'alert', icon: AlertTriangle, title: 'Critical ride alerts', tone: 'critical', text: criticalAlert ? `${criticalAlert.location}: ${criticalAlert.message}` : 'No high or critical ride alerts are active.' },
    { key: 'maintenance', icon: Wrench, title: 'Maintenance', tone: 'warning', text: maintenanceInsight?.recommendation ?? (highestRisk ? `${highestRisk.rideName} leads risk at ${highestRisk.predictedFailureRisk}%. ${highestRisk.recommendedAction}` : 'No maintenance telemetry is available.') },
    { key: 'crowd', icon: Users, title: 'Crowd management', tone: 'information', text: crowdInsight?.recommendation ?? (busiestZone ? `${busiestZone.name} leads crowd pressure at ${busiestZone.pressureScore}/100.` : 'No crowd-zone data is available.') },
    { key: 'weather', icon: CloudSun, title: 'Weather advisory', tone: 'neutral', text: weatherInsight?.recommendation ?? (data.weatherAvailable ? `${Math.round(data.weather.temperature)}°C with ${data.weather.precipitationProbability}% precipitation probability and ${Math.round(data.weather.windSpeed)} km/h wind.` : 'No weather snapshot is currently available in Fabric SQL.') },
  ]
}

export function AIAssistant({ data }: { data: OperationsData }) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [isResponding, setIsResponding] = useState(false)
  const [error, setError] = useState('')
  const messagesEnd = useRef<HTMLDivElement>(null)
  const summaries = useMemo(() => summaryItems(data), [data])

  useEffect(() => {
    messagesEnd.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
  }, [isResponding, messages])

  const submit = async (question = input) => {
    const value = question.replace(/\s+/g, ' ').trim().slice(0, 500)
    if (!value || isResponding) return
    const userMessage: AssistantMessage = { id: crypto.randomUUID(), role: 'user', content: value, timestamp: new Date().toISOString() }
    setMessages((current) => [...current, userMessage])
    setInput('')
    setError('')
    setIsResponding(true)
    try {
      const content = await getOperationsAssistantResponse(value, data)
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', content, timestamp: new Date().toISOString() }])
    } catch {
      setError('The operations assistant is temporarily unavailable. Your Fabric SQL data is still connected; please try again.')
    } finally {
      setIsResponding(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void submit()
  }

  return <div className="assistant-screen">
    <aside className="assistant-context">
      <div className="assistant-context-heading"><Sparkles/><div><span>FABRIC SQL CONTEXT</span><h2>Operations snapshot</h2></div></div>
      <p>Answers use the latest repository snapshot and persisted AI insights. No chat content is stored.</p>
      <div className="assistant-kpis"><div><strong>{data.rides.length}</strong><span>rides</span></div><div><strong>{data.washrooms.length}</strong><span>facilities</span></div><div><strong>{data.alerts.length}</strong><span>active alerts</span></div><div><strong>{data.insights.length}</strong><span>AI insights</span></div></div>
      <section className="operations-summary" aria-labelledby="operations-summary-title">
        <header><span>AI OPERATIONS SUMMARY</span><h3 id="operations-summary-title">Current priorities</h3></header>
        <div>{summaries.map((item) => <article className={item.tone} key={item.key}><item.icon/><div><strong>{item.title}</strong><p>{item.text}</p></div></article>)}</div>
      </section>
    </aside>
    <section className="chat-panel" aria-label="Operations assistant chat">
      <header><Bot/><div><strong>Operations Assistant</strong><small><i/>Fabric SQL snapshot connected</small></div></header>
      <div className="messages" aria-live="polite">
        {!messages.length && <div className="assistant-welcome"><Sparkles/><h3>Ask about current operations</h3><p>Select a suggested question or enter your own. Responses are grounded in the latest rides, incidents, maintenance, crowd, facility, weather, and insight records.</p><div className="suggestions">{suggestedQuestions.map((question) => <button type="button" key={question} onClick={() => void submit(question)} disabled={isResponding}>{question}</button>)}</div></div>}
        {messages.map((message) => <div className={`message ${message.role}`} key={message.id}>{message.role === 'assistant' ? <Bot/> : <User/>}<span><p>{message.content}</p><small>{formatTime(message.timestamp)}</small></span></div>)}
        {isResponding && <div className="message assistant pending"><LoaderCircle className="spin"/><span><p>Analyzing the latest Fabric SQL snapshot...</p></span></div>}
        {error && <div className="assistant-error" role="alert"><AlertTriangle/><span>{error}</span></div>}
        <div ref={messagesEnd}/>
      </div>
      <form onSubmit={handleSubmit}><label htmlFor="assistant-prompt">Ask about current resort operations</label><div><input id="assistant-prompt" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about rides, incidents, crowds, maintenance, or weather" maxLength={500} disabled={isResponding}/><button type="submit" title="Send question" aria-label="Send question" disabled={isResponding || !input.trim()}>{isResponding ? <LoaderCircle className="spin"/> : <Send/>}</button></div><small>{input.length}/500</small></form>
    </section>
  </div>
}
