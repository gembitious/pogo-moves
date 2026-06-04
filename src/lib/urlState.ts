// Selection state shared across pages. The picked Pokémon lives in the URL
// (?p=<speciesId>) so links are shareable, and is mirrored to localStorage so it
// also persists across in-app navigation. The open move panel uses ?m=<moveId>.
const SEL_KEY = 'pogo-poke'

function write(key: string, value: string | null) {
  const url = new URL(location.href)
  if (value) url.searchParams.set(key, value)
  else url.searchParams.delete(key)
  history.replaceState(null, '', url)
}

export function readSelectedId(): string | null {
  if (typeof window === 'undefined') return null
  return new URL(location.href).searchParams.get('p') ?? localStorage.getItem(SEL_KEY)
}

export function writeSelectedId(id: string | null) {
  if (typeof window === 'undefined') return
  if (id) localStorage.setItem(SEL_KEY, id)
  else localStorage.removeItem(SEL_KEY)
  write('p', id)
}

export function readMoveId(): string | null {
  if (typeof window === 'undefined') return null
  return new URL(location.href).searchParams.get('m')
}

export function writeMoveId(id: string | null) {
  if (typeof window === 'undefined') return
  write('m', id)
}

// Second Pokémon for the compare view (?c=<speciesId>). URL-only — kept shareable
// but not sticky in localStorage, so a plain selection never resurrects a compare.
export function readCompareId(): string | null {
  if (typeof window === 'undefined') return null
  return new URL(location.href).searchParams.get('c')
}

export function writeCompareId(id: string | null) {
  if (typeof window === 'undefined') return
  write('c', id)
}

// Team for the coverage page (?t=id1,id2,…). URL-only, shareable.
export function readTeamIds(): string[] {
  if (typeof window === 'undefined') return []
  const t = new URL(location.href).searchParams.get('t')
  return t ? t.split(',').filter(Boolean) : []
}

export function writeTeamIds(ids: string[]) {
  if (typeof window === 'undefined') return
  write('t', ids.length ? ids.join(',') : null)
}
