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
