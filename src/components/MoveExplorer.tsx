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
import { type ChargedMove, type FastMove } from '@/lib/formulas'
import { buildPoints, type Point } from '@/lib/moveChart'
import { getChartConfig } from '@/lib/chartConfig'
import { type Dictionary, type Locale } from '@/lib/i18n'
import { loadPokemonIndex, type PokemonEntry, type PokemonIndex } from '@/lib/pokemonIndex'
import { PokeSprite } from './PokeSprite'
import { PokemonSearch } from './PokemonSearch'
import { MoveList } from './MoveList'
import { MovePanel } from './MovePanel'
import { readMoveId, readSelectedId, writeMoveId, writeSelectedId } from '@/lib/urlState'

const base = import.meta.env.BASE_URL
const PAD = { left: 56, right: 18, top: 14, bottom: 44 } // px around the plot area
// Locked to Shadow / Purified forms, which the reverse index (base species only) omits.
const SHADOW_LOCKED = new Set(['frustration', 'return'])
const CELL = 26 // px grid for collapsing overlapping points into a "+N" marker

interface Props {
  category: MoveCategory
  locale: Locale
  dict: Dictionary
  moves: FastMove[] | ChargedMove[]
}

type Cluster = { key: string; cx: number; cy: number; pts: Point[] }

// Hybrid cluster glyph: a small cluster (≤3) shows its individual type-colored dots
// so each move stays visible; a denser cluster collapses to a type-composition pie
// (wedge per type, sized by share) with a count badge. Either way the contents are
// readable at a glance — no opaque "+N".
function ClusterGlyph({ pts }: { pts: Point[] }) {
  const n = pts.length
  if (n <= 3) {
    const spots = n === 2 ? [[8, 12], [16, 12]] : [[12, 7], [7, 16], [17, 16]]
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {pts.map((p, i) => (
          <circle key={p.id} cx={spots[i][0]} cy={spots[i][1]} r={5.5} fill={TYPE_COLORS[p.type]} stroke="#00000077" stroke-width={1} />
        ))}
      </svg>
    )
  }
  const counts = new Map<PokemonType, number>()
  for (const p of pts) counts.set(p.type, (counts.get(p.type) ?? 0) + 1)
  const segs = [...counts.entries()].sort((a, b) => b[1] - a[1])
  const cx = 11
  const cy = 11
  const r = 10
  let a0 = -Math.PI / 2
  const wedges = segs.map(([type, cnt]) => {
    const a1 = a0 + (cnt / n) * Math.PI * 2
    const d = `M${cx} ${cy} L${(cx + r * Math.cos(a0)).toFixed(2)} ${(cy + r * Math.sin(a0)).toFixed(2)} A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${(cx + r * Math.cos(a1)).toFixed(2)} ${(cy + r * Math.sin(a1)).toFixed(2)} Z`
    a0 = a1
    return { type, d }
  })
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {segs.length === 1 ? (
        <circle cx={cx} cy={cy} r={r} fill={TYPE_COLORS[segs[0][0]]} />
      ) : (
        wedges.map((wg) => <path key={wg.type} d={wg.d} fill={TYPE_COLORS[wg.type]} />)
      )}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#00000055" stroke-width={1} />
      <circle cx={19} cy={5} r={6.5} fill="#02222e" stroke="#8ecae6" stroke-width={1} />
      <text x={19} y={5} fill="#ffffff" font-size={8} font-weight={700} text-anchor="middle" dominant-baseline="central">
        {n}
      </text>
    </svg>
  )
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
  const [expanded, setExpanded] = useState<string | null>(null)
  const [popHover, setPopHover] = useState<string | null>(null)
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

  // Bin points into screen-space cells: dense regions collapse into one "+N" marker
  // (click to expand) instead of overlapping dots.
  const clusters = useMemo<Cluster[]>(() => {
    if (plotW <= 0 || plotH <= 0) return []
    const cells = new Map<string, Point[]>()
    const pos = new Map<string, [number, number]>()
    for (const p of points) {
      const cx = Math.min(Math.max(sx(p.x), PAD.left), w - PAD.right)
      const cy = Math.min(Math.max(sy(p.y), PAD.top), h - PAD.bottom)
      pos.set(p.id, [cx, cy])
      const key = `${Math.floor(cx / CELL)}|${Math.floor(cy / CELL)}`
      const arr = cells.get(key)
      if (arr) arr.push(p)
      else cells.set(key, [p])
    }
    return [...cells.entries()].map(([key, pts]) => {
      let X = 0
      let Y = 0
      for (const p of pts) {
        const [a, b] = pos.get(p.id)!
        X += a
        Y += b
      }
      return { key, cx: X / pts.length, cy: Y / pts.length, pts }
    })
  }, [points, w, h, cfg])

  const leaveTimer = useRef<ReturnType<typeof setTimeout>>()
  const enter = (id: string) => {
    clearTimeout(leaveTimer.current)
    setHover(id)
  }
  const leave = (id: string) => {
    leaveTimer.current = setTimeout(() => setHover((cur) => (cur === id ? null : cur)), 90)
  }
  // Cluster popover: opens on hover (mouse) or tap (touch); a short close delay lets
  // the pointer travel from the glyph into the popover without it snapping shut.
  const popTimer = useRef<ReturnType<typeof setTimeout>>()
  const openCluster = (key: string) => {
    clearTimeout(popTimer.current)
    setExpanded(key)
  }
  const closeClusterSoon = () => {
    popTimer.current = setTimeout(() => setExpanded(null), 140)
  }
  // Label as many singleton points as fit without overlapping (higher-value moves
  // win contested space). Hover/selection still labels any point on demand.
  const labeledIds = useMemo(() => {
    const ids = new Set<string>()
    const placed: { l: number; r: number; t: number; b: number }[] = []
    const charW = locale === 'ko' ? 12 : 7
    for (const c of clusters.filter((c) => c.pts.length === 1).sort((a, b) => b.pts[0].y - a.pts[0].y)) {
      const p = c.pts[0]
      const hw = (Math.min(p.label.length, 8) * charW + 12) / 2
      const box = { l: c.cx - hw, r: c.cx + hw, t: c.cy - 9, b: c.cy + 9 }
      if (!placed.some((q) => box.l < q.r && box.r > q.l && box.t < q.b && box.b > q.t)) {
        placed.push(box)
        ids.add(p.id)
      }
    }
    return ids
  }, [clusters, locale])

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

  // Close an open cluster popover on any outside click.
  useEffect(() => {
    if (!expanded) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Element
      if (!t.closest('.cluster') && !t.closest('.cluster-pop')) setExpanded(null)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [expanded])

  // Reset the hovered row whenever the open cluster changes.
  useEffect(() => setPopHover(null), [expanded])

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
          <MoveList points={points} highlight={highlight} xLabel={cfg.xLabel} yLabel={cfg.yLabel} dict={dict} onPick={openPanel} />
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
              {clusters.map((c) =>
                c.pts.length === 1 ? (
                  <circle
                    key={c.key}
                    cx={c.cx}
                    cy={c.cy}
                    r={4}
                    fill={TYPE_COLORS[c.pts[0].type]}
                    stroke="#00000066"
                    stroke-width={1}
                    opacity={highlight && !highlight.has(c.pts[0].id) ? 0.18 : 1}
                  />
                ) : null,
              )}
              <text x={PAD.left + plotW / 2} y={h - 6} class="axis-title" text-anchor="middle">
                {cfg.xLabel}
              </text>
              <text class="axis-title" text-anchor="middle" transform={`translate(14 ${PAD.top + plotH / 2}) rotate(-90)`}>
                {cfg.yLabel}
              </text>
            </svg>

            {clusters.map((c) => {
              if (c.pts.length === 1) {
                const p = c.pts[0]
                const isHover = hover === p.id
                const isHl = !!highlight && highlight.has(p.id)
                const labeled = isHover || isHl || labeledIds.has(p.id)
                const dim = !!highlight && !highlight.has(p.id)
                return (
                  <button
                    key={p.id}
                    class={`chip${labeled ? ' labeled' : ''}${isHover ? ' active' : ''}${isHl ? ' hl' : ''}${dim ? ' dim' : ''}`}
                    style={{
                      left: `${c.cx}px`,
                      top: `${c.cy}px`,
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
              }
              const hasHl = !!highlight && c.pts.some((p) => highlight.has(p.id))
              const dim = !!highlight && !hasHl
              return (
                <button
                  key={c.key}
                  class={`chip cluster${hasHl ? ' hl' : ''}${dim ? ' dim' : ''}`}
                  style={{ left: `${c.cx}px`, top: `${c.cy}px`, zIndex: expanded === c.key ? 40 : hasHl ? 20 : undefined }}
                  aria-label={`${c.pts.length} ${dict.search.move}`}
                  aria-expanded={expanded === c.key}
                  onPointerEnter={(e) => e.pointerType === 'mouse' && openCluster(c.key)}
                  onPointerLeave={(e) => e.pointerType === 'mouse' && closeClusterSoon()}
                  onFocus={() => openCluster(c.key)}
                  onBlur={closeClusterSoon}
                  onClick={() => setExpanded((e) => (e === c.key ? null : c.key))}
                >
                  <ClusterGlyph pts={c.pts} />
                </button>
              )
            })}
            {expanded &&
              (() => {
                const c = clusters.find((x) => x.key === expanded)
                if (!c || c.pts.length < 2) return null
                const sorted = [...c.pts].sort((a, b) => b.y - a.y || b.x - a.x)
                const active = sorted.find((p) => p.id === popHover) ?? sorted[0]
                return (
                  <div
                    class="cluster-pop"
                    style={{ left: `${c.cx}px`, top: `${c.cy}px` }}
                    onPointerEnter={(e) => e.pointerType === 'mouse' && clearTimeout(popTimer.current)}
                    onPointerLeave={(e) => e.pointerType === 'mouse' && closeClusterSoon()}
                  >
                    <div class="cluster-pop-list scroll-hidden">
                      {sorted.map((p) => (
                        <button
                          key={p.id}
                          class={`cluster-pop-item${p.id === active.id ? ' active' : ''}`}
                          onMouseEnter={() => setPopHover(p.id)}
                          onFocus={() => setPopHover(p.id)}
                          onClick={() => {
                            setExpanded(null)
                            openPanel(p.id)
                          }}
                        >
                          <span class="cluster-pop-dot" style={{ background: TYPE_COLORS[p.type] }} />
                          <span class="static-text">{p.label}</span>
                        </button>
                      ))}
                    </div>
                    {/* spec of the hovered row (defaults to the top one) */}
                    <div class="cluster-pop-foot">
                      <strong>{active.label}</strong>
                      {active.lines.map((line, i) => (
                        <span key={i}>{line}</span>
                      ))}
                    </div>
                  </div>
                )
              })()}
          </>
        ) : null}
      </div>

      {pickedPoint && (
        <MovePanel
          point={pickedPoint}
          mons={pickedMons}
          loading={!pdata}
          loadErr={loadErr}
          shadowLocked={SHADOW_LOCKED.has(picked!)}
          locale={locale}
          dict={dict}
          detailHref={`${base}${locale}/move?m=${picked}`}
          onRetry={() => load().catch(() => {})}
          onClose={closePanel}
        />
      )}
    </div>
  )
}
