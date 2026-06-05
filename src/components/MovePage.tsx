/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from 'preact/hooks'
import { TYPE_COLORS, TYPE_TEXT, type MoveCategory } from '@/lib/types'
import { fmt, localName, type Dictionary, type Locale } from '@/lib/i18n'
import type { ChargedMove, FastMove } from '@/lib/formulas'
import { buildPoints } from '@/lib/moveChart'
import { loadPokemonIndex, type PokemonEntry, type PokemonIndex } from '@/lib/pokemonIndex'
import { loadRankings, LEAGUES, type League, type Rankings } from '@/lib/rankings'
import { PokeSprite } from './PokeSprite'
import { PokemonSearch, type MoveOption } from './PokemonSearch'
import { readMoveId, writeMoveId } from '@/lib/urlState'

const base = import.meta.env.BASE_URL

interface Props {
  locale: Locale
  dict: Dictionary
  fast: FastMove[]
  charged: ChargedMove[]
}

type Move = FastMove | ChargedMove
type Picked = { move: Move; category: MoveCategory }

export default function MovePage({ locale, dict, fast, charged }: Props) {
  const [sel, setSel] = useState<Picked | null>(null)
  const [pdata, setPdata] = useState<PokemonIndex | null>(null)
  const [err, setErr] = useState(false)
  const [league, setLeague] = useState<League>('gl')
  const [ranks, setRanks] = useState<Rankings | null>(null)

  const name = (m: { name: string; nameEn: string }) => localName(locale, m)

  // id -> {move, category} for selection + ?m= restore (fast/charged ids are distinct).
  const byId = useMemo(() => {
    const m = new Map<string, Picked>()
    for (const mv of fast) m.set(mv.id, { move: mv, category: 'fast' })
    for (const mv of charged) m.set(mv.id, { move: mv, category: 'charged' })
    return m
  }, [fast, charged])

  const moveOpts = useMemo<MoveOption[]>(
    () => [...byId.values()].map(({ move }) => ({ id: move.id, label: name(move), type: move.type })),
    [byId, locale],
  )

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

  useEffect(() => {
    load().catch(() => {})
    const m = readMoveId()
    if (m && byId.has(m)) setSel(byId.get(m)!)
  }, [])

  // League rankings (lazy per league) + restore the chosen league (shared key).
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

  const pick = (id: string) => {
    const p = byId.get(id)
    if (!p) return
    setSel(p)
    writeMoveId(id)
  }

  // Stat lines reuse the chart's mapping (PvP first; fall back to PvE for PvE-only moves).
  const detail = useMemo(() => {
    if (!sel) return null
    if (sel.category === 'fast') return buildPoints('fast', 'pvp', [sel.move as FastMove], dict, locale)[0] ?? null
    const cm = sel.move as ChargedMove
    return buildPoints('charged', 'pvp', [cm], dict, locale)[0] ?? buildPoints('charged', 'pve', [cm], dict, locale)[0] ?? null
  }, [sel, dict, locale])

  const users = useMemo(() => {
    if (!sel || !pdata) return null
    return (pdata.reverse[sel.move.id] ?? [])
      .map((id) => pdata.byId.get(id))
      .filter((m): m is PokemonEntry => Boolean(m))
      .sort((a, b) => a.dex - b.dex)
  }, [sel, pdata])

  // Pokémon whose recommended (pvpoke) moveset for this league includes this move.
  const recFor = useMemo(() => {
    if (!sel || !pdata || !ranks) return null
    const out: { mon: PokemonEntry; score: number }[] = []
    for (const id in ranks) {
      if (!ranks[id].moveset.includes(sel.move.id)) continue
      const mon = pdata.byId.get(id) ?? pdata.byId.get(id.replace('_shadow', ''))
      if (mon) out.push({ mon, score: ranks[id].score })
    }
    return out.sort((a, b) => b.score - a.score)
  }, [sel, pdata, ranks])

  const pokeCard = (m: PokemonEntry, score?: number) => (
    <a key={`${m.id}-${score ?? ''}`} class="poke-card" href={`${base}${locale}/pokemon?p=${m.id}`} title={name(m)}>
      <PokeSprite mon={m} />
      <span class="poke-name static-text">{name(m)}</span>
      {score != null && <span class="poke-card-score">{score}</span>}
    </a>
  )

  return (
    <div class="movepage">
      <PokemonSearch
        list={undefined}
        moves={moveOpts}
        onSelectMove={pick}
        onSelect={() => {}}
        placeholder={dict.search.placeholderMove}
        locale={locale}
        dict={dict}
        className="dex-search"
      />

      {sel && detail ? (
        <div class="mv-detail">
          <header class="mv-detail-head" style={{ borderColor: TYPE_COLORS[detail.type] }}>
            <span class="mv-detail-ic" style={{ background: TYPE_COLORS[detail.type] }}>
              <img src={`${base}images/types/${detail.type}.png`} width={22} height={22} alt={dict.type[detail.type]} />
            </span>
            <div class="mv-detail-id">
              <h2 class="static-text">{detail.label}</h2>
              <div class="mv-detail-tags">
                <span class="mv-cat" style={{ background: TYPE_COLORS[detail.type], color: TYPE_TEXT[detail.type] }}>
                  {dict.type[detail.type]}
                </span>
                <span class="mv-cat ghost">{sel.category === 'fast' ? dict.nav.fast : dict.nav.charged}</span>
              </div>
            </div>
          </header>

          <div class="mv-detail-stats">
            {detail.lines.map((line, i) => (
              <span key={i}>{line}</span>
            ))}
          </div>

          <section class="mv-sec">
            <div class="mv-sec-head">
              <h3>{dict.panel.usedBy}</h3>
              {users && <span class="panel-count">{fmt(dict.panel.count, { n: users.length })}</span>}
            </div>
            {!pdata ? (
              err ? (
                <div class="dex-empty">
                  {dict.common.error}{' '}
                  <button class="retry-btn" onClick={() => load().catch(() => {})}>
                    {dict.common.retry}
                  </button>
                </div>
              ) : (
                <div class="mv-msg">{dict.panel.loading}</div>
              )
            ) : users && users.length > 0 ? (
              <div class="poke-grid scroll-hidden">{users.map((m) => pokeCard(m))}</div>
            ) : (
              <div class="mv-msg">{dict.panel.none}</div>
            )}
          </section>

          <section class="mv-sec">
            <div class="mv-sec-head">
              <h3>{dict.move.recBy}</h3>
              <div class="league-bar">
                {LEAGUES.map((l) => (
                  <button key={l} class={`league-btn${league === l ? ' active' : ''}`} aria-pressed={league === l} onClick={() => pickLeague(l)}>
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            {!ranks ? (
              <div class="mv-msg">{dict.panel.loading}</div>
            ) : recFor && recFor.length > 0 ? (
              <div class="poke-grid scroll-hidden">{recFor.map(({ mon, score }) => pokeCard(mon, score))}</div>
            ) : (
              <div class="mv-msg">{dict.panel.none}</div>
            )}
          </section>
        </div>
      ) : (
        <div class="dex-empty">{dict.move.empty}</div>
      )}
    </div>
  )
}
