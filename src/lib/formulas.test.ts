import { describe, expect, it } from 'vitest'
import {
  chargedDpe,
  chargedPveDps,
  fastPveDpe,
  fastPveDps,
  fastPveEps,
  fastPvpDpt,
  fastPvpEpt,
  round2,
} from '@/lib/formulas'

describe('round2', () => {
  it('rounds to two decimals', () => {
    expect(round2(1.666)).toBe(1.67)
    expect(round2(2 / 3)).toBe(0.67)
    expect(round2(4)).toBe(4)
  })
})

describe('fast move PvP', () => {
  it('DPT = power / turn', () => {
    expect(fastPvpDpt({ power: 8, turn: 2, energyGain: 10 })).toBe(4)
    expect(fastPvpDpt({ power: 5, turn: 3, energyGain: 7 })).toBe(1.67)
  })
  it('EPT = energyGain / turn', () => {
    expect(fastPvpEpt({ power: 8, turn: 2, energyGain: 10 })).toBe(5)
    expect(fastPvpEpt({ power: 5, turn: 3, energyGain: 7 })).toBe(2.33)
  })
})

describe('fast move PvE', () => {
  const m = { power: 12, energyGain: 8, duration: 1.5, damageWindowStart: 0.5, damageWindowEnd: 1 }
  it('DPS / EPS / DPE', () => {
    expect(fastPveDps(m)).toBe(8)
    expect(fastPveEps(m)).toBe(5.33)
    expect(fastPveDpe(m)).toBe(1.5)
  })
})

describe('charged moves', () => {
  it('PvP DPE = power / energy', () => {
    expect(chargedDpe({ power: 90, energy: 45 })).toBe(2)
    expect(chargedDpe({ power: 100, energy: 55 })).toBe(1.82)
  })
  it('PvE DPS = power / duration', () => {
    expect(chargedPveDps({ power: 100, energy: 50, duration: 2.5, damageWindowStart: 1, damageWindowEnd: 2 })).toBe(40)
  })
})
