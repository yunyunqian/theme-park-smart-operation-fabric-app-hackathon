import type { OperationsData } from '../types/operations'

const formatDate = (value: string) => new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
}).format(new Date(value))

const includesAny = (query: string, terms: string[]) => terms.some((term) => query.includes(term))

export async function getOperationsAssistantResponse(question: string, data: OperationsData): Promise<string> {
  const query = question.toLowerCase()

  if (includesAny(query, ['risk', 'failure', 'ride health'])) {
    const asset = [...data.rideTelemetry].sort((left, right) => right.predictedFailureRisk - left.predictedFailureRisk)[0]
    if (!asset) return 'No ride telemetry is currently available in Fabric SQL. Check the telemetry ingestion status before assessing ride risk.'
    return `${asset.rideName} has the highest current failure risk at ${asset.predictedFailureRisk}%. Its latest telemetry shows vibration ${asset.vibrationScore} and motor temperature ${asset.motorTemperature}°C. Recommended action: ${asset.recommendedAction}`
  }

  if (includesAny(query, ['incident', 'alert', 'exception'])) {
    const alerts = [...data.alerts].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    if (!alerts.length) return 'No active operational incidents are stored in Fabric SQL.'
    const leading = alerts.slice(0, 3).map((alert) => `${alert.severity.toUpperCase()}: ${alert.location} — ${alert.message}`)
    return `${alerts.length} active incident${alerts.length === 1 ? ' is' : 's are'} stored in Fabric SQL. ${leading.join(' ')}`
  }

  if (includesAny(query, ['wait', 'queue'])) {
    const ride = [...data.rides].sort((left, right) => right.waitTime - left.waitTime)[0]
    if (!ride) return 'No ride wait-time records are currently available in Fabric SQL.'
    return `${ride.name} has the highest current wait at ${ride.waitTime} minutes. It is ${ride.isOpen ? 'open' : 'not operating'} in ${ride.land}, ${ride.park}.`
  }

  if (includesAny(query, ['maintenance', 'scheduled', 'schedule', 'inspection'])) {
    const assets = [...data.rideTelemetry].sort((left, right) => left.nextPlannedMaintenance.localeCompare(right.nextPlannedMaintenance))
    if (!assets.length) return 'No maintenance schedules are currently available in Fabric SQL.'
    const today = new Date().toDateString()
    const scheduledToday = assets.filter((asset) => new Date(asset.nextPlannedMaintenance).toDateString() === today)
    const selected = scheduledToday.length ? scheduledToday : assets.slice(0, 3)
    const prefix = scheduledToday.length ? `${scheduledToday.length} maintenance activit${scheduledToday.length === 1 ? 'y is' : 'ies are'} scheduled today.` : 'No maintenance activities are scheduled for today. The next planned work is:'
    return `${prefix} ${selected.map((asset) => `${asset.rideName} on ${formatDate(asset.nextPlannedMaintenance)} (${asset.predictedFailureRisk}% risk)`).join('; ')}.`
  }

  if (includesAny(query, ['weather', 'rain', 'wind', 'temperature', 'storm'])) {
    if (!data.weather) return 'No weather snapshot is currently available in Fabric SQL. Continue standard monitoring and verify the weather ingestion source.'
    const { precipitationProbability, windSpeed, temperature } = data.weather
    const weatherAlert = data.alerts.find((alert) => alert.category === 'weather')
    const action = weatherAlert ? ` Active weather alert: ${weatherAlert.message}` : ' No active weather alert is stored in Fabric SQL.'
    return `The latest Fabric SQL weather snapshot shows ${Math.round(temperature)}°C, ${precipitationProbability}% precipitation probability, and ${Math.round(windSpeed)} km/h wind.${action}`
  }

  if (includesAny(query, ['crowd', 'congested', 'pressure', 'busy'])) {
    const zone = [...data.crowdZones].sort((left, right) => right.pressureScore - left.pressureScore)[0]
    if (!zone) return 'No crowd-zone records are currently available in Fabric SQL.'
    const park = data.parks.find((item) => item.id === zone.parkId)
    return `${zone.name}${park ? ` in ${park.name}` : ''} has the highest crowd pressure score at ${zone.pressureScore}/100. Prioritize guest-flow monitoring and review nearby queue capacity.`
  }

  if (includesAny(query, ['washroom', 'facility', 'cleaning'])) {
    const room = [...data.washrooms].sort((left, right) => right.telemetry.cleaningUrgency - left.telemetry.cleaningUrgency)[0]
    if (!room) return 'No facility telemetry is currently available in Fabric SQL.'
    return `${room.name} is the highest cleaning priority at ${room.telemetry.cleaningUrgency}/100 urgency and ${room.telemetry.occupancy}% occupancy. It is assigned to ${room.telemetry.assignedCastMember}.`
  }

  const insight = data.insights[0]
  if (insight) return `${insight.title}: ${insight.description} Recommended action: ${insight.recommendation}`

  return 'The connected Fabric SQL snapshot contains no persisted AI insights or active exceptions. Ask about ride risk, incidents, waits, maintenance, crowds, facilities, or weather.'
}