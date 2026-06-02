// Copy + rename Pokémon sprites from the PokeMiners pogo_assets repo into
// public/images/pokemon as {dex}.png / {dex}_{form}.png.
//
//   node scripts/build-pokemon-images.mjs <source-assets-dir> [dest-dir]
//
// <source-assets-dir> is the "Addressable Assets" image folder of
// https://github.com/PokeMiners/pogo_assets (clone it locally — not bundled).
// Source filenames look like "pm0003.icon.png" (base) or "pm0003.fMEGA.icon.png"
// (form). This is a manual utility for the Pokémon sprite set kept for a future
// "moves ↔ Pokémon" feature; it is NOT part of the build or CI.
//
// Ported from the project's original Python tool (main.py + constants.py).
import { readdirSync, copyFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

// Dexes that have an alternate form whose sprite we also keep.
const HAS_ANOTHER_FORM = new Set([
  351, 386, 412, 413, 421, 479, 487, 492, 493, 554, 641, 642, 645, 646, 647, 648, 649, 678, 710,
  711, 718, 720, 741, 745, 746, 773, 774, 800, 849, 854, 855, 876, 877, 888, 889, 890, 892, 898,
  916,
])
// Form suffixes we skip (megas and yearly event costumes).
const EXCLUDED = ['2017', '2018', '2019', '2020', '2021', '2022', '2023', 'mega']

const [source, dest = 'public/images/pokemon'] = process.argv.slice(2)
if (!source) {
  console.error('usage: node scripts/build-pokemon-images.mjs <source-assets-dir> [dest-dir]')
  process.exit(1)
}
mkdirSync(dest, { recursive: true })

let copied = 0
const copy = (file, name) => {
  copyFileSync(resolve(source, file), resolve(dest, name))
  copied++
}

for (const file of readdirSync(source)) {
  const parts = file.split('.')
  const dex = parts[0].replace(/^pm/, '')
  if (parts.length === 3) {
    copy(file, `${dex}.png`) // base form, e.g. pm0001.icon.png -> 0001.png
  } else if (parts.length === 4) {
    const token = parts[1]
    if (token[0] === 'f') {
      const suffix = token.slice(1).toLowerCase()
      if (!EXCLUDED.some((ex) => suffix.includes(ex))) copy(file, `${dex}_${suffix}.png`)
    } else if (HAS_ANOTHER_FORM.has(Number(dex)) && token.length > 1) {
      copy(file, `${dex}_${token.slice(1).toLowerCase()}.png`)
    }
  }
}
console.log(`copied ${copied} sprites -> ${dest}`)
