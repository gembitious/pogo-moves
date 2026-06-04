import { describe, it, expect } from 'vitest'
import { defMultiplier, teamDefense, teamOffense } from './teamCoverage'

describe('defMultiplier', () => {
  it('multiplies effectiveness across a defender’s types', () => {
    // fire/ground takes double super-effective from water
    expect(defMultiplier('water', ['fire', 'ground'])).toBeCloseTo(2.56, 5)
    // grass vs water/flying: SE × resisted = neutral
    expect(defMultiplier('grass', ['water', 'flying'])).toBeCloseTo(1, 5)
    // single resist
    expect(defMultiplier('fire', ['water'])).toBeCloseTo(0.625, 5)
  })
})

describe('teamDefense', () => {
  it('counts how many members are weak to each attacking type', () => {
    const rows = teamDefense([['water'], ['ground'], ['fire']])
    expect(rows).toHaveLength(18)
    const grass = rows.find((r) => r.type === 'grass')!
    // grass hits water (weak) and ground (weak), not fire (resist)
    expect(grass.weak).toBe(2)
    expect(grass.resist).toBe(1)
  })
})

describe('teamOffense', () => {
  it('flags mono-types the team can hit super-effectively via STAB', () => {
    const cov = teamOffense([['water'], ['grass']])
    expect(cov.fire).toBe(true) // water SE vs fire
    expect(cov.water).toBe(true) // grass SE vs water
    expect(cov.dragon).toBe(false) // neither water nor grass is SE vs dragon
  })
})
