import { defineConfig } from 'astro/config'
import preact from '@astrojs/preact'

// Locale routing is handled explicitly via the [lang] segment + getStaticPaths
// (see src/pages/[lang]/), so Astro's built-in i18n routing is left off.
// https://astro.build/config
export default defineConfig({
  site: 'https://pogo-moves.vercel.app',
  integrations: [preact()],
})
