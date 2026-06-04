import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (p: string) => JSON.parse(readFileSync(resolve(process.cwd(), p), 'utf8'))

interface Entry {
  id: string
  dex: number
  name: string
  nameEn: string
  types: string[]
  fast: string[]
  charged: string[]
  sprite: string | null
}

const list: Entry[] = read('public/data/pokemon-index.json')
const reverse: Record<string, string[]> = read('public/data/move-pokemon.json')
const byId = new Map(list.map((p) => [p.id, p]))

describe('pokemon-index.json', () => {
  it('has entries with unique ids', () => {
    expect(list.length).toBeGreaterThan(1000)
    expect(byId.size).toBe(list.length)
  })
  it('contains no shadow forms', () => {
    expect(list.filter((p) => p.id.endsWith('_shadow'))).toHaveLength(0)
  })
  it('every entry has name, nameEn, types and move arrays', () => {
    for (const p of list) {
      expect(p.name, p.id).toBeTruthy()
      expect(p.nameEn, p.id).toBeTruthy()
      expect(p.types.length, p.id).toBeGreaterThan(0)
      expect(Array.isArray(p.fast)).toBe(true)
      expect(Array.isArray(p.charged)).toBe(true)
    }
  })
  it('sprite is null or a well-formed path', () => {
    for (const p of list) {
      if (p.sprite !== null) expect(p.sprite, p.id).toMatch(/^images\/pokemon\/.+\.png$/)
    }
  })
})

describe('move-pokemon.json (reverse index)', () => {
  it('references only species that exist in the index (no dangling refs)', () => {
    const dangling: string[] = []
    for (const ids of Object.values(reverse)) for (const id of ids) if (!byId.has(id)) dangling.push(id)
    expect(dangling).toEqual([])
  })
  it('maps every move to at least one species', () => {
    for (const [move, ids] of Object.entries(reverse)) expect(ids.length, move).toBeGreaterThan(0)
  })
})
