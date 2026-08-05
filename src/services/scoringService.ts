import { clamp, riskLevel } from '../utils/formatters'

export class CrowdDensityEngine {
  static calculate(waitTimeNormalized: number, simulatedTraffic: number, weatherImpact: number) {
    return Math.round(clamp(waitTimeNormalized * 0.5 + simulatedTraffic * 0.3 + weatherImpact * 0.2))
  }

  static level(score: number) { return riskLevel(score) }
}

export const cleaningUrgencyScore = (
  occupancy: number, trafficLast15Min: number, minutesSinceCleaned: number,
  supplyLevels: number[], maintenanceIssues: number,
) => {
  const traffic = clamp(trafficLast15Min / 2)
  const age = clamp(minutesSinceCleaned / 1.8)
  const lowSupplyPenalty = 100 - Math.min(...supplyLevels)
  const maintenancePenalty = clamp(maintenanceIssues * 35)
  return Math.round(clamp(occupancy * 0.25 + traffic * 0.25 + age * 0.25 + lowSupplyPenalty * 0.15 + maintenancePenalty * 0.1))
}

export const maintenanceRiskScore = (
  vibrationScore: number, motorTemperature: number, downtimeFrequency: number, cycleCount: number,
) => {
  const temperatureRisk = clamp((motorTemperature - 45) * 2.4)
  const downtimeRisk = clamp(downtimeFrequency * 20)
  const cycleRisk = clamp((cycleCount / 900) * 100)
  return Math.round(clamp(vibrationScore * 0.35 + temperatureRisk * 0.25 + downtimeRisk * 0.2 + cycleRisk * 0.2))
}
