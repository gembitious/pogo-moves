import { describe, it, expect } from 'vitest'
import { CPM } from './cpm'
import { cpOf, rankSpreads, findSpread, cmpVs, searchString, type IvSpread } from './ivRank'

const AZU = [112, 152, 225] as const // Azumarill base atk/def/sta (pvpoke)

describe('cpm table', () => {
  it('covers L1..L51 in 0.5 steps with known anchors', () => {
    expect(CPM.length).toBe(101)
    expect(CPM[0]).toBeCloseTo(0.094, 6) // L1
    expect(CPM[78]).toBeCloseTo(0.7903, 6) // L40
    expect(CPM[98]).toBeCloseTo(0.8403, 6) // L50
  })
})

describe('cpOf', () => {
  it('matches a known CP: Azumarill 15/15/15 @ L40 = 1588', () => {
    expect(cpOf(...AZU, 15, 15, 15, CPM[78])).toBe(1588)
  })
})

describe('rankSpreads', () => {
  it('ranks all 4096 spreads, respects the cap, sorts by bulk', () => {
    const gl = rankSpreads(...AZU, 'gl')
    expect(gl.length).toBe(4096)
    expect(gl[0].rank).toBe(1)
    expect(gl[0].percent).toBe(100)
    expect(gl.every((s) => s.cp <= 1500)).toBe(true)
    for (let i = 1; i < gl.length; i++) expect(gl[i].statProduct).toBeLessThanOrEqual(gl[i - 1].statProduct)
  })

  it('GL prefers a bulk-weighted spread over 15/15/15', () => {
    const gl = rankSpreads(...AZU, 'gl')
    const hundo = findSpread(gl, 15, 15, 15)!
    expect(hundo.percent).toBeLessThan(100)
    expect(gl[0].ivA).toBeLessThan(15)
  })

  it('ML (no binding cap) makes 15/15/15 rank 1', () => {
    const ml = rankSpreads(...AZU, 'ml')
    expect(findSpread(ml, 15, 15, 15)!.rank).toBe(1)
  })
})

describe('cmpVs', () => {
  it('ranks CMP by Attack stat', () => {
    const mk = (atk: number) => ({ atk }) as IvSpread
    expect(cmpVs(mk(100), mk(90))).toBe('win')
    expect(cmpVs(mk(90), mk(90))).toBe('tie')
    expect(cmpVs(mk(80), mk(90))).toBe('lose')
  })
})

describe('searchString', () => {
  it('emits cp<X>&hp<Y> pairs across levels, all within the cap', () => {
    const gl = rankSpreads(...AZU, 'gl')
    const ss = searchString(...AZU, gl.slice(0, 1), 'gl')
    expect(ss).toMatch(/^cp\d+&hp\d+(,cp\d+&hp\d+)*$/)
    const cps = ss.split(',').map((p) => Number(p.match(/cp(\d+)/)![1]))
    expect(Math.max(...cps)).toBeLessThanOrEqual(1500)
    expect(cps.length).toBeGreaterThan(20) // many levels → many pairs
  })
})
