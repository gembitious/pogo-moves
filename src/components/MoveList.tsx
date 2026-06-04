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

  return (
    <div class="move-list scroll-hidden">
      <table>
        <thead>
          <tr>
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
  )
}
