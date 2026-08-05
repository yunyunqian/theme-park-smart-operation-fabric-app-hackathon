import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AIAssistant } from '../components/AIAssistant'
import * as assistantService from '../services/operationsAssistantService'
import { getOperationsAssistantResponse } from '../services/operationsAssistantService'
import type { OperationsData } from '../types/operations'

const now = new Date().toISOString()

const data: OperationsData = {
  parks: [{ id: 'park-1', name: 'Adventure Park', shortName: 'AP', latitude: 0, longitude: 0, color: '#123456', status: 'Busy', averageWait: 42, longestWait: 70, busiestAttraction: 'Summit Run', openAttractions: 2, closedAttractions: 0, guestDensity: 78, temperature: 33, operationalHealth: 88, lastUpdated: now }],
  rides: [
    { id: 'ride-1', name: 'Summit Run', parkId: 'park-1', park: 'Adventure Park', land: 'North Ridge', latitude: 0, longitude: 0, waitTime: 70, isOpen: true, lastUpdated: now, trend: 'up' },
    { id: 'ride-2', name: 'River Loop', parkId: 'park-1', park: 'Adventure Park', land: 'River District', latitude: 0, longitude: 0, waitTime: 20, isOpen: true, lastUpdated: now, trend: 'stable' },
  ],
  weather: { temperature: 33, apparentTemperature: 35, humidity: 70, precipitationProbability: 65, windSpeed: 12, uvIndex: 0, weatherCode: 2, observedAt: now, source: 'database' },
  washrooms: [{ id: 'room-1', name: 'North Ridge Facility', park: 'Adventure Park', land: 'North Ridge', latitude: 0, longitude: 0, type: 'Guest', capacity: 20, accessible: true, telemetry: { washroomId: 'room-1', occupancy: 82, trafficLast15Min: 35, lastCleaned: now, assignedCastMember: 'Facilities North', soapLevel: 60, paperTowelLevel: 50, toiletPaperLevel: 70, maintenanceIssueCount: 0, cleaningUrgency: 86, nextCleaningWindow: now } }],
  rideTelemetry: [{ rideId: 'ride-1', rideName: 'Summit Run', park: 'Adventure Park', land: 'North Ridge', assetType: 'Coaster', currentStatus: 'Open', operatingHoursToday: 8, cycleCountToday: 460, motorTemperature: 79, vibrationScore: 72, downtimeFrequency: 2, faultCode: null, lastInspectionDate: now, nextPlannedMaintenance: now, predictedFailureRisk: 81, recommendedAction: 'Inspect the drive assembly.' }],
  crowdZones: [{ id: 'zone-1', name: 'North Ridge', parkId: 'park-1', waitTimeNormalized: 88, simulatedTraffic: 88, weatherImpact: 0, pressureScore: 88 }],
  alerts: [{ id: 'alert-1', category: 'ride', severity: 'critical', message: 'Drive vibration exceeded the operating threshold.', location: 'Summit Run', createdAt: now }],
  insights: [{ id: 'insight-1', category: 'maintenance', severity: 'high', title: 'Inspection recommended', description: 'Summit Run risk is elevated.', relatedScreen: 'maintenance', recommendation: 'Inspect Summit Run before the evening peak.', createdTime: now }],
  weatherAvailable: true,
  lastSuccessfulRefresh: now,
  waitTimeSource: 'Fabric SQL',
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('operations assistant responses', () => {
  it('answers each supported operational domain from the SQL snapshot', async () => {
    await expect(getOperationsAssistantResponse('Which rides are most at risk today?', data)).resolves.toContain('Summit Run')
    await expect(getOperationsAssistantResponse('Show current operational incidents.', data)).resolves.toContain('Drive vibration')
    await expect(getOperationsAssistantResponse('Which park area has the highest wait times?', data)).resolves.toContain('70 minutes')
    await expect(getOperationsAssistantResponse('What maintenance activities are scheduled for today?', data)).resolves.toContain('scheduled today')
    await expect(getOperationsAssistantResponse('Recommend actions based on weather conditions.', data)).resolves.toContain('wet-weather')
  })

  it('returns friendly domain-specific empty states', async () => {
    const emptyData = { ...data, rides: [], rideTelemetry: [], alerts: [], crowdZones: [], washrooms: [], insights: [], weatherAvailable: false }
    await expect(getOperationsAssistantResponse('Which rides are most at risk today?', emptyData)).resolves.toContain('No ride telemetry')
    await expect(getOperationsAssistantResponse('Show current operational incidents.', emptyData)).resolves.toContain('No active operational incidents')
    await expect(getOperationsAssistantResponse('Which park area has the highest wait times?', emptyData)).resolves.toContain('No ride wait-time records')
    await expect(getOperationsAssistantResponse('Recommend actions based on weather conditions.', emptyData)).resolves.toContain('No weather snapshot')
  })
})

describe('AIAssistant', () => {
  it('shows a chatbot-only first-time experience and all suggested questions', () => {
    render(<AIAssistant data={data}/>)

    expect(screen.getByRole('heading', { name: 'Ask about current operations' })).toBeInTheDocument()
    expect(screen.queryByText('Operations snapshot')).not.toBeInTheDocument()
    expect(screen.queryByText('Current priorities')).not.toBeInTheDocument()
    expect(screen.getByText('Which rides are most at risk today?')).toBeInTheDocument()
    expect(screen.getByText('Show current operational incidents.')).toBeInTheDocument()
    expect(screen.getByText('Which park area has the highest wait times?')).toBeInTheDocument()
    expect(screen.getByText('What maintenance activities are scheduled for today?')).toBeInTheDocument()
    expect(screen.getByText('Recommend actions based on weather conditions.')).toBeInTheDocument()
  })

  it('guards empty input and displays a grounded response', async () => {
    const user = userEvent.setup()
    render(<AIAssistant data={data}/>)
    const send = screen.getByRole('button', { name: 'Send question' })

    expect(send).toBeDisabled()
    const input = screen.getByLabelText('Ask about current resort operations')
    await user.type(input, 'Which rides are most at risk today?')
    await user.click(send)

    expect(await screen.findByText(/highest current failure risk at 81%/)).toBeInTheDocument()
    expect(input).toHaveValue('')
  })

  it.each([
    ['Which rides are most at risk today?', 'highest current failure risk'],
    ['Show current operational incidents.', 'active incident'],
    ['Which park area has the highest wait times?', '70 minutes'],
    ['What maintenance activities are scheduled for today?', 'scheduled today'],
    ['Recommend actions based on weather conditions.', 'wet-weather'],
  ])('submits suggested question: %s', async (question, expected) => {
    const user = userEvent.setup()
    render(<AIAssistant data={data}/>)

    await user.click(screen.getByRole('button', { name: question }))
    expect(await screen.findByText(new RegExp(expected))).toBeInTheDocument()
  })

  it('shows progress while responding and a friendly service error', async () => {
    let rejectResponse: (reason?: unknown) => void = () => undefined
    vi.spyOn(assistantService, 'getOperationsAssistantResponse').mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectResponse = reject }))
    render(<AIAssistant data={data}/>)

    fireEvent.change(screen.getByLabelText('Ask about current resort operations'), { target: { value: 'Show incidents' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send question' }))
    expect(screen.getByText('Analyzing the latest Fabric SQL snapshot...')).toBeInTheDocument()

    rejectResponse(new Error('Unavailable'))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('temporarily unavailable'))
    expect(screen.getByRole('button', { name: 'Send question' })).toBeDisabled()
  })
})