import { useState } from 'react'
import { Bot, Send, Sparkles, User } from 'lucide-react'
import type { AssistantMessage, OperationsData } from '../types/operations'
import { formatTime } from '../utils/dateTime'

const samples = ['Which ride has the highest wait time?', 'Which park is most congested?', 'Which washroom needs cleaning next?', 'Which ride has the highest failure risk?', 'What should the operations manager focus on now?']

export function AIAssistant({ data }: { data: OperationsData }) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<AssistantMessage[]>([{ id: 'hello', role: 'assistant', content: 'Connected to the Fabric SQL operational snapshot. Ask about crowds, rides, facilities, alerts, or maintenance risk.', timestamp: new Date().toISOString() }])
  const answer = (question: string) => {
    const query = question.toLowerCase()
    const longest = [...data.rides].sort((left, right) => right.waitTime - left.waitTime)[0]
    const park = [...data.parks].sort((left, right) => right.guestDensity - left.guestDensity)[0]
    const room = [...data.washrooms].sort((left, right) => right.telemetry.cleaningUrgency - left.telemetry.cleaningUrgency)[0]
    const asset = [...data.rideTelemetry].sort((left, right) => right.predictedFailureRisk - left.predictedFailureRisk)[0]
    const insight = data.insights[0]
    if (query.includes('highest wait') && longest) return `${longest.name} has the highest persisted wait at ${longest.waitTime} minutes. It is currently ${longest.isOpen ? 'open' : 'not operating'} in ${longest.land}.`
    if (query.includes('most congested') && park) return `${park.name} has the highest database crowd score at ${park.guestDensity}/100, with an average ride wait of ${park.averageWait} minutes.`
    if (query.includes('washroom') && room) return `${room.name} is the next cleaning priority. Its latest telemetry shows urgency ${room.telemetry.cleaningUrgency}/100, occupancy ${room.telemetry.occupancy}%, and assignment to ${room.telemetry.assignedCastMember}.`
    if (query.includes('failure risk') && asset) return `${asset.rideName} has the highest maintenance risk at ${asset.predictedFailureRisk}%. Latest telemetry: vibration ${asset.vibrationScore}, motor temperature ${asset.motorTemperature}°C. ${asset.recommendedAction}`
    if (insight) return `${insight.title}: ${insight.description} Recommended action: ${insight.recommendation}`
    const alert = data.alerts[0]
    return alert ? `${alert.location}: ${alert.message}` : 'No active operational exceptions are stored in the database.'
  }
  const submit = (question = input) => {
    const value = question.trim()
    if (!value) return
    const timestamp = new Date().toISOString()
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', content: value, timestamp }, { id: crypto.randomUUID(), role: 'assistant', content: answer(value), timestamp }])
    setInput('')
  }
  return <div className="assistant-screen"><aside className="assistant-context"><Sparkles/><h2>Database context</h2><p>Answers are derived from the latest repository snapshot and persisted AI insights.</p><div><strong>{data.rides.length}</strong><span>rides</span></div><div><strong>{data.washrooms.length}</strong><span>facilities</span></div><div><strong>{data.alerts.length}</strong><span>active alerts</span></div></aside><section className="chat-panel"><header><Bot/><div><strong>Operations Assistant</strong><small><i/>Fabric SQL snapshot connected</small></div></header><div className="messages">{messages.map((message) => <div className={`message ${message.role}`} key={message.id}>{message.role === 'assistant' ? <Bot/> : <User/>}<span><p>{message.content}</p><small>{formatTime(message.timestamp)}</small></span></div>)}</div><div className="suggestions">{samples.map((sample) => <button key={sample} onClick={() => submit(sample)}>{sample}</button>)}</div><form onSubmit={(event) => { event.preventDefault(); submit() }}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about current resort operations"/><button type="submit" title="Send"><Send/></button></form></section></div>
}
