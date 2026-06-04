/** @jsxImportSource preact */
import { useMemo, useRef, useState } from 'preact/hooks'
import { TYPE_COLORS, type PokemonType } from '@/lib/types'
import type { Dictionary, Locale } from '@/lib/i18n'
import type { PokemonEntry } from '@/lib/pokemonIndex'
import { PokeSprite } from './PokeSprite'

export interface MoveOption {
  id: string
  label: string
  type: PokemonType
}

interface Props {
  list: PokemonEntry[] | undefined
  locale: Locale
  dict: Dictionary
  onSelect: (m: PokemonEntry) => void
  moves?: MoveOption[] // when given, the box also finds moves (chart pages)
  onSelectMove?: (id: string) => void
  onActivate?: () => void // fired on focus/input so the parent can lazy-load the index
  placeholder?: string
  className?: string
}

type Row = { kind: 'pokemon'; p: PokemonEntry } | { kind: 'move'; mv: MoveOption }

// Combobox: type to filter, ↑/↓ to move, Enter to pick, Esc to clear. Finds
// Pokémon (always) and, on the chart pages, moves too.
export function PokemonSearch({ list, locale, dict, onSelect, moves, onSelectMove, onActivate, placeholder, className }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const blurT = useRef<ReturnType<typeof setTimeout>>()
  const nameOf = (m: PokemonEntry) => (locale === 'ko' ? m.name : m.nameEn)
  const ph = placeholder ?? dict.search.placeholder

  const results = useMemo<Row[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const pk: Row[] = (list ?? [])
      .filter((p) => p.name.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q))
      .slice(0, 6)
      .map((p) => ({ kind: 'pokemon', p }))
    const mv: Row[] = (moves ?? [])
      .filter((m) => m.label.toLowerCase().includes(q))
      .slice(0, 6)
      .map((m) => ({ kind: 'move', mv: m }))
    return [...pk, ...mv]
  }, [list, moves, query])

  const rowId = (r: Row) => `ps-${r.kind === 'pokemon' ? r.p.id : 'mv-' + r.mv.id}`
  const pick = (r: Row) => {
    if (r.kind === 'move') onSelectMove?.(r.mv.id)
    else onSelect(r.p)
    setQuery('')
    setOpen(false)
    setActive(0)
  }

  const showList = open && query.trim().length > 0 && (results.length > 0 || !!list)
  const LIST_ID = 'poke-search-list'

  return (
    <div class={`poke-search${className ? ' ' + className : ''}`}>
      <input
        class="poke-input"
        type="text"
        role="combobox"
        aria-label={ph}
        aria-expanded={showList}
        aria-controls={LIST_ID}
        aria-autocomplete="list"
        aria-activedescendant={showList && results[active] ? rowId(results[active]) : undefined}
        value={query}
        placeholder={ph}
        onFocus={() => {
          onActivate?.()
          clearTimeout(blurT.current)
          setOpen(true)
        }}
        onBlur={() => {
          blurT.current = setTimeout(() => setOpen(false), 120)
        }}
        onInput={(e) => {
          onActivate?.()
          setQuery((e.currentTarget as HTMLInputElement).value)
          setActive(0)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setQuery('')
            setOpen(false)
          } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((i) => Math.min(i + 1, results.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((i) => Math.max(i - 1, 0))
          } else if (e.key === 'Enter' && results[active]) {
            e.preventDefault()
            pick(results[active])
          }
        }}
      />
      {showList && (
        <div class="poke-results scroll-hidden" id={LIST_ID} role="listbox">
          {results.length > 0 ? (
            results.map((r, i) => (
              <button
                key={rowId(r)}
                id={rowId(r)}
                role="option"
                aria-selected={i === active}
                class={`poke-result${i === active ? ' active' : ''}`}
                onMouseDown={() => pick(r)}
                onMouseEnter={() => setActive(i)}
              >
                {r.kind === 'pokemon' ? (
                  <>
                    <PokeSprite mon={r.p} size={26} />
                    <span class="static-text">{nameOf(r.p)}</span>
                  </>
                ) : (
                  <>
                    <span class="ps-move-icon" style={{ background: TYPE_COLORS[r.mv.type] }} />
                    <span class="static-text">{r.mv.label}</span>
                    <span class="ps-kind">{dict.search.move}</span>
                  </>
                )}
              </button>
            ))
          ) : (
            <div class="poke-noresult">{dict.search.none}</div>
          )}
        </div>
      )}
    </div>
  )
}
