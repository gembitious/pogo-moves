/** @jsxImportSource preact */
import { useState } from 'preact/hooks'
import { TYPE_COLORS } from '@/lib/types'
import type { PokemonEntry } from '@/lib/pokemonIndex'

const base = import.meta.env.BASE_URL

// Pokémon sprite with a type-colored {dex} placeholder when the image is
// missing or fails to load. Shared by MoveExplorer and PokemonExplorer.
export function PokeSprite({ mon, size = 56 }: { mon: PokemonEntry; size?: number }) {
  const [err, setErr] = useState(false)
  if (!mon.sprite || err) {
    return (
      <span class="poke-ph" style={{ width: size, height: size, fontSize: Math.max(9, size * 0.22), background: TYPE_COLORS[mon.types[0]] }}>
        {mon.dex}
      </span>
    )
  }
  return (
    <img
      class="poke-img"
      style={{ width: size, height: size }}
      src={`${base}${mon.sprite}`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setErr(true)}
    />
  )
}
