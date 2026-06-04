import type { APIRoute } from 'astro'

export const prerender = true

// All 2 locales × 4 pages (index = charged, fast, type, pokemon).
const PATHS = ['', '/fast', '/type', '/pokemon']

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://pogo-moves.vercel.app')
  const urls = ['ko', 'en'].flatMap((l) => PATHS.map((p) => new URL(`${l}${p}`, base).href))
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } })
}
