import { describe, it, expect } from 'vitest'
import { pvpDamage, breakpointAtk, typeMultiplier } from './damage'

describe('pvpDamage', () => {
  it('matches the hand-computed formula', () => {
    // 8 power, STAB, neutral, atk=def=100: ⌊8×1.2×1×1×0.5×1.3⌋+1 = ⌊6.24⌋+1 = 7
    expect(pvpDamage({ power: 8, atk: 100, def: 100, stab: true, effectiveness: 1 })).toBe(7)
    // no STAB lowers it
    expect(pvpDamage({ power: 8, atk: 100, def: 100, stab: false, effectiveness: 1 })).toBe(6)
    // higher attack raises it
    expect(pvpDamage({ power: 8, atk: 113, def: 100, stab: true, effectiveness: 1 })).toBe(8)
  })
})

describe('breakpointAtk', () => {
  it('finds the Attack stat where damage steps up', () => {
    // next breakpoint to deal 8 (from 7) at def 100, STAB, neutral, power 8
    const bp = breakpointAtk(8, 100, true, 1, 8)
    expect(bp).toBeCloseTo(112.18, 1)
    // at ⌈bp⌉ the damage is indeed 8, and just below it is 7
    expect(pvpDamage({ power: 8, atk: Math.ceil(bp), def: 100, stab: true, effectiveness: 1 })).toBe(8)
    expect(pvpDamage({ power: 8, atk: Math.floor(bp), def: 100, stab: true, effectiveness: 1 })).toBe(7)
  })
})

describe('typeMultiplier', () => {
  it('combines effectiveness across defender types', () => {
    // water vs fire/ground = 1.6 × 1.6 = 2.56
    expect(typeMultiplier('water', ['fire', 'ground'])).toBeCloseTo(2.56, 4)
    // fire vs water = resisted
    expect(typeMultiplier('fire', ['water'])).toBeCloseTo(0.625, 4)
  })
})
