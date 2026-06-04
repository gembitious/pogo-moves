/** @jsxImportSource preact */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import {
  POKEMON_TYPES,
  TYPE_COLORS,
  TYPE_TEXT,
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
import { PokemonSearch } from './PokemonSearch'
import { readMoveId, readSelectedId, writeMoveId, writeSelectedId } from '@/lib/urlState'

const base = import.meta.env.BASE_URL
const PAD = { left: 56, right: 18, top: 14, bottom: 44 } // px around the plot area
// Locked to Shadow / Purified forms, which the reverse index (base species only) omits.
const SHADOW_LOCKED = new Set(['frustration', 'return'])

interface Point {
  id: string
  label: string
  type: PokemonType
  power: number
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
          power: p.power,
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
          power: p.power,
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
        power: p.power,
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
  const [loadErr, setLoadErr] = useState(false)
  const [view, setView] = useState<'chart' | 'list'>('chart')
  const [sort, setSort] = useState<{ key: 'name' | 'type' | 'power' | 'x' | 'y'; dir: 1 | -1 }>({ key: 'power', dir: -1 })
  const wrapRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef<HTMLElement | null>(null)
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

  const leaveTimer = useRef<ReturnType<typeof setTimeout>>()
  const enter = (id: string) => {
    clearTimeout(leaveTimer.current)
    setHover(id)
  }
  const leave = (id: string) => {
    leaveTimer.current = setTimeout(() => setHover((cur) => (cur === id ? null : cur)), 90)
  }
  // Spread co-located dots in a small ring so each stays individually hoverable.
  const posOf = (p: Point): [number, number] => {
    const ci = clusterById.get(p.id)
    let jx = 0
    let jy = 0
    if (ci && ci.size > 1) {
      const a = (ci.idx / ci.size) * Math.PI * 2
      jx = Math.cos(a) * 7
      jy = Math.sin(a) * 7
    }
    return [
      Math.min(Math.max(sx(p.x) + jx, PAD.left), w - PAD.right),
      Math.min(Math.max(sy(p.y) + jy, PAD.top), h - PAD.bottom),
    ]
  }
  // Show as many non-overlapping labels as fit (the rest stay dots; hover/selection
  // still labels any point). Higher-value moves win contested space.
  const labeledIds = useMemo(() => {
    const ids = new Set<string>()
    if (plotW <= 0 || plotH <= 0) return ids
    const placed: { l: number; r: number; t: number; b: number }[] = []
    const charW = locale === 'ko' ? 12 : 7
    for (const p of [...points].sort((a, b) => b.y - a.y || b.x - a.x)) {
      const [cx, cy] = posOf(p)
      const hw = (Math.min(p.label.length, 8) * charW + 12) / 2
      const box = { l: cx - hw, r: cx + hw, t: cy - 9, b: cy + 9 }
      if (!placed.some((q) => box.l < q.r && box.r > q.l && box.t < q.b && box.b > q.t)) {
        placed.push(box)
        ids.add(p.id)
      }
    }
    return ids
  }, [points, w, h, cfg, locale])

  // Load the index on demand (search focus, an open move panel, or a restored selection).
  const load = async () => {
    if (pdata) return pdata
    setLoadErr(false)
    try {
      const d = await loadPokemonIndex(base)
      setPdata(d)
      return d
    } catch (e) {
      setLoadErr(true)
      throw e
    }
  }
  const openPanel = (id: string) => {
    setHover(null) // avoid a lingering hover label/tooltip after a tap on touch
    setPicked(id)
    writeMoveId(id)
  }
  const closePanel = () => {
    setPicked(null)
    writeMoveId(null)
  }

  // Restore selection (?p= / localStorage) and an open move panel (?m=) on mount.
  useEffect(() => {
    const sel = readSelectedId()
    const mv = readMoveId()
    if (mv) setPicked(mv)
    if (sel || mv)
      load()
        .then((d) => {
          if (sel) {
            const m = d.byId.get(sel)
            if (m) setPokeSel(m)
          }
        })
        .catch(() => {})
  }, [])

  useEffect(() => {
    if (picked && !pdata) load().catch(() => {})
  }, [picked])
  useEffect(() => {
    if (!picked) return
    restoreFocus.current = document.activeElement as HTMLElement
    const t = setTimeout(() => panelRef.current?.querySelector<HTMLElement>('.panel-close')?.focus(), 0)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closePanel()
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      restoreFocus.current?.focus?.()
    }
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

  const selectPoke = (m: PokemonEntry) => {
    setPokeSel(m)
    writeSelectedId(m.id)
  }
  const clearPoke = () => {
    setPokeSel(null)
    writeSelectedId(null)
  }
  const highlight = useMemo(
    () => (pokeSel ? new Set(category === 'fast' ? pokeSel.fast : pokeSel.charged) : null),
    [pokeSel, category],
  )
  const moveOpts = useMemo(() => allPoints.map((p) => ({ id: p.id, label: p.label, type: p.type })), [allPoints])
  const sortBy = (key: typeof sort.key) =>
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === 'name' || key === 'type' ? 1 : -1 }))
  const ind = (k: typeof sort.key) => (sort.key === k ? (sort.dir < 0 ? ' ▼' : ' ▲') : '')
  const sortTh = (key: typeof sort.key, label: string, num = false) => (
    <th class={`sortable${num ? ' num' : ''}`} aria-sort={sort.key === key ? (sort.dir < 0 ? 'descending' : 'ascending') : 'none'}>
      <button class="th-sort" onClick={() => sortBy(key)}>
        {label}
        {ind(key)}
      </button>
    </th>
  )
  const rows = useMemo(() => {
    const val = (p: Point) => (sort.key === 'power' ? p.power : sort.key === 'x' ? p.x : p.y)
    return [...points].sort((a, b) => {
      const c =
        sort.key === 'name'
          ? a.label.localeCompare(b.label)
          : sort.key === 'type'
            ? a.type.localeCompare(b.type)
            : val(a) - val(b)
      return c * sort.dir
    })
  }, [points, sort])

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
        {pokeSel ? (
          <div class="poke-search">
            <div class="poke-sel">
              <PokeSprite mon={pokeSel} size={24} />
              <span class="poke-sel-name static-text">{locale === 'ko' ? pokeSel.name : pokeSel.nameEn}</span>
              <button class="poke-sel-x" onClick={clearPoke} aria-label={dict.search.clear}>
                ×
              </button>
            </div>
          </div>
        ) : (
          <PokemonSearch
            list={pdata?.list}
            moves={moveOpts}
            onSelectMove={openPanel}
            placeholder={dict.search.placeholderAll}
            locale={locale}
            dict={dict}
            onSelect={selectPoke}
            onActivate={load}
          />
        )}
        <div class="filter-bar scroll-hidden">
          <button class="type-btn mode" onClick={() => setView((v) => (v === 'chart' ? 'list' : 'chart'))}>
            {view === 'chart' ? dict.common.list : dict.common.chart}
          </button>
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
                aria-pressed={selected.has(t)}
                style={{ background: TYPE_COLORS[t], color: TYPE_TEXT[t], opacity: active ? 1 : 0.3 }}
                onClick={() => toggleType(t)}
              >
                <img src={`${base}images/types/${t}.png`} width={18} height={18} alt={dict.type[t]} />
                <span class="type-btn-label">{dict.type[t]}</span>
              </button>
            )
          })}
        </div>
        {view === 'chart' && (
          <div class="legend">
            {cfg.curves.map((c) => (
              <span key={c.label} class="legend-item">
                <span class="legend-swatch" style={{ background: c.color }} />
                {c.label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div class="chart" ref={wrapRef}>
        {view === 'list' ? (
          <div class="move-list scroll-hidden">
            <table>
              <thead>
                <tr>
                  {sortTh('name', dict.common.name)}
                  {sortTh('type', dict.common.type)}
                  {sortTh('power', dict.move.damage, true)}
                  {sortTh('x', cfg.xLabel, true)}
                  {sortTh('y', cfg.yLabel, true)}
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr
                    key={p.id}
                    class={highlight ? (highlight.has(p.id) ? 'hl' : 'dim') : ''}
                    onClick={() => openPanel(p.id)}
                  >
                    <td class="mv-cell-name">{p.label}</td>
                    <td>
                      <img class="mv-type-ic" src={`${base}images/types/${p.type}.png`} width={18} height={18} alt={dict.type[p.type]} />
                    </td>
                    <td class="num">{p.power}</td>
                    <td class="num">{p.x}</td>
                    <td class="num">{p.y}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : ready ? (
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
              {points.map((p) => {
                const [cx, cy] = posOf(p)
                return (
                  <circle key={`dot-${p.id}`} cx={cx} cy={cy} r={4} fill={TYPE_COLORS[p.type]} stroke="#00000066" stroke-width={1} opacity={highlight && !highlight.has(p.id) ? 0.18 : 1} />
                )
              })}
              <text x={PAD.left + plotW / 2} y={h - 6} class="axis-title" text-anchor="middle">
                {cfg.xLabel}
              </text>
              <text class="axis-title" text-anchor="middle" transform={`translate(14 ${PAD.top + plotH / 2}) rotate(-90)`}>
                {cfg.yLabel}
              </text>
            </svg>

            {points.map((p) => {
              const [cx, cy] = posOf(p)
              const isHover = hover === p.id
              const isHl = !!highlight && highlight.has(p.id)
              const labeled = isHover || isHl || labeledIds.has(p.id)
              const dim = !!highlight && !highlight.has(p.id)
              return (
                <button
                  key={p.id}
                  class={`chip${labeled ? ' labeled' : ''}${isHover ? ' active' : ''}${isHl ? ' hl' : ''}${dim ? ' dim' : ''}`}
                  style={{
                    left: `${cx}px`,
                    top: `${cy}px`,
                    background: labeled ? TYPE_COLORS[p.type] : 'transparent',
                    color: labeled ? TYPE_TEXT[p.type] : undefined,
                    zIndex: isHover ? 30 : isHl ? 20 : undefined,
                  }}
                  aria-label={p.label}
                  onMouseEnter={() => enter(p.id)}
                  onMouseLeave={() => leave(p.id)}
                  onFocus={() => enter(p.id)}
                  onBlur={() => leave(p.id)}
                  onClick={() => openPanel(p.id)}
                >
                  {labeled && <span class="static-text">{p.label}</span>}
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
        ) : null}
      </div>

      {pickedPoint && (
        <div class="panel-backdrop" onClick={closePanel}>
          <div
            class="move-panel"
            role="dialog"
            aria-modal="true"
            ref={panelRef}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key !== 'Tab') return
              const els = panelRef.current?.querySelectorAll<HTMLElement>('a[href], button')
              if (!els || !els.length) return
              const first = els[0]
              const last = els[els.length - 1]
              if (e.shiftKey && document.activeElement === first) {
                e.preventDefault()
                last.focus()
              } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault()
                first.focus()
              }
            }}
          >
            <button class="panel-close" onClick={closePanel} aria-label={dict.panel.close}>
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
            {loadErr && !pdata ? (
              <div class="panel-msg">
                {dict.common.error}{' '}
                <button class="retry-btn" onClick={() => load().catch(() => {})}>
                  {dict.common.retry}
                </button>
              </div>
            ) : !pdata ? (
              <div class="panel-msg">{dict.panel.loading}</div>
            ) : pickedMons && pickedMons.length === 0 ? (
              <div class="panel-msg">{SHADOW_LOCKED.has(picked!) ? dict.panel.shadowOnly : dict.panel.none}</div>
            ) : (
              <div class="poke-grid scroll-hidden">
                {pickedMons!.map((m) => (
                  <a
                    key={m.id}
                    class="poke-card"
                    href={`${base}${locale}/pokemon?p=${m.id}`}
                    title={locale === 'ko' ? m.name : m.nameEn}
                  >
                    <PokeSprite mon={m} />
                    <span class="poke-name static-text">{locale === 'ko' ? m.name : m.nameEn}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
