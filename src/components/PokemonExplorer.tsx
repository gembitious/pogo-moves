/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from 'preact/hooks'
import { POKEMON_TYPES, TYPE_COLORS, TYPE_TEXT, type PokemonType } from '@/lib/types'
import { EFFECT_MULTIPLIER, getEffectiveness } from '@/lib/typeEffectiveness'
import type { Dictionary, Locale } from '@/lib/i18n'
import { loadPokemonIndex, type PokemonEntry, type PokemonIndex } from '@/lib/pokemonIndex'
import { PokeSprite } from './PokeSprite'
import { PokemonSearch } from './PokemonSearch'
import { PokemonCompare } from './PokemonCompare'
import { IvChecker } from './IvChecker'
import { readCompareId, readSelectedId, writeCompareId, writeSelectedId } from '@/lib/urlState'
import { chargedDpe, fastPvpDpt, fastPvpEpt, moveCount, moveCountTurns, type ChargedMove, type FastMove } from '@/lib/formulas'
import { loadRankings, LEAGUES, type League, type Rankings } from '@/lib/rankings'

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
  const [pokeB, setPokeB] = useState<PokemonEntry | null>(null)
  const [addingB, setAddingB] = useState(false)
  const [showIv, setShowIv] = useState(false)
  const [err, setErr] = useState(false)
  const [league, setLeague] = useState<League>('gl')
  const [ranks, setRanks] = useState<Rankings | null>(null)

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
        const cmp = readCompareId()
        if (cmp) {
          const m = d.byId.get(cmp)
          if (m) {
            setPokeB(m)
            setAddingB(true)
          }
        }
      })
      .catch(() => {})
  }, [])

  // League rankings (lazy per league) + restore the chosen league.
  useEffect(() => {
    const s = localStorage.getItem('pogo-league')
    if (s === 'gl' || s === 'ul' || s === 'ml') setLeague(s)
  }, [])
  useEffect(() => {
    setRanks(null)
    loadRankings(base, league).then(setRanks).catch(() => {})
  }, [league])
  const pickLeague = (l: League) => {
    setLeague(l)
    localStorage.setItem('pogo-league', l)
  }

  const selectPoke = (m: PokemonEntry) => {
    setPokeSel(m)
    writeSelectedId(m.id)
  }
  // Exit compare back to a single selection.
  const exitCompare = () => {
    setPokeB(null)
    setAddingB(false)
    writeCompareId(null)
  }
  const clearPoke = () => {
    setPokeSel(null)
    writeSelectedId(null)
    exitCompare()
  }
  const selectB = (m: PokemonEntry) => {
    setPokeB(m)
    writeCompareId(m.id)
  }
  // Drill from the compare card into a single mon's full detail.
  const focusMon = (m: PokemonEntry) => {
    exitCompare()
    selectPoke(m)
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
  // PvP-only subsets for the move-count matrix.
  const mcFast = useMemo(() => fastList.filter((m) => m.pvp), [fastList])
  const mcCharged = useMemo(() => chargedList.filter((m) => m.pvp), [chargedList])

  // Deep-link a move to its chart (fast page / charged index), opening its panel.
  const moveHref = (id: string, kind: 'fast' | 'charged') => `${base}${locale}${kind === 'fast' ? '/fast' : ''}?m=${id}`

  // Defensive matchups: multiply each attacking type's effectiveness over the
  // selected mon's type(s) (GO has no immunities, so ×0 is a double resist).
  const matchups = useMemo(() => {
    const weak: { t: PokemonType; mult: number }[] = []
    const resist: { t: PokemonType; mult: number }[] = []
    if (pokeSel) {
      for (const t of POKEMON_TYPES) {
        let mult = 1
        for (const d of pokeSel.types) mult *= EFFECT_MULTIPLIER[getEffectiveness(t, d)]
        if (mult > 1.01) weak.push({ t, mult })
        else if (mult < 0.99) resist.push({ t, mult })
      }
      weak.sort((a, b) => b.mult - a.mult)
      resist.sort((a, b) => a.mult - b.mult)
    }
    return { weak, resist }
  }, [pokeSel])

  const family = useMemo(() => {
    if (!pokeSel?.family || !pdata) return []
    const fam = pdata.list.filter((p) => p.family === pokeSel.family)
    return fam.length > 1 ? fam.sort((a, b) => a.dex - b.dex || a.id.localeCompare(b.id)) : []
  }, [pokeSel, pdata])

  const rank = pokeSel && ranks ? ranks[pokeSel.id] ?? null : null
  const recommended = useMemo(() => new Set(rank?.moveset ?? []), [rank])
  const oppOf = (id: string) => pdata?.byId.get(id) ?? pdata?.byId.get(id.replace('_shadow', '')) ?? null

  const muChip = (t: PokemonType, mult: number) => (
    <span key={t} class="mu-chip" style={{ background: TYPE_COLORS[t], color: TYPE_TEXT[t] }} title={`${dict.type[t]} ×${+mult.toFixed(2)}`}>
      <img src={`${base}images/types/${t}.png`} width={15} height={15} alt={dict.type[t]} />×{+mult.toFixed(2)}
    </span>
  )

  return (
    <div class="dex">
      <PokemonSearch list={pdata?.list} locale={locale} dict={dict} onSelect={selectPoke} className="dex-search" />
      <div class="league-bar">
        {LEAGUES.map((l) => (
          <button key={l} class={`league-btn${league === l ? ' active' : ''}`} aria-pressed={league === l} onClick={() => pickLeague(l)}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      {addingB && !pokeB && (
        <PokemonSearch
          list={pdata?.list}
          locale={locale}
          dict={dict}
          onSelect={selectB}
          className="dex-search"
          placeholder={dict.pokemon.comparePlaceholder}
        />
      )}

      {pokeSel ? (
        pokeB ? (
          <PokemonCompare
            a={pokeSel}
            b={pokeB}
            league={league}
            ranks={ranks}
            fastById={fastById}
            chargedById={chargedById}
            locale={locale}
            dict={dict}
            onClose={exitCompare}
            onFocusMon={focusMon}
          />
        ) : (
          <div class="dex-card">
          <div class="dex-head">
            <PokeSprite mon={pokeSel} size={96} />
            <div class="dex-id">
              <div class="dex-name">
                {name(pokeSel)} <span class="dex-num">#{pokeSel.dex}</span>
                {rank && (
                  <span class="dex-score" title={`pvpoke ${league.toUpperCase()}`}>
                    {league.toUpperCase()} {rank.score}
                  </span>
                )}
                <button class="dex-cmp-btn" aria-pressed={addingB} onClick={() => setAddingB((v) => !v)}>
                  {dict.common.compare}
                </button>
                <button class="dex-clear" onClick={clearPoke} aria-label={dict.search.clear}>
                  ×
                </button>
              </div>
              <div class="dex-types">
                {pokeSel.types.map((t) => (
                  <span key={t} class="dex-type" style={{ background: TYPE_COLORS[t], color: TYPE_TEXT[t] }}>
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

          {(matchups.weak.length > 0 || matchups.resist.length > 0) && (
            <div class="dex-matchups">
              {matchups.weak.length > 0 && (
                <div class="mu-row">
                  <span class="mu-label weak">{dict.pokemon.weak}</span>
                  {matchups.weak.map(({ t, mult }) => muChip(t, mult))}
                </div>
              )}
              {matchups.resist.length > 0 && (
                <div class="mu-row">
                  <span class="mu-label resist">{dict.pokemon.resist}</span>
                  {matchups.resist.map(({ t, mult }) => muChip(t, mult))}
                </div>
              )}
            </div>
          )}

          <div class="dex-iv">
            <button class="dex-iv-toggle" aria-expanded={showIv} onClick={() => setShowIv((v) => !v)}>
              {dict.iv.title} <span class="dex-iv-caret">{showIv ? '▲' : '▼'}</span>
            </button>
            {showIv && <IvChecker base={{ atk: pokeSel.atk, def: pokeSel.def, hp: pokeSel.hp }} league={league} dict={dict} />}
          </div>

          {family.length > 0 && (
            <div class="dex-evo">
              <h3>{dict.pokemon.evolution}</h3>
              <div class="dex-evo-row scroll-hidden">
                {family.map((m) => (
                  <button
                    key={m.id}
                    class={`dex-evo-member${m.id === pokeSel.id ? ' current' : ''}`}
                    onClick={() => selectPoke(m)}
                    title={name(m)}
                  >
                    <PokeSprite mon={m} size={48} />
                    <span class="static-text">{name(m)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div class="dex-moves">
            <section>
              <h3>{dict.nav.fast}</h3>
              {fastList.map((m) => (
                <a key={m.id} class="mv-row" href={moveHref(m.id, 'fast')} style={{ borderColor: TYPE_COLORS[m.type] }}>
                  <span class="mv-type" style={{ background: TYPE_COLORS[m.type] }}>
                    <img src={`${base}images/types/${m.type}.png`} width={15} height={15} alt={dict.type[m.type]} />
                  </span>
                  <span class="mv-name">{name(m)}</span>
                  {recommended.has(m.id) && <span class="mv-rec" title={dict.pokemon.recommended}>★</span>}
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
                  {recommended.has(m.id) && <span class="mv-rec" title={dict.pokemon.recommended}>★</span>}
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

          {mcFast.length > 0 && mcCharged.length > 0 && (
            <div class="dex-mc">
              <h3>{dict.pokemon.moveCount}</h3>
              <div class="dex-mc-wrap scroll-hidden">
                <table class="mc">
                  <thead>
                    <tr>
                      <th class="mc-corner" />
                      {mcFast.map((f) => (
                        <th key={f.id} title={name(f)}>
                          <span class="mc-ic" style={{ background: TYPE_COLORS[f.type] }}>
                            <img src={`${base}images/types/${f.type}.png`} width={15} height={15} alt={dict.type[f.type]} />
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mcCharged.map((c) => (
                      <tr key={c.id}>
                        <th class="mc-cname">
                          <span class="mc-ic sm" style={{ background: TYPE_COLORS[c.type] }}>
                            <img src={`${base}images/types/${c.type}.png`} width={13} height={13} alt={dict.type[c.type]} />
                          </span>
                          <span class="static-text">{name(c)}</span>
                        </th>
                        {mcFast.map((f) => (
                          <td key={f.id} class="num" title={`${moveCountTurns(f.pvp!, c.pvp!) * 0.5}s`}>
                            {moveCount(f.pvp!, c.pvp!)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {rank && (rank.matchups.length > 0 || rank.counters.length > 0) && (
            <div class="dex-mu">
              {rank.matchups.length > 0 && (
                <section>
                  <h3>{dict.pokemon.beats}</h3>
                  <div class="dex-mu-row scroll-hidden">
                    {rank.matchups.map((id) => {
                      const o = oppOf(id)
                      return o ? (
                        <button key={id} class="dex-mu-mon" onClick={() => selectPoke(o)} title={name(o)}>
                          <PokeSprite mon={o} size={40} />
                        </button>
                      ) : null
                    })}
                  </div>
                </section>
              )}
              {rank.counters.length > 0 && (
                <section>
                  <h3>{dict.pokemon.losesTo}</h3>
                  <div class="dex-mu-row scroll-hidden">
                    {rank.counters.map((id) => {
                      const o = oppOf(id)
                      return o ? (
                        <button key={id} class="dex-mu-mon" onClick={() => selectPoke(o)} title={name(o)}>
                          <PokeSprite mon={o} size={40} />
                        </button>
                      ) : null
                    })}
                  </div>
                </section>
              )}
            </div>
          )}
          </div>
        )
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
