import type { RiskLevel } from '../types/operations'

export const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value))
export const riskLevel = (score: number): RiskLevel => score >= 85 ? 'critical' : score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low'
export const formatPercent = (value: number) => `${Math.round(value)}%`
export const formatWait = (value: number) => `${Math.round(value)} min`
export const heatColor = (score: number) => score >= 85 ? '#e5484d' : score >= 70 ? '#f08c32' : score >= 40 ? '#eab308' : '#22a06b'
