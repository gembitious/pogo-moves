import data from '@/data/moves.json'
import type { ChargedMove, FastMove } from './formulas'

const dataset = data as unknown as { fast: FastMove[]; charged: ChargedMove[] }

// `unreleased` moves (roar_of_time, spacial_rend) were hidden from the legacy
// charts; keep that behavior.
export const fastMoves: FastMove[] = dataset.fast.filter((m) => !m.unreleased)
export const chargedMoves: ChargedMove[] = dataset.charged.filter((m) => !m.unreleased)
