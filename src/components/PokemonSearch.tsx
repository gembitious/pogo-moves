/** @jsxImportSource preact */
import { useMemo, useRef, useState } from 'preact/hooks'
import type { Dictionary, Locale } from '@/lib/i18n'
import type { PokemonEntry } from '@/lib/pokemonIndex'
import { PokeSprite } from './PokeSprite'

interface Props {
  list: PokemonEntry[] | undefined
  locale: Locale
  dict: Dictionary
  onSelect: (m: PokemonEntry) => void
  onActivate?: () => void // fired on focus/input so the parent can lazy-load the index
  className?: string
}

// Combobox: type to filter, ↑/↓ to move, Enter to pick, Esc to clear. Shared by
// the chart (highlight) and the Pokémon page (detail).
export function PokemonSearch({ list, locale, dict, onSelect, onActivate, className }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const blurT = useRef<ReturnType<typeof setTimeout>>()
  const name = (m: PokemonEntry) => (locale === 'ko' ? m.name : m.nameEn)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!list || !q) return []
    return list.filter((m) => m.name.toLowerCase().includes(q) || m.nameEn.toLowerCase().includes(q)).slice(0, 8)
  }, [list, query])

  const pick = (m: PokemonEntry) => {
    onSelect(m)
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
        aria-label={dict.search.placeholder}
        aria-expanded={showList}
        aria-controls={LIST_ID}
        aria-autocomplete="list"
        aria-activedescendant={showList && results[active] ? `ps-${results[active].id}` : undefined}
        value={query}
        placeholder={dict.search.placeholder}
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
            results.map((m, i) => (
              <button
                key={m.id}
                id={`ps-${m.id}`}
                role="option"
                aria-selected={i === active}
                class={`poke-result${i === active ? ' active' : ''}`}
                onMouseDown={() => pick(m)}
                onMouseEnter={() => setActive(i)}
              >
                <PokeSprite mon={m} size={26} />
                <span class="static-text">{name(m)}</span>
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
