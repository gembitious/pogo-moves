// Map a PokeMiners pogo_assets sprite filename to our destination name, shared by
// the offline copy tool (build-pokemon-images.mjs) and the network fetcher
// (fetch-pokemon-images.mjs).
//
// Source names: "pm0006.icon.png" (base) | "pm0006.fMEGA.icon.png" (form).
// Dest names:   "{dex}.png" | "{dex}_{form}.png" with UNPADDED dex so they match
// what build-pokemon-index.mjs looks up (String(dex), `${dex}_${form}`).

// Dexes whose alternate form sprite we also keep (non-`f` form tokens).
export const HAS_ANOTHER_FORM = new Set([
  351, 386, 412, 413, 421, 479, 487, 492, 493, 554, 641, 642, 645, 646, 647, 648, 649, 678, 710,
  711, 718, 720, 741, 745, 746, 773, 774, 800, 849, 854, 855, 876, 877, 888, 889, 890, 892, 898,
  916,
])
// Form suffixes to skip: megas and yearly event costumes.
export const EXCLUDED = [
  '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026', 'mega',
]

// Returns the dest filename ("6.png" / "100_hisuian.png") or null to skip.
export function spriteDest(file) {
  if (!/^pm\d+\..+\.png$/i.test(file)) return null
  const parts = file.split('.')
  const dex = Number(parts[0].replace(/^pm/i, ''))
  if (!dex) return null
  if (parts.length === 3) return `${dex}.png` // base, e.g. pm0001.icon.png -> 1.png
  if (parts.length === 4) {
    const token = parts[1]
    if (token[0] === 'f' || token[0] === 'F') {
      const suffix = token.slice(1).toLowerCase()
      if (EXCLUDED.some((ex) => suffix.includes(ex))) return null
      return `${dex}_${suffix}.png`
    }
    if (HAS_ANOTHER_FORM.has(dex) && token.length > 1) return `${dex}_${token.slice(1).toLowerCase()}.png`
  }
  return null
}
