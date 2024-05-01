import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      const newUtilities = {
        '.horizontal-tb': {
          writingMode: 'horizontal-tb',
        },
        '.vertical-rl': {
          writingMode: 'vertical-rl',
          textOrientation: 'upright',
        },
        '.vertical-lr': {
          writingMode: 'vertical-lr',
          textOrientation: 'upright',
        },
        '.vertical-rl-reverse': {
          writingMode: 'vertical-rl',
          transform: 'rotate(-180deg)',
        },
        '.vertical-lr-reverse': {
          writingMode: 'vertical-lr',
          transform: 'rotate(-180deg)',
        },
      }
      addUtilities(newUtilities)
    }),
  ],
}
export default config
