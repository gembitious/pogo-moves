/** @jsxImportSource preact */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { TYPE_COLORS } from '@/lib/types'
import type { Dictionary, Locale } from '@/lib/i18n'
import { loadPokemonIndex, type PokemonEntry, type PokemonIndex } from '@/lib/pokemonIndex'
import { PokeSprite } from './PokeSprite'
import { chargedDpe, fastPvpDpt, fastPvpEpt, type ChargedMove, type FastMove } from '@/lib/formulas'

const base = import.meta.env.BASE_URL

interface Props {
  locale: Locale
  dict: Dictionary
  fast: FastMove[]
  charged: ChargedMove[]
}

export default function PokemonExplorer({ locale, dict, fast, charged }: Props) {
  const [pdata, setPdata] = useState<PokemonIndex | null>(null)
  const [pokeSel, setPokeSel] = useState<PokemonEntry | null>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const blurT = useRef<ReturnType<typeof setTimeout>>()

  const fastById = useMemo(() => new Map(fast.map((m) => [m.id, m])), [fast])
  const chargedById = useMemo(() => new Map(charged.map((m) => [m.id, m])), [charged])
  const name = (m: { name: string; nameEn: string }) => (locale === 'ko' ? m.name : m.nameEn)

  // The roster is the whole point of this page, so load it up front + restore selection.
  useEffect(() => {
    loadPokemonIndex(base)
      .then((d) => {
        setPdata(d)
        const saved = localStorage.getItem('pogo-poke')
        if (saved) {
          const m = d.byId.get(saved)
          if (m) setPokeSel(m)
        }
      })
      .catch(() => {})
  }, [])

  const selectPoke = (m: PokemonEntry) => {
    setPokeSel(m)
    setQuery('')
    setOpen(false)
    localStorage.setItem('pogo-poke', m.id)
  }

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!pdata || !q) return []
    return pdata.list
      .filter((m) => m.name.toLowerCase().includes(q) || m.nameEn.toLowerCase().includes(q))
      .slice(0, 10)
  }, [pdata, query])

  const fastList = useMemo(
    () => (pokeSel ? pokeSel.fast.map((id) => fastById.get(id)).filter((m): m is FastMove => Boolean(m)) : []),
    [pokeSel, fastById],
  )
  const chargedList = useMemo(
    () => (pokeSel ? pokeSel.charged.map((id) => chargedById.get(id)).filter((m): m is ChargedMove => Boolean(m)) : []),
    [pokeSel, chargedById],
  )

  const typeBadge = (t: PokemonEntry['types'][number], label: string) => (
    <span key={t} class="dex-type" style={{ background: TYPE_COLORS[t] }}>
      <img src={`${base}images/types/${t}.png`} width={16} height={16} alt={label} />
      {label}
    </span>
  )

  return (
    <div class="dex">
      <div class="poke-search dex-search">
        <input
          class="poke-input"
          type="text"
          value={query}
          placeholder={dict.search.placeholder}
          onFocus={() => {
            clearTimeout(blurT.current)
            setOpen(true)
          }}
          onBlur={() => {
            blurT.current = setTimeout(() => setOpen(false), 120)
          }}
          onInput={(e) => setQuery((e.currentTarget as HTMLInputElement).value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setQuery('')
            else if (e.key === 'Enter' && results.length) selectPoke(results[0])
          }}
        />
        {open && query.trim() && (results.length > 0 || pdata) && (
          <div class="poke-results scroll-hidden">
            {results.length > 0 ? (
              results.map((m) => (
                <button key={m.id} class="poke-result" onMouseDown={() => selectPoke(m)}>
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

      {pokeSel ? (
        <div class="dex-card">
          <div class="dex-head">
            <PokeSprite mon={pokeSel} size={96} />
            <div class="dex-id">
              <div class="dex-name">
                {name(pokeSel)} <span class="dex-num">#{pokeSel.dex}</span>
              </div>
              <div class="dex-types">{pokeSel.types.map((t) => typeBadge(t, dict.type[t]))}</div>
              <div class="dex-stats">
                {([['atk', pokeSel.atk], ['def', pokeSel.def], ['hp', pokeSel.hp]] as const).map(([k, v]) => (
                  <div key={k} class="dex-stat">
                    <span class="dex-stat-k">{dict.pokemon[k]}</span>
                    <span class="dex-bar">
                      <span class="dex-bar-fill" style={{ width: `${Math.min(100, (v / 300) * 100)}%` }} />
                    </span>
                    <span class="dex-stat-v">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div class="dex-moves">
            <section>
              <h3>{dict.nav.fast}</h3>
              {fastList.map((m) => (
                <div key={m.id} class="mv-row" style={{ borderColor: TYPE_COLORS[m.type] }}>
                  <span class="mv-type" style={{ background: TYPE_COLORS[m.type] }}>
                    <img src={`${base}images/types/${m.type}.png`} width={15} height={15} alt={dict.type[m.type]} />
                  </span>
                  <span class="mv-name">{name(m)}</span>
                  {m.pvp && (
                    <span class="mv-stats">
                      {dict.move.damage} {m.pvp.power} · DPT {fastPvpDpt(m.pvp)} · EPT {fastPvpEpt(m.pvp)}
                    </span>
                  )}
                </div>
              ))}
            </section>
            <section>
              <h3>{dict.nav.charged}</h3>
              {chargedList.map((m) => (
                <div key={m.id} class="mv-row" style={{ borderColor: TYPE_COLORS[m.type] }}>
                  <span class="mv-type" style={{ background: TYPE_COLORS[m.type] }}>
                    <img src={`${base}images/types/${m.type}.png`} width={15} height={15} alt={dict.type[m.type]} />
                  </span>
                  <span class="mv-name">{name(m)}</span>
                  {m.pvp && (
                    <span class="mv-stats">
                      {dict.move.damage} {m.pvp.power} · {dict.move.energy} {m.pvp.energy} · DPE {chargedDpe(m.pvp)}
                    </span>
                  )}
                </div>
              ))}
            </section>
          </div>
        </div>
      ) : (
        <div class="dex-empty">{dict.pokemon.empty}</div>
      )}
    </div>
  )
}
