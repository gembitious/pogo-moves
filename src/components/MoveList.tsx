/** @jsxImportSource preact */
import { useMemo, useState } from 'preact/hooks'
import type { Dictionary } from '@/lib/i18n'
import type { Point } from '@/lib/moveChart'

const base = import.meta.env.BASE_URL
type SortKey = 'name' | 'type' | 'power' | 'x' | 'y'

interface Props {
  points: Point[]
  highlight: Set<string> | null
  xLabel: string
  yLabel: string
  dict: Dictionary
  onPick: (id: string) => void
}

// Sortable table alternative to the scatter — read every move at a glance.
export function MoveList({ points, highlight, xLabel, yLabel, dict, onPick }: Props) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'power', dir: -1 })
  const [cmp, setCmp] = useState<string[]>([])
  const toggleCmp = (id: string) => setCmp((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id].slice(-2)))
  const sortBy = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === 'name' || key === 'type' ? 1 : -1 }))
  const ind = (k: SortKey) => (sort.key === k ? (sort.dir < 0 ? ' ▼' : ' ▲') : '')
  const sortTh = (key: SortKey, label: string, num = false) => (
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

  const cmpMoves = cmp.map((id) => points.find((p) => p.id === id)).filter((p): p is Point => Boolean(p))

  return (
    <div class="move-list scroll-hidden">
      <table>
        <thead>
          <tr>
            <th class="mv-cmp-th" aria-label={dict.common.compare} />
            {sortTh('name', dict.common.name)}
            {sortTh('type', dict.common.type)}
            {sortTh('power', dict.move.damage, true)}
            {sortTh('x', xLabel, true)}
            {sortTh('y', yLabel, true)}
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} class={highlight ? (highlight.has(p.id) ? 'hl' : 'dim') : ''} onClick={() => onPick(p.id)}>
              <td class="mv-cmp-td">
                <input
                  type="checkbox"
                  checked={cmp.includes(p.id)}
                  aria-label={dict.common.compare}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => toggleCmp(p.id)}
                />
              </td>
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
      {cmpMoves.length === 2 && (
        <table class="mv-compare">
          <thead>
            <tr>
              <th>{dict.common.compare}</th>
              <th>{cmpMoves[0].label}</th>
              <th>{cmpMoves[1].label}</th>
            </tr>
          </thead>
          <tbody>
            {(
              [
                [dict.move.damage, cmpMoves[0].power, cmpMoves[1].power],
                [xLabel, cmpMoves[0].x, cmpMoves[1].x],
                [yLabel, cmpMoves[0].y, cmpMoves[1].y],
              ] as [string, number, number][]
            ).map(([k, va, vb]) => (
              <tr key={k}>
                <th>{k}</th>
                <td class={`num${va >= vb ? ' win' : ''}`}>{va}</td>
                <td class={`num${vb >= va ? ' win' : ''}`}>{vb}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
