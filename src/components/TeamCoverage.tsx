/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from 'preact/hooks'
import { POKEMON_TYPES, TYPE_COLORS, TYPE_TEXT, type PokemonType } from '@/lib/types'
import { fmt, localName, type Dictionary, type Locale } from '@/lib/i18n'
import { loadPokemonIndex, type PokemonEntry, type PokemonIndex } from '@/lib/pokemonIndex'
import { teamDefense, teamOffense } from '@/lib/teamCoverage'
import { readTeamIds, writeTeamIds } from '@/lib/urlState'
import { PokeSprite } from './PokeSprite'
import { PokemonSearch } from './PokemonSearch'

const base = import.meta.env.BASE_URL
const MAX_TEAM = 6

interface Props {
  locale: Locale
  dict: Dictionary
}

// Effectiveness → cell class (deep weak / weak / neutral / resist / deep resist).
const effClass = (m: number) => (m >= 2.5 ? 'ec-2w' : m > 1.01 ? 'ec-w' : m < 0.4 ? 'ec-2r' : m < 0.99 ? 'ec-r' : 'ec-n')
const fmtMult = (m: number) => (Math.abs(m - 1) < 0.01 ? '' : m.toFixed(2).replace(/\.?0+$/, ''))

export default function TeamCoverage({ locale, dict }: Props) {
  const [pdata, setPdata] = useState<PokemonIndex | null>(null)
  const [err, setErr] = useState(false)
  const [ids, setIds] = useState<string[]>([])

  const name = (m: PokemonEntry) => localName(locale, m)

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
    load()
      .then((d) => {
        const restored = readTeamIds().filter((id) => d.byId.has(id))
        if (restored.length) setIds(restored.slice(0, MAX_TEAM))
      })
      .catch(() => {})
  }, [])

  const team = useMemo(
    () => (pdata ? ids.map((id) => pdata.byId.get(id)).filter((m): m is PokemonEntry => Boolean(m)) : []),
    [ids, pdata],
  )

  const add = (m: PokemonEntry) => {
    setIds((prev) => {
      if (prev.includes(m.id) || prev.length >= MAX_TEAM) return prev
      const next = [...prev, m.id]
      writeTeamIds(next)
      return next
    })
  }
  const remove = (id: string) => {
    setIds((prev) => {
      const next = prev.filter((x) => x !== id)
      writeTeamIds(next)
      return next
    })
  }

  const typesList = useMemo(() => team.map((m) => m.types), [team])
  const defense = useMemo(() => teamDefense(typesList), [typesList])
  const offense = useMemo(() => teamOffense(typesList), [typesList])
  const covered = POKEMON_TYPES.filter((t) => offense[t])
  const shared = defense.filter((r) => r.weak >= 2)

  const typeIcon = (t: PokemonType, size = 18) => (
    <img src={`${base}images/types/${t}.png`} width={size} height={size} alt={dict.type[t]} title={dict.type[t]} />
  )

  return (
    <div class="team">
      {team.length < MAX_TEAM && (
        <PokemonSearch list={pdata?.list} locale={locale} dict={dict} onSelect={add} onActivate={load} className="dex-search" />
      )}

      {team.length > 0 && (
        <div class="team-chips">
          {team.map((m) => (
            <div key={m.id} class="team-chip">
              <PokeSprite mon={m} size={28} />
              <span class="static-text">{name(m)}</span>
              <button class="team-chip-x" onClick={() => remove(m.id)} aria-label={dict.search.clear}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {team.length === 0 ? (
        err ? (
          <div class="dex-empty">
            {dict.common.error}{' '}
            <button class="retry-btn" onClick={() => load().catch(() => {})}>
              {dict.common.retry}
            </button>
          </div>
        ) : (
          <div class="dex-empty">{dict.team.empty}</div>
        )
      ) : (
        <>
          {shared.length > 0 && (
            <div class="team-shared">
              <span class="team-shared-label">{dict.team.shared}</span>
              {shared.map((r) => (
                <span key={r.type} class="team-shared-chip" style={{ background: TYPE_COLORS[r.type], color: TYPE_TEXT[r.type] }}>
                  {typeIcon(r.type, 15)}
                  {dict.type[r.type]} <strong>{r.weak}</strong>
                </span>
              ))}
            </div>
          )}

          <section class="team-sec">
            <h3>{dict.team.defense}</h3>
            <div class="team-grid-wrap scroll-hidden">
              <table class="cov">
                <thead>
                  <tr>
                    <th class="cov-type" />
                    {team.map((m) => (
                      <th key={m.id} class="cov-mon" title={name(m)}>
                        <PokeSprite mon={m} size={26} />
                      </th>
                    ))}
                    <th class="cov-sum">{dict.team.weak}</th>
                  </tr>
                </thead>
                <tbody>
                  {defense.map((r) => (
                    <tr key={r.type} class={r.weak >= 2 ? 'shared' : ''}>
                      <th class="cov-type" style={{ background: TYPE_COLORS[r.type] }}>
                        {typeIcon(r.type, 18)}
                      </th>
                      {r.mults.map((m, i) => (
                        <td key={i} class={`cov-cell ${effClass(m)}`} title={`${name(team[i])} · ${dict.type[r.type]} ×${+m.toFixed(2)}`}>
                          {fmtMult(m)}
                        </td>
                      ))}
                      <td class={`cov-sum${r.weak >= 2 ? ' hot' : ''}`}>{r.weak || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section class="team-sec">
            <h3>
              {dict.team.offense} <span class="team-stab">{dict.team.stab}</span>
              <span class="team-cov-count">{fmt(dict.team.covered, { n: covered.length })}</span>
            </h3>
            <div class="team-offense">
              {POKEMON_TYPES.map((t) => (
                <span
                  key={t}
                  class={`team-off-chip${offense[t] ? ' on' : ''}`}
                  style={offense[t] ? { background: TYPE_COLORS[t], color: TYPE_TEXT[t] } : undefined}
                  title={`${dict.type[t]}${offense[t] ? ' ✓' : ''}`}
                >
                  {typeIcon(t, 16)}
                </span>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
