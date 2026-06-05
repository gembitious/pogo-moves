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
  // Chart zoom (k) + pan (tx,ty), in screen px. Re-clusters at scale so dense
  // regions spread apart and become tappable — esp. on mobile.
  const [zoom, setZoom] = useState({ k: 1, tx: 0, ty: 0 })
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{ x: number; y: number; dist: number } | null>(null)
  const panned = useRef(false)

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
  // Zoom/pan applied on top of the base projection (scale about the plot origin).
  const zx = (x: number) => PAD.left + (sx(x) - PAD.left) * zoom.k + zoom.tx
  const zy = (y: number) => PAD.top + (sy(y) - PAD.top) * zoom.k + zoom.ty
  const MAX_K = 6
  const clampView = (k: number, tx: number, ty: number) => {
    const kk = Math.max(1, Math.min(MAX_K, k))
    return { k: kk, tx: Math.min(0, Math.max(plotW * (1 - kk), tx)), ty: Math.min(0, Math.max(plotH * (1 - kk), ty)) }
  }
  // Multiply the scale by `factor`, keeping the point under (fx,fy) fixed.
  const zoomByFactor = (factor: number, fx: number, fy: number) =>
    setZoom((z) => {
      const kk = Math.max(1, Math.min(MAX_K, z.k * factor))
      const r = kk / z.k
      return clampView(kk, (fx - PAD.left) * (1 - r) + z.tx * r, (fy - PAD.top) * (1 - r) + z.ty * r)
    })
  const resetZoom = () => setZoom({ k: 1, tx: 0, ty: 0 })

  // Reset on domain change; re-clamp the pan when the chart is resized.
  useEffect(resetZoom, [category, mode])
  useEffect(() => {
    setZoom((z) => ({ k: z.k, tx: Math.min(0, Math.max(plotW * (1 - z.k), z.tx)), ty: Math.min(0, Math.max(plotH * (1 - z.k), z.ty)) }))
  }, [w, h])

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
      const cx = zx(p.x)
      const cy = zy(p.y)
      // Cull points panned/zoomed outside the plot (instead of piling them on the edge).
      if (cx < PAD.left || cx > w - PAD.right || cy < PAD.top || cy > h - PAD.bottom) continue
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
  }, [points, w, h, cfg, zoom])

  // Bloom: when a multi-point cluster has enough free space around it (opened up by
  // zooming in), scatter its points in a sunflower pattern into that space so each
  // becomes an individual, tappable dot. This is the only way to pull apart exactly
  // coincident moves (same DPT/EPT) — zoom alone can never separate them.
  const bloom = useMemo(() => {
    const out = new Map<string, { pos: { x: number; y: number }[]; r: number; cx: number; cy: number }>()
    const golden = Math.PI * (3 - Math.sqrt(5))
    for (const c of clusters) {
      const n = c.pts.length
      if (n < 2) continue
      let nearest = Infinity
      for (const o of clusters) {
        if (o !== c) nearest = Math.min(nearest, Math.hypot(o.cx - c.cx, o.cy - c.cy))
      }
      const need = 0.62 * 15 * Math.sqrt(n) // radius to seat n dots ~15px apart
      const avail = Math.min(nearest / 2 - 6, c.cx - PAD.left, w - PAD.right - c.cx, c.cy - PAD.top, h - PAD.bottom - c.cy, 96)
      if (avail < 16 || avail < need) continue // not enough room — stay a glyph
      const pos = c.pts.map((_, i) => {
        const rr = need * Math.sqrt(i / (n - 1))
        const a = i * golden
        return { x: c.cx + rr * Math.cos(a), y: c.cy + rr * Math.sin(a) }
      })
      out.set(c.key, { pos, r: need, cx: c.cx, cy: c.cy })
    }
    return out
  }, [clusters, w, h])

  // Flatten clusters into individually-placed dots (singletons + bloomed members) and
  // the glyphs that stay collapsed (no room to bloom).
  const { dots, glyphs } = useMemo(() => {
    const dots: { pt: Point; x: number; y: number }[] = []
    const glyphs: Cluster[] = []
    for (const c of clusters) {
      if (c.pts.length === 1) dots.push({ pt: c.pts[0], x: c.cx, y: c.cy })
      else {
        const b = bloom.get(c.key)
        if (b) c.pts.forEach((pt, i) => dots.push({ pt, x: b.pos[i].x, y: b.pos[i].y }))
        else glyphs.push(c)
      }
    }
    return { dots, glyphs }
  }, [clusters, bloom])

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
        d += `${pen ? 'L' : 'M'}${zx(x).toFixed(1)} ${zy(y).toFixed(1)} `
        pen = true
      }
      return { d, color: c.color, label: c.label }
    })
  }, [cfg, w, h, zoom])

  const toggleType = (t: PokemonType) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(t) ? next.delete(t) : next.add(t)
      return next
    })

  // --- pointer gestures: drag to pan, two-finger pinch to zoom ---
  const ptAt = (e: { clientX: number; clientY: number }) => {
    const r = wrapRef.current?.getBoundingClientRect()
    return r ? { x: e.clientX - r.left, y: e.clientY - r.top } : { x: 0, y: 0 }
  }
  const onPointerDown = (e: PointerEvent) => {
    if (view !== 'chart') return
    const p = ptAt(e)
    pointers.current.set(e.pointerId, p)
    panned.current = false
    const pts = [...pointers.current.values()]
    gesture.current =
      pts.length >= 2
        ? { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2, dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) }
        : { x: p.x, y: p.y, dist: 0 }
  }
  const onPointerMove = (e: PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return
    pointers.current.set(e.pointerId, ptAt(e))
    const g = gesture.current
    const pts = [...pointers.current.values()]
    if (pts.length >= 2) {
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      const mx = (pts[0].x + pts[1].x) / 2
      const my = (pts[0].y + pts[1].y) / 2
      if (g.dist > 0) {
        const ratio = dist / g.dist
        setZoom((z) => {
          const kk = Math.max(1, Math.min(MAX_K, z.k * ratio))
          const r = kk / z.k
          return clampView(kk, (mx - PAD.left) * (1 - r) + z.tx * r + (mx - g.x), (my - PAD.top) * (1 - r) + z.ty * r + (my - g.y))
        })
      }
      gesture.current = { x: mx, y: my, dist }
      panned.current = true
    } else {
      const p = pts[0]
      const dx = p.x - g.x
      const dy = p.y - g.y
      if (Math.abs(dx) + Math.abs(dy) > 3) panned.current = true
      setZoom((z) => clampView(z.k, z.tx + dx, z.ty + dy))
      gesture.current = { x: p.x, y: p.y, dist: 0 }
    }
  }
  const onPointerUp = (e: PointerEvent) => {
    pointers.current.delete(e.pointerId)
    const pts = [...pointers.current.values()]
    gesture.current = pts.length === 1 ? { x: pts[0].x, y: pts[0].y, dist: 0 } : null
    if (pts.length === 0) setTimeout(() => (panned.current = false), 0)
  }
  // Wheel zoom (non-passive so we can prevent page scroll).
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (view !== 'chart') return
      e.preventDefault()
      const p = ptAt(e)
      zoomByFactor(e.deltaY < 0 ? 1.18 : 1 / 1.18, p.x, p.y)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [view, plotW, plotH, zoom])

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

      <div
        class="chart"
        ref={wrapRef}
        style={view === 'chart' ? { touchAction: 'none' } : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {view === 'chart' && ready && (
          <div class="zoom-ctrl">
            <button aria-label="Zoom in" onClick={() => zoomByFactor(1.5, PAD.left + plotW / 2, PAD.top + plotH / 2)}>
              +
            </button>
            <button aria-label="Zoom out" onClick={() => zoomByFactor(1 / 1.5, PAD.left + plotW / 2, PAD.top + plotH / 2)}>
              −
            </button>
            {zoom.k > 1.01 && (
              <button class="zoom-reset" aria-label="Reset zoom" onClick={resetZoom}>
                ⟲
              </button>
            )}
          </div>
        )}
        {view === 'list' ? (
          <MoveList points={points} highlight={highlight} xLabel={cfg.xLabel} yLabel={cfg.yLabel} dict={dict} onPick={openPanel} />
        ) : ready ? (
          <>
            <svg class="chart-svg" width={w} height={h} role="img" aria-label={`${cfg.xLabel} / ${cfg.yLabel}`}>
              <defs>
                <clipPath id="mc-clip">
                  <rect x={PAD.left} y={PAD.top} width={plotW} height={plotH} />
                </clipPath>
              </defs>
              <g clip-path="url(#mc-clip)">
                {cfg.xTicks.map((t) => {
                  const x = zx(t)
                  return x >= PAD.left && x <= w - PAD.right ? <line key={`gx${t}`} x1={x} y1={PAD.top} x2={x} y2={PAD.top + plotH} class="grid" /> : null
                })}
                {cfg.yTicks.map((t) => {
                  const y = zy(t)
                  return y >= PAD.top && y <= PAD.top + plotH ? <line key={`gy${t}`} x1={PAD.left} y1={y} x2={PAD.left + plotW} y2={y} class="grid" /> : null
                })}
                {curves.map((c) => (
                  <path key={c.label} d={c.d} stroke={c.color} stroke-width={1.5} fill="none" />
                ))}
                {[...bloom.values()].map((b) => (
                  <circle key={`hub${b.cx},${b.cy}`} cx={b.cx} cy={b.cy} r={b.r + 7} fill="none" stroke="#8ecae62e" stroke-width={1} stroke-dasharray="2 3" />
                ))}
                {dots.map((d) => (
                  <circle
                    key={d.pt.id}
                    cx={d.x}
                    cy={d.y}
                    r={4}
                    fill={TYPE_COLORS[d.pt.type]}
                    stroke="#00000066"
                    stroke-width={1}
                    opacity={highlight && !highlight.has(d.pt.id) ? 0.18 : 1}
                  />
                ))}
              </g>
              {cfg.xTicks.map((t) => {
                const x = zx(t)
                return x >= PAD.left && x <= w - PAD.right ? (
                  <text key={`tx${t}`} x={x} y={PAD.top + plotH + 16} class="tick" text-anchor="middle">
                    {t}
                  </text>
                ) : null
              })}
              {cfg.yTicks.map((t) => {
                const y = zy(t)
                return y >= PAD.top && y <= PAD.top + plotH ? (
                  <text key={`ty${t}`} x={PAD.left - 8} y={y + 4} class="tick" text-anchor="end">
                    {t}
                  </text>
                ) : null
              })}
              <text x={PAD.left + plotW / 2} y={h - 6} class="axis-title" text-anchor="middle">
                {cfg.xLabel}
              </text>
              <text class="axis-title" text-anchor="middle" transform={`translate(14 ${PAD.top + plotH / 2}) rotate(-90)`}>
                {cfg.yLabel}
              </text>
            </svg>

            {dots.map((d) => {
              const p = d.pt
              const isHover = hover === p.id
              const isHl = !!highlight && highlight.has(p.id)
              const labeled = isHover || isHl || labeledIds.has(p.id)
              const dim = !!highlight && !highlight.has(p.id)
              return (
                <button
                  key={p.id}
                  class={`chip${labeled ? ' labeled' : ''}${isHover ? ' active' : ''}${isHl ? ' hl' : ''}${dim ? ' dim' : ''}`}
                  style={{
                    left: `${d.x}px`,
                    top: `${d.y}px`,
                    background: labeled ? TYPE_COLORS[p.type] : 'transparent',
                    color: labeled ? TYPE_TEXT[p.type] : undefined,
                    zIndex: isHover ? 30 : isHl ? 20 : undefined,
                  }}
                  aria-label={p.label}
                  onMouseEnter={() => enter(p.id)}
                  onMouseLeave={() => leave(p.id)}
                  onFocus={() => enter(p.id)}
                  onBlur={() => leave(p.id)}
                  onClick={() => {
                    if (panned.current) return
                    openPanel(p.id)
                  }}
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
            {glyphs.map((c) => {
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
                  onClick={() => {
                    if (panned.current) return
                    setExpanded((e) => (e === c.key ? null : c.key))
                  }}
                >
                  <ClusterGlyph pts={c.pts} />
                </button>
              )
            })}
            {expanded &&
              (() => {
                const c = clusters.find((x) => x.key === expanded)
                if (!c || c.pts.length < 2 || bloom.has(c.key)) return null // bloomed → its dots are tappable directly
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
