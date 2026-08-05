import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Bot, Building2, Check, Clipboard, Clock3, Database, FerrisWheel, LoaderCircle, MapPinned, MessageSquarePlus, Send, Sparkles, Trash2, User } from 'lucide-react'
import { getOperationsAssistantResponse } from '../services/operationsAssistantService'
import type { AssistantMessage, OperationsData } from '../types/operations'
import { formatTime } from '../utils/dateTime'

const suggestedQuestions = [
  'Which ride has the highest wait time?',
  'Which attraction has the highest failure risk?',
  'Which park is most congested?',
  'Which facility needs cleaning next?',
  'What should the operations manager focus on now?',
]

const followUpQuestions = [
  'Show current operational incidents.',
  'What maintenance activities are scheduled for today?',
  'Recommend actions based on weather conditions.',
]

const greetingMessage = (): AssistantMessage => ({
  id: crypto.randomUUID(),
  role: 'assistant',
  content: "I'm ready to summarize the current resort operations snapshot. Ask about crowds, rides, maintenance, weather, incidents, or guest experience.",
  timestamp: new Date().toISOString(),
})

export function AIAssistant({ data }: { data: OperationsData }) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<AssistantMessage[]>(() => [greetingMessage()])
  const [isResponding, setIsResponding] = useState(false)
  const [error, setError] = useState('')
  const [copiedMessageId, setCopiedMessageId] = useState('')
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

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void submit()
    }
  }

  const clearChat = () => {
    setMessages([])
    setInput('')
    setError('')
    setCopiedMessageId('')
  }

  const startNewConversation = () => {
    setMessages([greetingMessage()])
    setInput('')
    setError('')
    setCopiedMessageId('')
  }

  const copyResponse = async (message: AssistantMessage) => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopiedMessageId(message.id)
      window.setTimeout(() => setCopiedMessageId(''), 1800)
    } catch {
      setError('The response could not be copied. Select the message text and copy it manually.')
    }
  }

  const activeAttractions = data.rides.filter((ride) => ride.isOpen).length
  const latestAssistantId = [...messages].reverse().find((message) => message.role === 'assistant')?.id

  return <div className="assistant-screen">
    <aside className="copilot-rail">
      <header><div className="copilot-mark"><Sparkles/></div><div><h2>Fabric Copilot Pattern</h2><p>AI-powered operations intelligence</p></div></header>
      <section className="copilot-prompts" aria-labelledby="suggested-questions-title"><h3 id="suggested-questions-title">Suggested Questions</h3><div>{suggestedQuestions.map((question) => <button type="button" key={question} onClick={() => void submit(question)} disabled={isResponding}><span>{question}</span><Send/></button>)}</div></section>
      <section className="copilot-context" aria-labelledby="context-connected-title"><div className="context-heading"><Database/><div><h3 id="context-connected-title">Context Connected</h3><span>Fabric SQL live snapshot</span></div><i/></div><div className="context-kpis"><article><MapPinned/><span><strong>{data.parks.length}</strong><small>Parks monitored</small></span></article><article><FerrisWheel/><span><strong>{activeAttractions}</strong><small>Active attractions</small></span></article><article><Building2/><span><strong>{data.washrooms.length}</strong><small>Facilities</small></span></article><article><AlertTriangle/><span><strong>{data.alerts.length}</strong><small>Active alerts</small></span></article><article className="refresh-kpi"><Clock3/><span><strong>{formatTime(data.lastSuccessfulRefresh)}</strong><small>Last refresh</small></span></article></div></section>
    </aside>
    <section className="chat-panel" aria-label="Operations assistant chat">
      <header className="copilot-chat-header"><div className="assistant-identity"><div className="assistant-avatar"><Bot/></div><div><h2>Operations Assistant</h2><span><i/>Fabric SQL Snapshot Connected</span></div></div><div className="conversation-actions"><button type="button" onClick={startNewConversation} title="Start a new conversation"><MessageSquarePlus/><span>New conversation</span></button><button type="button" onClick={clearChat} title="Clear chat history" disabled={!messages.length}><Trash2/><span>Clear chat</span></button></div></header>
      <div className="messages" aria-live="polite">
        {!messages.length && <div className="conversation-empty"><MessageSquarePlus/><h3>Start a new conversation</h3><p>Choose a suggested question or ask about current resort operations.</p><button type="button" onClick={startNewConversation}>Start conversation</button></div>}
        {messages.map((message) => <div className={`copilot-message ${message.role}`} key={message.id}>{message.role === 'assistant' ? <div className="message-avatar"><Bot/></div> : <div className="message-avatar"><User/></div>}<div className="message-stack"><div className="message-bubble"><p>{message.content}</p><footer><time>{formatTime(message.timestamp)}</time>{message.role === 'assistant' && <button type="button" onClick={() => void copyResponse(message)} title="Copy response" aria-label="Copy response">{copiedMessageId === message.id ? <Check/> : <Clipboard/>}<span>{copiedMessageId === message.id ? 'Copied' : 'Copy'}</span></button>}</footer></div>{message.role === 'assistant' && message.id === latestAssistantId && messages.length > 1 && !isResponding && <div className="follow-up-prompts"><span>Suggested follow-ups</span><div>{followUpQuestions.map((question) => <button type="button" key={question} onClick={() => void submit(question)}>{question}</button>)}</div></div>}</div></div>)}
        {isResponding && <div className="copilot-message assistant pending"><div className="message-avatar"><Bot/></div><div className="message-stack"><div className="message-bubble"><div className="typing-status"><LoaderCircle className="spin"/><span>Analyzing the latest Fabric SQL snapshot</span><i/><i/><i/></div></div></div></div>}
        {error && <div className="assistant-error" role="alert"><AlertTriangle/><span>{error}</span></div>}
        <div ref={messagesEnd}/>
      </div>
      <form className="copilot-composer" onSubmit={handleSubmit}><label htmlFor="assistant-prompt">Ask about current resort operations</label><div><textarea id="assistant-prompt" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleComposerKeyDown} placeholder="Ask an operational question..." maxLength={500} rows={2} disabled={isResponding}/><button type="submit" title="Send question" aria-label="Send question" disabled={isResponding || !input.trim()}>{isResponding ? <LoaderCircle className="spin"/> : <Send/>}</button></div><footer><span>Enter to send · Shift+Enter for a new line</span><small>{input.length}/500</small></footer></form>
    </section>
  </div>
}
