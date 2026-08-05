import { lazy, Suspense, useEffect, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import './App.css'
import { AuthPage } from './components/AuthPage'
import { CrowdHeatMap } from './components/CrowdHeatMap'
import { Header } from './components/Header'
import { OperationsCommandCenter } from './components/OperationsCommandCenter'
import { PredictiveMaintenance } from './components/PredictiveMaintenance'
import { RidePerformance } from './components/RidePerformance'
import { Sidebar } from './components/Sidebar'
import { WashroomIntelligence } from './components/WashroomIntelligence'
import { useAuth } from './hooks/AuthContext'
import { DatabaseSeedService } from './services/databaseSeedService'
import { DatabaseSimulationService } from './services/databaseSimulationService'
import { OperationsService } from './services/operationsService'
import type { OperationsData, ScreenId } from './types/operations'

const AIAssistant = lazy(() => import('./components/AIAssistant').then((module) => ({ default: module.AIAssistant })))

const titles: Record<ScreenId, string> = {
  operations: 'Smart operations', crowd: 'Crowd Heat Map', rides: 'Ride Performance & Wait Times',
  washrooms: 'Washroom Intelligence', maintenance: 'Predictive Maintenance', assistant: 'AI Operations Assistant',
}

function App() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [activeScreen, setActiveScreen] = useState<ScreenId>('operations')
  const [data, setData] = useState<OperationsData>()
  const [error, setError] = useState('')
  const [simulationError, setSimulationError] = useState('')
  const [now, setNow] = useState(new Date())
  const [demoMode, setDemoMode] = useState(() => localStorage.getItem('parkpulse-demo-mode') !== 'off')

  useEffect(() => {
    localStorage.setItem('parkpulse-demo-mode', demoMode ? 'on' : 'off')
  }, [demoMode])

  useEffect(() => {
    const clockTimer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(clockTimer)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    const operations = new OperationsService()
    const simulation = new DatabaseSimulationService()
    const refresh = async () => {
      try {
        const snapshot = await operations.getSnapshot()
        if (!cancelled) { setData(snapshot); setError('') }
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Unable to load Fabric SQL operations data.')
      }
    }
    const initialize = async () => {
      await new DatabaseSeedService().seedIfEmpty()
      await refresh()
      if (demoMode) simulation.start(refresh, (reason) => {
        if (!cancelled) setSimulationError(reason instanceof Error ? `Demo Mode: ${reason.message}` : 'Demo Mode could not persist telemetry.')
      })
    }
    void initialize().catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to initialize Fabric SQL.'))
    const dataTimer = window.setInterval(refresh, 30_000)
    return () => { cancelled = true; simulation.stop(); window.clearInterval(dataTimer) }
  }, [demoMode, isAuthenticated])

  if (authLoading) return <div className="loading-state"><i/><strong>Establishing Fabric identity</strong></div>
  if (!isAuthenticated) return <AuthPage/>

  const screen = data && {
    operations: <OperationsCommandCenter data={data} onNavigate={setActiveScreen}/>, crowd: <CrowdHeatMap data={data}/>,
    rides: <RidePerformance data={data}/>, washrooms: <WashroomIntelligence data={data}/>,
    maintenance: <PredictiveMaintenance data={data}/>, assistant: <Suspense fallback={<div className="loading-state"><i/><strong>Loading Operations Assistant</strong></div>}><AIAssistant data={data}/></Suspense>,
  }[activeScreen]

  const visibleError = error || simulationError
  return <div className="app-shell"><Sidebar active={activeScreen} onChange={setActiveScreen}/><main className="app-main"><Header title={titles[activeScreen]} weather={data?.weather} refreshedAt={data?.lastSuccessfulRefresh} now={now} demoMode={demoMode} onDemoModeChange={setDemoMode}/>{visibleError ? <div className="error-state">{visibleError}</div> : data ? screen : <div className="loading-state"><i/><strong>Querying Fabric SQL operational tables</strong><span>Generated APIs · repositories · persisted telemetry</span></div>}</main></div>
}

export default App
