// Generate the app's brand assets from one SVG mark, using sharp (Astro's image
// library). Run once and commit the output — not part of the build/CI:
//   node scripts/build-icons.mjs
//
// Produces: PWA icons (192/512/maskable), apple-touch-icon, favicon.svg/.ico-ish
// png, and the Open Graph share image (public/og.png).
import sharp from 'sharp'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const pub = resolve(dirname(fileURLToPath(import.meta.url)), '../public')
const BG = '#011a25'

// Brand mark in a 512 box: a rising scatter/trend (the move chart) in the palette.
const MARK = `
  <path d="M120 392 H400 M120 392 V120" stroke="#8ecae6" stroke-width="16" stroke-linecap="round" fill="none" opacity="0.55"/>
  <circle cx="186" cy="324" r="30" fill="#219ebc"/>
  <circle cx="270" cy="244" r="40" fill="#8ecae6"/>
  <circle cx="360" cy="156" r="54" fill="#fb8500"/>`

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="${BG}"/>${MARK}</svg>`
// maskable: full-bleed background + mark scaled into the safe zone
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="${BG}"/><g transform="translate(77 77) scale(0.7)">${MARK}</g></svg>`

const png = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).png()

mkdirSync(resolve(pub, 'icons'), { recursive: true })
await png(iconSvg, 192).toFile(resolve(pub, 'icons/pwa-192.png'))
await png(iconSvg, 512).toFile(resolve(pub, 'icons/pwa-512.png'))
await png(maskableSvg, 512).toFile(resolve(pub, 'icons/pwa-maskable-512.png'))
await png(iconSvg, 180).toFile(resolve(pub, 'apple-touch-icon.png'))
await png(iconSvg, 32).toFile(resolve(pub, 'favicon-32.png'))
writeFileSync(resolve(pub, 'favicon.svg'), iconSvg + '\n')

// Open Graph share image: logo banner centered on the brand background.
const ogBg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="${BG}"/></svg>`
const banner = await sharp(resolve(pub, 'images/title_banner.png')).resize({ width: 720 }).toBuffer()
const markImg = await png(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">${MARK}</svg>`, 220).toBuffer()
await sharp(Buffer.from(ogBg))
  .composite([
    { input: markImg, top: 70, left: 490 },
    { input: banner, top: 360, left: 240 },
  ])
  .png()
  .toFile(resolve(pub, 'og.png'))

console.log('wrote public/icons/*, apple-touch-icon.png, favicon.svg, favicon-32.png, og.png')
