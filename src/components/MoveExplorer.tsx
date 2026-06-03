/** @jsxImportSource preact */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import {
  POKEMON_TYPES,
  TYPE_COLORS,
  type MoveCategory,
  type MoveMode,
  type PokemonType,
} from '@/lib/types'
import {
  chargedDpe,
  chargedPveDps,
  fastPvpDpt,
  fastPvpEpt,
  type ChargedMove,
  type FastMove,
} from '@/lib/formulas'
import { getChartConfig } from '@/lib/chartConfig'
import { fmt, type Dictionary, type Locale } from '@/lib/i18n'
import { loadPokemonIndex, type PokemonEntry, type PokemonIndex } from '@/lib/pokemonIndex'
import { PokeSprite } from './PokeSprite'

const base = import.meta.env.BASE_URL
const PAD = { left: 56, right: 18, top: 14, bottom: 44 } // px around the plot area
const FAN_GAP = 17 // px to fan stacked chips apart on hover

interface Point {
  id: string
  label: string
  type: PokemonType
  x: number
  y: number
  lines: string[]
}

interface Props {
  category: MoveCategory
  locale: Locale
  dict: Dictionary
  moves: FastMove[] | ChargedMove[]
}

function buffLines(pvp: ChargedMove['pvp'], dict: Dictionary): string[] {
  if (!pvp?.buffs) return []
  const chance = fmt(dict.move.buffChance, { chance: Math.round((pvp.buffApplyChance ?? 0) * 100) })
  const target = pvp.buffTarget === 'self' ? dict.move.self : dict.move.opponent
  const [atk, def] = pvp.buffs
  const parts: string[] = []
  const rank = (n: number) => (n > 0 ? fmt(dict.move.rankUp, { n }) : fmt(dict.move.rankDown, { n: Math.abs(n) }))
  if (atk !== 0) parts.push(`${dict.move.attack} ${rank(atk)}`)
  if (def !== 0) parts.push(`${dict.move.defense} ${rank(def)}`)
  return [`${chance} ${target} ${parts.join(', ')}`]
}

function buildPoints(category: MoveCategory, mode: MoveMode, moves: Props['moves'], dict: Dictionary, locale: Locale): Point[] {
  const label = (m: { name: string; nameEn: string }) => (locale === 'ko' ? m.name : m.nameEn)
  if (category === 'fast') {
    return (moves as FastMove[])
      .filter((m) => m.pvp)
      .map((m) => {
        const p = m.pvp!
        const dpt = fastPvpDpt(p)
        const ept = fastPvpEpt(p)
        return {
          id: m.id,
          label: label(m),
          type: m.type,
          x: dpt,
          y: ept,
          lines: [
            `${dict.move.damage}: ${p.power}`,
            `${dict.move.turn}: ${p.turn}    DPT: ${dpt}`,
            `${dict.move.energy}: ${p.energyGain}    EPT: ${ept}`,
          ],
        }
      })
  }
  if (mode === 'pvp') {
    return (moves as ChargedMove[])
      .filter((m) => m.pvp)
      .map((m) => {
        const p = m.pvp!
        const dpe = chargedDpe(p)
        return {
          id: m.id,
          label: label(m),
          type: m.type,
          x: p.energy,
          y: dpe,
          lines: [`${dict.move.damage}: ${p.power}`, `${dict.move.energy}: ${p.energy}    DPE: ${dpe}`, ...buffLines(p, dict)],
        }
      })
  }
  return (moves as ChargedMove[])
    .filter((m) => m.pve)
    .map((m) => {
      const p = m.pve!
      const dpe = chargedDpe(p)
      const dps = chargedPveDps(p)
      return {
        id: m.id,
        label: label(m),
        type: m.type,
        x: dps,
        y: dpe,
        lines: [`${dict.move.damage}: ${p.power}`, `${dict.move.energy}: ${p.energy}    DPE: ${dpe}`, `DPS: ${dps}`],
      }
    })
}

export default function MoveExplorer({ category, locale, dict, moves }: Props) {
  const [mode, setMode] = useState<MoveMode>('pvp')
  const [selected, setSelected] = useState<Set<PokemonType>>(new Set())
  const [hover, setHover] = useState<string | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const [pdata, setPdata] = useState<PokemonIndex | null>(null)
  const [pokeSel, setPokeSel] = useState<PokemonEntry | null>(null)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchBlur = useRef<ReturnType<typeof setTimeout>>()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  // Fill whatever space the chart container is given (no fixed aspect ratio).
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect
      setSize({ w: Math.round(r.width), h: Math.round(r.height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const cfg = useMemo(() => getChartConfig(category, mode), [category, mode])
  const { w, h } = size
  const plotW = Math.max(0, w - PAD.left - PAD.right)
  const plotH = Math.max(0, h - PAD.top - PAD.bottom)
  const sx = (x: number) => PAD.left + ((x - cfg.xMin) / (cfg.xMax - cfg.xMin)) * plotW
  const sy = (y: number) => PAD.top + (1 - (y - cfg.yMin) / (cfg.yMax - cfg.yMin)) * plotH

  const allPoints = useMemo(() => buildPoints(category, mode, moves, dict, locale), [category, mode, moves, dict, locale])
  const points = useMemo(
    () => allPoints.filter((p) => selected.size === 0 || selected.has(p.type)),
    [allPoints, selected],
  )

  // Group points sharing identical coordinates so a hovered stack can fan open.
  const clusterById = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of points) counts.set(`${p.x}|${p.y}`, (counts.get(`${p.x}|${p.y}`) ?? 0) + 1)
    const seen = new Map<string, number>()
    const m = new Map<string, { key: string; idx: number; size: number }>()
    for (const p of points) {
      const key = `${p.x}|${p.y}`
      const idx = seen.get(key) ?? 0
      seen.set(key, idx + 1)
      m.set(p.id, { key, idx, size: counts.get(key)! })
    }
    return m
  }, [points])

  const activeKey = hover ? clusterById.get(hover)?.key : undefined
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>()
  const enter = (id: string) => {
    clearTimeout(leaveTimer.current)
    setHover(id)
  }
  const leave = (id: string) => {
    leaveTimer.current = setTimeout(() => setHover((cur) => (cur === id ? null : cur)), 90)
  }

  // Lazy-load the pokemon index the first time a move is opened; Escape closes it.
  useEffect(() => {
    if (picked && !pdata) loadPokemonIndex(base).then(setPdata).catch(() => {})
  }, [picked, pdata])
  useEffect(() => {
    if (!picked) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPicked(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [picked])

  const pickedPoint = useMemo(
    () => (picked ? allPoints.find((p) => p.id === picked) ?? null : null),
    [picked, allPoints],
  )
  const pickedMons = useMemo(() => {
    if (!picked || !pdata) return null
    return (pdata.reverse[picked] ?? [])
      .map((id) => pdata.byId.get(id))
      .filter((m): m is PokemonEntry => Boolean(m))
      .sort((a, b) => a.dex - b.dex)
  }, [picked, pdata])

  // --- Phase 2: pick a Pokémon → highlight the moves it learns ------------
  const ensureData = () => {
    if (!pdata) loadPokemonIndex(base).then(setPdata).catch(() => {})
  }
  // restore a saved selection so it carries across the fast/charged pages
  useEffect(() => {
    const saved = localStorage.getItem('pogo-poke')
    if (!saved) return
    loadPokemonIndex(base)
      .then((d) => {
        setPdata(d)
        const m = d.byId.get(saved)
        if (m) setPokeSel(m)
      })
      .catch(() => {})
  }, [])
  const selectPoke = (m: PokemonEntry) => {
    setPokeSel(m)
    setQuery('')
    setSearchOpen(false)
    localStorage.setItem('pogo-poke', m.id)
  }
  const clearPoke = () => {
    setPokeSel(null)
    localStorage.removeItem('pogo-poke')
  }
  const highlight = useMemo(
    () => (pokeSel ? new Set(category === 'fast' ? pokeSel.fast : pokeSel.charged) : null),
    [pokeSel, category],
  )
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!pdata || !q) return []
    return pdata.list
      .filter((m) => m.name.toLowerCase().includes(q) || m.nameEn.toLowerCase().includes(q))
      .slice(0, 8)
  }, [pdata, query])

  const curves = useMemo(() => {
    if (plotW <= 0) return []
    return cfg.curves.map((c) => {
      const steps = 160
      let d = ''
      let pen = false
      for (let i = 0; i <= steps; i++) {
        const x = cfg.xMin + (i / steps) * (cfg.xMax - cfg.xMin)
        const y = c.fn(x)
        if (!isFinite(y) || y < cfg.yMin || y > cfg.yMax) {
          pen = false
          continue
        }
        d += `${pen ? 'L' : 'M'}${sx(x).toFixed(1)} ${sy(y).toFixed(1)} `
        pen = true
      }
      return { d, color: c.color, label: c.label }
    })
  }, [cfg, w, h])

  const toggleType = (t: PokemonType) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(t) ? next.delete(t) : next.add(t)
      return next
    })

  const ready = plotW > 0 && plotH > 0

  return (
    <div class="explorer">
      <div class="toolbar">
        <div class="poke-search">
          {pokeSel ? (
            <div class="poke-sel">
              <PokeSprite mon={pokeSel} size={24} />
              <span class="poke-sel-name static-text">{locale === 'ko' ? pokeSel.name : pokeSel.nameEn}</span>
              <button class="poke-sel-x" onClick={clearPoke} aria-label={dict.search.clear}>
                ×
              </button>
            </div>
          ) : (
            <input
              class="poke-input"
              type="text"
              value={query}
              placeholder={dict.search.placeholder}
              onFocus={() => {
                ensureData()
                clearTimeout(searchBlur.current)
                setSearchOpen(true)
              }}
              onBlur={() => {
                searchBlur.current = setTimeout(() => setSearchOpen(false), 120)
              }}
              onInput={(e) => {
                ensureData()
                setQuery((e.currentTarget as HTMLInputElement).value)
              }}
              onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
            />
          )}
          {searchOpen && query.trim() && results.length > 0 && (
            <div class="poke-results scroll-hidden">
              {results.map((m) => (
                <button key={m.id} class="poke-result" onMouseDown={() => selectPoke(m)}>
                  <PokeSprite mon={m} size={26} />
                  <span class="static-text">{locale === 'ko' ? m.name : m.nameEn}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div class="filter-bar scroll-hidden">
          {category === 'charged' && (
            <button
              class="type-btn mode"
              onClick={() => setMode((m) => (m === 'pve' ? 'pvp' : 'pve'))}
            >
              {mode === 'pve' ? 'PvP' : 'PvE'}
            </button>
          )}
          <button class="type-btn all" onClick={() => setSelected(new Set())}>
            {dict.common.allType}
          </button>
          {POKEMON_TYPES.map((t) => {
            const active = selected.size === 0 || selected.has(t)
            return (
              <button
                key={t}
                class="type-btn"
                title={dict.type[t]}
                style={{ background: TYPE_COLORS[t], opacity: active ? 1 : 0.3 }}
                onClick={() => toggleType(t)}
              >
                <img src={`${base}images/types/${t}.png`} width={18} height={18} alt={dict.type[t]} />
                <span class="type-btn-label">{dict.type[t]}</span>
              </button>
            )
          })}
        </div>
        <div class="legend">
          {cfg.curves.map((c) => (
            <span key={c.label} class="legend-item">
              <span class="legend-swatch" style={{ background: c.color }} />
              {c.label}
            </span>
          ))}
        </div>
      </div>

      <div class="chart" ref={wrapRef}>
        {ready && (
          <>
            <svg class="chart-svg" width={w} height={h} role="img" aria-label={`${cfg.xLabel} / ${cfg.yLabel}`}>
              {cfg.xTicks.map((t) => (
                <g key={`x${t}`}>
                  <line x1={sx(t)} y1={PAD.top} x2={sx(t)} y2={PAD.top + plotH} class="grid" />
                  <text x={sx(t)} y={PAD.top + plotH + 16} class="tick" text-anchor="middle">
                    {t}
                  </text>
                </g>
              ))}
              {cfg.yTicks.map((t) => (
                <g key={`y${t}`}>
                  <line x1={PAD.left} y1={sy(t)} x2={PAD.left + plotW} y2={sy(t)} class="grid" />
                  <text x={PAD.left - 8} y={sy(t) + 4} class="tick" text-anchor="end">
                    {t}
                  </text>
                </g>
              ))}
              {curves.map((c) => (
                <path key={c.label} d={c.d} stroke={c.color} stroke-width={1.5} fill="none" />
              ))}
              {points.map((p) => (
                <circle key={`dot-${p.id}`} cx={sx(p.x)} cy={sy(p.y)} r={3.5} fill={TYPE_COLORS[p.type]} stroke="#00000066" stroke-width={1} opacity={highlight && !highlight.has(p.id) ? 0.15 : 1} />
              ))}
              <text x={PAD.left + plotW / 2} y={h - 6} class="axis-title" text-anchor="middle">
                {cfg.xLabel}
              </text>
              <text class="axis-title" text-anchor="middle" transform={`translate(14 ${PAD.top + plotH / 2}) rotate(-90)`}>
                {cfg.yLabel}
              </text>
            </svg>

            {points.map((p) => {
              const ci = clusterById.get(p.id)!
              const fanned = activeKey === ci.key && ci.size > 1
              const offset = fanned ? (ci.idx - (ci.size - 1) / 2) * FAN_GAP : 0
              const isHover = hover === p.id
              // clamp so off-scale moves (e.g. very high DPS) sit at the edge, never overflow
              const cx = Math.min(Math.max(sx(p.x), PAD.left), w - PAD.right)
              const cy = Math.min(Math.max(sy(p.y) + offset, PAD.top), h - PAD.bottom)
              return (
                <button
                  key={p.id}
                  class={`chip${isHover ? ' active' : ''}${fanned ? ' fanned' : ''}${highlight ? (highlight.has(p.id) ? ' hl' : ' dim') : ''}`}
                  style={{
                    left: `${cx}px`,
                    top: `${cy}px`,
                    background: TYPE_COLORS[p.type],
                    zIndex: isHover ? 30 : fanned ? 20 : undefined,
                  }}
                  onMouseEnter={() => enter(p.id)}
                  onMouseLeave={() => leave(p.id)}
                  onFocus={() => enter(p.id)}
                  onBlur={() => leave(p.id)}
                  onClick={() => setPicked(p.id)}
                >
                  <span class="static-text">{p.label}</span>
                  {isHover && (
                    <span class="tooltip">
                      <strong>{p.label}</strong>
                      {p.lines.map((line, i) => (
                        <span key={i}>{line}</span>
                      ))}
                    </span>
                  )}
                </button>
              )
            })}
          </>
        )}
      </div>

      {pickedPoint && (
        <div class="panel-backdrop" onClick={() => setPicked(null)}>
          <div class="move-panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button class="panel-close" onClick={() => setPicked(null)} aria-label={dict.panel.close}>
              ×
            </button>
            <div class="panel-head">
              <span class="panel-dot" style={{ background: TYPE_COLORS[pickedPoint.type] }} />
              <strong>{pickedPoint.label}</strong>
            </div>
            <div class="panel-stats">
              {pickedPoint.lines.map((line, i) => (
                <span key={i}>{line}</span>
              ))}
            </div>
            <div class="panel-sub">
              <span>{dict.panel.usedBy}</span>
              {pickedMons && <span class="panel-count">{fmt(dict.panel.count, { n: pickedMons.length })}</span>}
            </div>
            {!pdata ? (
              <div class="panel-msg">{dict.panel.loading}</div>
            ) : pickedMons && pickedMons.length === 0 ? (
              <div class="panel-msg">{dict.panel.none}</div>
            ) : (
              <div class="poke-grid scroll-hidden">
                {pickedMons!.map((m) => (
                  <div key={m.id} class="poke-card" title={locale === 'ko' ? m.name : m.nameEn}>
                    <PokeSprite mon={m} />
                    <span class="poke-name static-text">{locale === 'ko' ? m.name : m.nameEn}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
