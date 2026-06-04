/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from 'preact/hooks'
import { TYPE_COLORS } from '@/lib/types'
import type { Dictionary, Locale } from '@/lib/i18n'
import { loadPokemonIndex, type PokemonEntry, type PokemonIndex } from '@/lib/pokemonIndex'
import { PokeSprite } from './PokeSprite'
import { PokemonSearch } from './PokemonSearch'
import { readSelectedId, writeSelectedId } from '@/lib/urlState'
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
  const [err, setErr] = useState(false)

  const fastById = useMemo(() => new Map(fast.map((m) => [m.id, m])), [fast])
  const chargedById = useMemo(() => new Map(charged.map((m) => [m.id, m])), [charged])
  const name = (m: { name: string; nameEn: string }) => (locale === 'ko' ? m.name : m.nameEn)

  const load = async () => {
    setErr(false)
    try {
      const d = await loadPokemonIndex(base)
      setPdata(d)
      return d
    } catch (e) {
      setErr(true)
      throw e
    }
  }

  // Load the roster up front (this page is all about it) + restore selection.
  useEffect(() => {
    load()
      .then((d) => {
        const sel = readSelectedId()
        if (sel) {
          const m = d.byId.get(sel)
          if (m) setPokeSel(m)
        }
      })
      .catch(() => {})
  }, [])

  const selectPoke = (m: PokemonEntry) => {
    setPokeSel(m)
    writeSelectedId(m.id)
  }
  const clearPoke = () => {
    setPokeSel(null)
    writeSelectedId(null)
  }

  // Normalize stat bars against the actual roster max instead of a magic 300.
  const statMax = useMemo(() => {
    if (!pdata) return 300
    let max = 0
    for (const p of pdata.list) max = Math.max(max, p.atk, p.def, p.hp)
    return max || 300
  }, [pdata])

  const fastList = useMemo(
    () => (pokeSel ? pokeSel.fast.map((id) => fastById.get(id)).filter((m): m is FastMove => Boolean(m)) : []),
    [pokeSel, fastById],
  )
  const chargedList = useMemo(
    () => (pokeSel ? pokeSel.charged.map((id) => chargedById.get(id)).filter((m): m is ChargedMove => Boolean(m)) : []),
    [pokeSel, chargedById],
  )

  // Deep-link a move to its chart (fast page / charged index), opening its panel.
  const moveHref = (id: string, kind: 'fast' | 'charged') => `${base}${locale}${kind === 'fast' ? '/fast' : ''}?m=${id}`

  return (
    <div class="dex">
      <PokemonSearch list={pdata?.list} locale={locale} dict={dict} onSelect={selectPoke} className="dex-search" />

      {pokeSel ? (
        <div class="dex-card">
          <div class="dex-head">
            <PokeSprite mon={pokeSel} size={96} />
            <div class="dex-id">
              <div class="dex-name">
                {name(pokeSel)} <span class="dex-num">#{pokeSel.dex}</span>
                <button class="dex-clear" onClick={clearPoke} aria-label={dict.search.clear}>
                  ×
                </button>
              </div>
              <div class="dex-types">
                {pokeSel.types.map((t) => (
                  <span key={t} class="dex-type" style={{ background: TYPE_COLORS[t] }}>
                    <img src={`${base}images/types/${t}.png`} width={16} height={16} alt={dict.type[t]} />
                    {dict.type[t]}
                  </span>
                ))}
              </div>
              <div class="dex-stats">
                {([['atk', pokeSel.atk], ['def', pokeSel.def], ['hp', pokeSel.hp]] as const).map(([k, v]) => (
                  <div key={k} class="dex-stat">
                    <span class="dex-stat-k">{dict.pokemon[k]}</span>
                    <span class="dex-bar">
                      <span class="dex-bar-fill" style={{ width: `${Math.min(100, (v / statMax) * 100)}%` }} />
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
                <a key={m.id} class="mv-row" href={moveHref(m.id, 'fast')} style={{ borderColor: TYPE_COLORS[m.type] }}>
                  <span class="mv-type" style={{ background: TYPE_COLORS[m.type] }}>
                    <img src={`${base}images/types/${m.type}.png`} width={15} height={15} alt={dict.type[m.type]} />
                  </span>
                  <span class="mv-name">{name(m)}</span>
                  {m.pvp ? (
                    <span class="mv-stats">
                      {dict.move.damage} {m.pvp.power} · DPT {fastPvpDpt(m.pvp)} · EPT {fastPvpEpt(m.pvp)}
                    </span>
                  ) : m.pve ? (
                    <span class="mv-stats">
                      {dict.move.damage} {m.pve.power}
                    </span>
                  ) : null}
                </a>
              ))}
            </section>
            <section>
              <h3>{dict.nav.charged}</h3>
              {chargedList.map((m) => (
                <a key={m.id} class="mv-row" href={moveHref(m.id, 'charged')} style={{ borderColor: TYPE_COLORS[m.type] }}>
                  <span class="mv-type" style={{ background: TYPE_COLORS[m.type] }}>
                    <img src={`${base}images/types/${m.type}.png`} width={15} height={15} alt={dict.type[m.type]} />
                  </span>
                  <span class="mv-name">{name(m)}</span>
                  {m.pvp ? (
                    <span class="mv-stats">
                      {dict.move.damage} {m.pvp.power} · {dict.move.energy} {m.pvp.energy} · DPE {chargedDpe(m.pvp)}
                    </span>
                  ) : m.pve ? (
                    <span class="mv-stats">
                      {dict.move.damage} {m.pve.power} · {dict.move.energy} {m.pve.energy}
                    </span>
                  ) : null}
                </a>
              ))}
            </section>
          </div>
        </div>
      ) : err ? (
        <div class="dex-empty">
          {dict.common.error}{' '}
          <button class="retry-btn" onClick={() => load().catch(() => {})}>
            {dict.common.retry}
          </button>
        </div>
      ) : (
        <div class="dex-empty">{dict.pokemon.empty}</div>
      )}
    </div>
  )
}
