import type { Locale } from '@core/types/i18n-config'
import en from '@data/dictionaries/en.json'
import ko from '@data/dictionaries/ko.json'

export type TDictionary = typeof ko

const dictionaries: { [key in Locale]: typeof ko } = {
  ko,
  en,
}

export const getDictionary = (locale: Locale) => dictionaries[locale] ?? dictionaries.ko
