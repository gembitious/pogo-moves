// Scatter chart definitions — axes, tick ranges and iso-value reference curves.
// These reproduce the legacy charts' semantics exactly (same domains, same
// curve equations and labels) so the information shown is unchanged.
import type { MoveCategory, MoveMode } from './types'

export interface IsoCurve {
  label: string
  fn: (x: number) => number
  color: string
}

export interface ChartConfig {
  xLabel: string
  yLabel: string
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  xTicks: number[]
  yTicks: number[]
  curves: IsoCurve[]
}

const range = (start: number, end: number, step: number) => {
  const out: number[] = []
  for (let v = start; v <= end + 1e-9; v += step) out.push(Math.round(v * 100) / 100)
  return out
}

// Three shades of the secondary accent (legacy used MUI darken/lighten 0.3/0.7).
const CURVE = { dark: '#176f84', mid: '#219ebc', light: '#bce2eb' }

const FAST: ChartConfig = {
  xLabel: 'DPT',
  yLabel: 'EPT',
  xMin: 0,
  xMax: 6,
  yMin: 1,
  yMax: 6,
  xTicks: range(0, 6, 1),
  yTicks: range(1, 6, 1),
  curves: [
    { label: 'DPT*EPT^1.5 = 10', fn: (x) => 10 / Math.pow(x, 1.5), color: CURVE.dark },
    { label: 'DPT*EPT^1.5 = 15', fn: (x) => 15 / Math.pow(x, 1.5), color: CURVE.mid },
    { label: 'DPT*EPT^1.5 = 20', fn: (x) => 20 / Math.pow(x, 1.5), color: CURVE.light },
  ],
}

const CHARGED_PVP: ChartConfig = {
  xLabel: 'Energy',
  yLabel: 'DPE',
  xMin: 30,
  xMax: 95,
  yMin: 0,
  yMax: 2.5,
  xTicks: range(30, 90, 5),
  yTicks: range(0, 2.5, 0.5),
  curves: [{ label: 'DPE/Energy = 1/35', fn: (x) => x / 35, color: CURVE.mid }],
}

const CHARGED_PVE: ChartConfig = {
  xLabel: 'DPS',
  yLabel: 'DPE',
  xMin: 0,
  xMax: 80,
  yMin: 0,
  yMax: 3,
  xTicks: range(0, 75, 5),
  yTicks: range(0, 3, 0.5),
  curves: [
    { label: 'DPS*DPE = 20', fn: (x) => 20 / x, color: CURVE.dark },
    { label: 'DPS*DPE = 60', fn: (x) => 60 / x, color: CURVE.mid },
    { label: 'DPS*DPE = 100', fn: (x) => 100 / x, color: CURVE.light },
  ],
}

export function getChartConfig(category: MoveCategory, mode: MoveMode): ChartConfig {
  if (category === 'fast') return FAST
  return mode === 'pve' ? CHARGED_PVE : CHARGED_PVP
}
