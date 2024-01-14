'use client'

import { Locale } from '@core/types/i18n-config'
import { useParams } from 'next/navigation'

const useLocale = () => useParams<{ lang: Locale }>()

export default useLocale
