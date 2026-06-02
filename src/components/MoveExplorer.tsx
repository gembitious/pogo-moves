/** @jsxImportSource preact */
import { useMemo, useState } from 'preact/hooks'
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

const base = import.meta.env.BASE_URL
const VW = 1600
const VH = 900
const PAD = { left: 64, right: 18, top: 18, bottom: 56 }
const plotW = VW - PAD.left - PAD.right
const plotH = VH - PAD.top - PAD.bottom

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
          lines: [
            `${dict.move.damage}: ${p.power}`,
            `${dict.move.energy}: ${p.energy}    DPE: ${dpe}`,
            ...buffLines(p, dict),
          ],
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
        lines: [
          `${dict.move.damage}: ${p.power}`,
          `${dict.move.energy}: ${p.energy}    DPE: ${dpe}`,
          `DPS: ${dps}`,
        ],
      }
    })
}

export default function MoveExplorer({ category, locale, dict, moves }: Props) {
  const [mode, setMode] = useState<MoveMode>('pvp')
  const [selected, setSelected] = useState<Set<PokemonType>>(new Set())
  const [hover, setHover] = useState<string | null>(null)

  const cfg = useMemo(() => getChartConfig(category, mode), [category, mode])

  const sx = (x: number) => PAD.left + ((x - cfg.xMin) / (cfg.xMax - cfg.xMin)) * plotW
  const sy = (y: number) => PAD.top + (1 - (y - cfg.yMin) / (cfg.yMax - cfg.yMin)) * plotH
  const pct = (v: number, total: number) => `${(v / total) * 100}%`

  const allPoints = useMemo(
    () => buildPoints(category, mode, moves, dict, locale),
    [category, mode, moves, dict, locale],
  )
  const points = useMemo(
    () => (selected.size === 0 ? allPoints : allPoints.filter((p) => selected.has(p.type))),
    [allPoints, selected],
  )

  const curvePaths = useMemo(
    () =>
      cfg.curves.map((c) => {
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
      }),
    [cfg],
  )

  const toggleType = (t: PokemonType) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(t) ? next.delete(t) : next.add(t)
      return next
    })

  return (
    <div class="explorer">
      <div class="filter-bar scroll-hidden">
        {category === 'charged' && (
          <button class="type-btn mode" onClick={() => setMode((m) => (m === 'pve' ? 'pvp' : 'pve'))}>
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
              style={{ background: TYPE_COLORS[t], opacity: active ? 1 : 0.3 }}
              onClick={() => toggleType(t)}
            >
              <img src={`${base}images/types/${t}.png`} width={20} height={20} alt={dict.type[t]} />
              <span class="static-text">{dict.type[t]}</span>
            </button>
          )
        })}
      </div>

      <div class="chart">
        <svg class="chart-svg" viewBox={`0 0 ${VW} ${VH}`} role="img" aria-label={`${cfg.xLabel} / ${cfg.yLabel}`}>
          {/* grid */}
          {cfg.xTicks.map((t) => (
            <g key={`x${t}`}>
              <line x1={sx(t)} y1={PAD.top} x2={sx(t)} y2={PAD.top + plotH} class="grid" />
              <text x={sx(t)} y={PAD.top + plotH + 28} class="tick" text-anchor="middle">
                {t}
              </text>
            </g>
          ))}
          {cfg.yTicks.map((t) => (
            <g key={`y${t}`}>
              <line x1={PAD.left} y1={sy(t)} x2={PAD.left + plotW} y2={sy(t)} class="grid" />
              <text x={PAD.left - 12} y={sy(t) + 6} class="tick" text-anchor="end">
                {t}
              </text>
            </g>
          ))}
          {/* curves */}
          {curvePaths.map((c) => (
            <path key={c.label} d={c.d} stroke={c.color} stroke-width={2} fill="none" />
          ))}
          {/* axis titles */}
          <text x={PAD.left + plotW / 2} y={VH - 8} class="axis-title" text-anchor="middle">
            {cfg.xLabel}
          </text>
          <text
            class="axis-title"
            text-anchor="middle"
            transform={`translate(18 ${PAD.top + plotH / 2}) rotate(-90)`}
          >
            {cfg.yLabel}
          </text>
        </svg>

        <div class="legend">
          {curvePaths.map((c) => (
            <div key={c.label} class="legend-row">
              <span class="legend-swatch" style={{ background: c.color }} />
              {c.label}
            </div>
          ))}
        </div>

        {points.map((p) => (
          <button
            key={p.id}
            class={`chip${hover === p.id ? ' active' : ''}`}
            style={{ left: pct(sx(p.x), VW), top: pct(sy(p.y), VH), background: TYPE_COLORS[p.type] }}
            onMouseEnter={() => setHover(p.id)}
            onMouseLeave={() => setHover((h) => (h === p.id ? null : h))}
            onFocus={() => setHover(p.id)}
            onBlur={() => setHover((h) => (h === p.id ? null : h))}
          >
            <span class="static-text">{p.label}</span>
            {hover === p.id && (
              <span class="tooltip">
                <strong>{p.label}</strong>
                {p.lines.map((line, i) => (
                  <span key={i}>{line}</span>
                ))}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
