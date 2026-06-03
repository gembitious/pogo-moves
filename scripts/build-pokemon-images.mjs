// Copy + rename Pokémon sprites from a LOCAL PokeMiners pogo_assets clone into
// public/images/pokemon as {dex}.png / {dex}_{form}.png.
//
//   node scripts/build-pokemon-images.mjs <source-assets-dir> [dest-dir]
//
// <source-assets-dir> is the folder of pm####.icon.png sprites from a local clone
// of https://github.com/PokeMiners/pogo_assets. Prefer the network fetcher
// (scripts/fetch-pokemon-images.mjs) which needs no clone; this is the offline path.
import { readdirSync, copyFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { spriteDest } from './lib/pokeminers-sprites.mjs'

const [source, dest = 'public/images/pokemon'] = process.argv.slice(2)
if (!source) {
  console.error('usage: node scripts/build-pokemon-images.mjs <source-assets-dir> [dest-dir]')
  process.exit(1)
}
mkdirSync(dest, { recursive: true })

let copied = 0
for (const file of readdirSync(source)) {
  const name = spriteDest(file)
  if (!name) continue
  copyFileSync(resolve(source, file), resolve(dest, name))
  copied++
}
console.log(`copied ${copied} sprites -> ${dest}`)
