import { describe, expect, it } from 'vitest'
import { EFFECT_MULTIPLIER, TYPE_MATRIX, getEffectiveness } from '@/lib/typeEffectiveness'
import { POKEMON_TYPES } from '@/lib/types'

describe('getEffectiveness', () => {
  it('super effective', () => {
    expect(getEffectiveness('water', 'fire')).toBe('super_effective')
    expect(getEffectiveness('fire', 'grass')).toBe('super_effective')
  })
  it('resisted', () => {
    expect(getEffectiveness('fire', 'water')).toBe('resisted')
    expect(getEffectiveness('water', 'grass')).toBe('resisted')
  })
  it('GO double-resist replaces a main-series immunity', () => {
    expect(getEffectiveness('electric', 'ground')).toBe('doubly_resisted')
    expect(getEffectiveness('normal', 'ghost')).toBe('doubly_resisted')
    expect(getEffectiveness('ghost', 'normal')).toBe('doubly_resisted')
  })
  it('neutral otherwise', () => {
    expect(getEffectiveness('normal', 'normal')).toBe('netural')
    expect(getEffectiveness('water', 'electric')).toBe('netural')
  })
})

describe('EFFECT_MULTIPLIER', () => {
  it('uses GO values (no immunity; ×0 becomes a double resist)', () => {
    expect(EFFECT_MULTIPLIER.super_effective).toBe(1.6)
    expect(EFFECT_MULTIPLIER.netural).toBe(1)
    expect(EFFECT_MULTIPLIER.resisted).toBe(0.625)
    expect(EFFECT_MULTIPLIER.doubly_resisted).toBeCloseTo(0.625 * 0.625)
  })
})

describe('TYPE_MATRIX', () => {
  it('is a complete 18×18 of valid values', () => {
    const valid = new Set(Object.keys(EFFECT_MULTIPLIER))
    expect(Object.keys(TYPE_MATRIX)).toHaveLength(18)
    for (const a of POKEMON_TYPES) {
      expect(Object.keys(TYPE_MATRIX[a])).toHaveLength(18)
      for (const d of POKEMON_TYPES) expect(valid.has(TYPE_MATRIX[a][d])).toBe(true)
    }
  })
  it('agrees with getEffectiveness', () => {
    expect(TYPE_MATRIX.water.fire).toBe('super_effective')
    expect(TYPE_MATRIX.electric.ground).toBe('doubly_resisted')
  })
})
