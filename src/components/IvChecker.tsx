/** @jsxImportSource preact */
import { useMemo, useState } from 'preact/hooks'
import type { Dictionary } from '@/lib/i18n'
import type { League } from '@/lib/rankings'
import { cmpVs, findSpread, rankSpreads, searchString, type IvSpread } from '@/lib/ivRank'

interface Props {
  base: { atk: number; def: number; hp: number }
  league: League
  dict: Dictionary
}

const clampIv = (v: string) => Math.max(0, Math.min(15, Math.floor(Number(v) || 0)))
const SEARCH_TOPS = [1, 3, 5]

// Self-computed PvP IV ranker (no sim, no external data): rank-1 / top spreads,
// your-IV rank + CMP, and an in-game search string. Recomputes per league.
export function IvChecker({ base, league, dict }: Props) {
  const [iv, setIv] = useState({ a: 15, d: 15, s: 15 })
  const [searchTop, setSearchTop] = useState(1)
  const [copied, setCopied] = useState(false)

  const spreads = useMemo(() => rankSpreads(base.atk, base.def, base.hp, league), [base, league])
  const top = spreads.slice(0, 10)
  const yours = findSpread(spreads, iv.a, iv.d, iv.s)
  const inTop = !!yours && yours.rank <= 10
  const cmp = yours ? cmpVs(yours, spreads[0]) : null
  const ss = useMemo(
    () => searchString(base.atk, base.def, base.hp, spreads.slice(0, searchTop), league),
    [base, league, spreads, searchTop],
  )
  const copy = () => {
    if (!navigator.clipboard) return
    navigator.clipboard.writeText(ss).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }, () => {})
  }

  const row = (s: IvSpread, me: boolean) => (
    <tr key={`${s.ivA}-${s.ivD}-${s.ivS}`} class={me ? 'me' : ''}>
      <td class="num">{s.rank}</td>
      <td class="num">{s.ivA}</td>
      <td class="num">{s.ivD}</td>
      <td class="num">{s.ivS}</td>
      <td class="num">{s.level}</td>
      <td class="num">{s.cp}</td>
      <td class="num">{s.percent.toFixed(2)}</td>
    </tr>
  )

  const ivField = (key: 'a' | 'd' | 's', label: string) => (
    <label class="iv-field">
      <span>{label}</span>
      <input
        type="number"
        min={0}
        max={15}
        value={iv[key]}
        onInput={(e) => setIv((p) => ({ ...p, [key]: clampIv((e.target as HTMLInputElement).value) }))}
      />
    </label>
  )

  return (
    <div class="iv">
      <div class="iv-input">
        <span class="iv-input-label">{dict.iv.yourIv}</span>
        {ivField('a', dict.iv.a)}
        {ivField('d', dict.iv.d)}
        {ivField('s', dict.iv.s)}
        {yours && (
          <span class="iv-yours">
            <strong>#{yours.rank}</strong> · {yours.percent.toFixed(2)}% · L{yours.level} · CP {yours.cp}
            {cmp && <span class={`iv-cmp ${cmp}`}>{dict.iv[cmp === 'win' ? 'cmpWin' : cmp === 'tie' ? 'cmpTie' : 'cmpLose']}</span>}
          </span>
        )}
      </div>

      <table class="iv-table">
        <thead>
          <tr>
            <th class="num">{dict.iv.rank}</th>
            <th class="num">{dict.iv.a}</th>
            <th class="num">{dict.iv.d}</th>
            <th class="num">{dict.iv.s}</th>
            <th class="num">{dict.iv.lv}</th>
            <th class="num">{dict.iv.cp}</th>
            <th class="num">{dict.iv.pct}</th>
          </tr>
        </thead>
        <tbody>
          {top.map((s) => row(s, !!yours && s.rank === yours.rank))}
          {yours && !inTop && (
            <>
              <tr class="iv-gap">
                <td colSpan={7}>⋯</td>
              </tr>
              {row(yours, true)}
            </>
          )}
        </tbody>
      </table>

      <div class="iv-search">
        <div class="iv-search-head">
          <span class="iv-search-label">{dict.iv.search}</span>
          <span class="iv-search-tops">
            {SEARCH_TOPS.map((n) => (
              <button key={n} class={`iv-top-btn${searchTop === n ? ' on' : ''}`} aria-pressed={searchTop === n} onClick={() => setSearchTop(n)}>
                {dict.iv.top} {n}
              </button>
            ))}
          </span>
          <button class="iv-copy" onClick={copy}>
            {copied ? dict.iv.copied : dict.iv.copy}
          </button>
        </div>
        <code class="iv-search-str scroll-hidden">{ss}</code>
        <span class="iv-search-hint">{dict.iv.searchHint}</span>
      </div>
    </div>
  )
}
