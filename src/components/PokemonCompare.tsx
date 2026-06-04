/** @jsxImportSource preact */
import { TYPE_COLORS, TYPE_TEXT } from '@/lib/types'
import type { Dictionary, Locale } from '@/lib/i18n'
import type { PokemonEntry } from '@/lib/pokemonIndex'
import type { League, Rankings } from '@/lib/rankings'
import type { ChargedMove, FastMove } from '@/lib/formulas'
import { PokeSprite } from './PokeSprite'

const base = import.meta.env.BASE_URL

interface Props {
  a: PokemonEntry
  b: PokemonEntry
  league: League
  ranks: Rankings | null
  fastById: Map<string, FastMove>
  chargedById: Map<string, ChargedMove>
  locale: Locale
  dict: Dictionary
  onClose: () => void
  onFocusMon: (m: PokemonEntry) => void
}

// Side-by-side comparison of two Pokémon: types, league score, stats (mirrored
// bars meeting at the centre label), and full movesets with the ★ recommended set.
export function PokemonCompare({ a, b, league, ranks, fastById, chargedById, locale, dict, onClose, onFocusMon }: Props) {
  // Scale the bars to the pair's own peak stat so the head-to-head fills the width
  // (the single-mon view uses the whole-roster max, which would shrink these).
  const pairMax = Math.max(a.atk, a.def, a.hp, b.atk, b.def, b.hp) || 1
  const name = (m: { name: string; nameEn: string }) => (locale === 'ko' ? m.name : m.nameEn)
  const moveHref = (id: string, kind: 'fast' | 'charged') => `${base}${locale}${kind === 'fast' ? '/fast' : ''}?m=${id}`
  const scoreOf = (m: PokemonEntry) => ranks?.[m.id]?.score ?? null
  const fastOf = (m: PokemonEntry) => m.fast.map((id) => fastById.get(id)).filter((x): x is FastMove => Boolean(x))
  const chargedOf = (m: PokemonEntry) => m.charged.map((id) => chargedById.get(id)).filter((x): x is ChargedMove => Boolean(x))

  const head = (m: PokemonEntry, other: PokemonEntry) => {
    const sc = scoreOf(m)
    const oc = scoreOf(other)
    return (
      <div class="cmp-head">
        <button class="cmp-focus" onClick={() => onFocusMon(m)} title={name(m)} aria-label={name(m)}>
          <PokeSprite mon={m} size={72} />
        </button>
        <div class="cmp-name static-text">
          {name(m)} <span class="dex-num">#{m.dex}</span>
        </div>
        <div class="cmp-types">
          {m.types.map((t) => (
            <span key={t} class="dex-type" style={{ background: TYPE_COLORS[t], color: TYPE_TEXT[t] }}>
              <img src={`${base}images/types/${t}.png`} width={15} height={15} alt={dict.type[t]} />
              {dict.type[t]}
            </span>
          ))}
        </div>
        {sc != null && (
          <span class={`dex-score${oc != null && sc > oc ? ' win' : ''}`} title={`pvpoke ${league.toUpperCase()}`}>
            {league.toUpperCase()} {sc}
          </span>
        )}
      </div>
    )
  }

  const stat = (k: 'atk' | 'def' | 'hp') => {
    const va = a[k]
    const vb = b[k]
    return (
      <div class="cmp-stat" key={k}>
        <span class={`cmp-v l${va > vb ? ' win' : ''}`}>{va}</span>
        <span class="cmp-bar l">
          <span class="cmp-fill" style={{ width: `${(va / pairMax) * 100}%` }} />
        </span>
        <span class="cmp-k">{dict.pokemon[k]}</span>
        <span class="cmp-bar r">
          <span class="cmp-fill" style={{ width: `${(vb / pairMax) * 100}%` }} />
        </span>
        <span class={`cmp-v r${vb > va ? ' win' : ''}`}>{vb}</span>
      </div>
    )
  }

  const movesCol = (m: PokemonEntry) => {
    const rec = new Set(ranks?.[m.id]?.moveset ?? [])
    const row = (mv: FastMove | ChargedMove, kind: 'fast' | 'charged') => (
      <a key={mv.id} class="mv-row" href={moveHref(mv.id, kind)} style={{ borderColor: TYPE_COLORS[mv.type] }}>
        <span class="mv-type" style={{ background: TYPE_COLORS[mv.type] }}>
          <img src={`${base}images/types/${mv.type}.png`} width={14} height={14} alt={dict.type[mv.type]} />
        </span>
        <span class="mv-name">{name(mv)}</span>
        {rec.has(mv.id) && (
          <span class="mv-rec" title={dict.pokemon.recommended}>
            ★
          </span>
        )}
      </a>
    )
    return (
      <div class="cmp-moves-col">
        <h4>{dict.nav.fast}</h4>
        {fastOf(m).map((mv) => row(mv, 'fast'))}
        <h4>{dict.nav.charged}</h4>
        {chargedOf(m).map((mv) => row(mv, 'charged'))}
      </div>
    )
  }

  return (
    <div class="dex-card cmp">
      <div class="cmp-topbar">
        <span class="cmp-tag">{dict.common.compare}</span>
        <button class="dex-clear" onClick={onClose} aria-label={dict.panel.close}>
          ×
        </button>
      </div>
      <div class="cmp-grid">
        {head(a, b)}
        {head(b, a)}
      </div>
      <div class="cmp-stats">{(['atk', 'def', 'hp'] as const).map((k) => stat(k))}</div>
      <div class="cmp-grid cmp-moves">
        {movesCol(a)}
        {movesCol(b)}
      </div>
    </div>
  )
}
