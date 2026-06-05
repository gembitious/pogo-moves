import ko from '@/data/i18n/ko.json'
import en from '@/data/i18n/en.json'

export const LOCALES = ['ko', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'ko'

const dictionaries = { ko, en }
export type Dictionary = typeof ko

export const isLocale = (v: string | undefined): v is Locale =>
  v !== undefined && (LOCALES as readonly string[]).includes(v)

export const getDictionary = (locale: string | undefined): Dictionary =>
  isLocale(locale) ? dictionaries[locale] : dictionaries[DEFAULT_LOCALE]

// Interpolate {key} placeholders in a dictionary string.
export const fmt = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))

// Localized display name for any {name, nameEn} record (moves, Pokémon). Single
// source of truth so the ko/en pick doesn't drift across components.
export const localName = (locale: Locale, m: { name: string; nameEn: string }) => (locale === 'ko' ? m.name : m.nameEn)

// Swap (or add) the locale segment of a path: ('/ko/fast', 'en') -> '/en/fast'.
export const localePath = (path: string, locale: Locale) => {
  const rest = path.replace(/^\/(ko|en)(?=\/|$)/, '')
  return `/${locale}${rest}`
}
