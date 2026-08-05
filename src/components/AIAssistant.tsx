import { FormEvent, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Bot, LoaderCircle, Send, Sparkles, User } from 'lucide-react'
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

export function AIAssistant({ data }: { data: OperationsData }) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [isResponding, setIsResponding] = useState(false)
  const [error, setError] = useState('')
  const messagesEnd = useRef<HTMLDivElement>(null)

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
