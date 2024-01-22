import { unreleasedMove } from '@core/constants'
import { ChargedMove, ChargedMovePvE, FastMove, FastMovePvE } from '@core/types'
import { Locale, i18n } from '@core/types/i18n-config'
import { ReactNode } from 'react'
import { createPortal } from 'react-dom'

export const portalToBody = (dom: ReactNode) => {
  const isSSR = typeof window === 'undefined'
  if (isSSR) return dom
  return createPortal(dom, document.body)
}

export const isFastMove = (target: any): target is FastMove =>
  typeof target == 'object' &&
  target.turn !== undefined &&
  target.energyGain !== undefined &&
  (target.power > 0 || target.energyGain > 0)

export const isChargedMove = (target: any): target is ChargedMove =>
  typeof target == 'object' && target.energy !== undefined

export const isFastMovePvE = (target: any): target is FastMovePvE =>
  typeof target == 'object' &&
  target.duration !== undefined &&
  target.energyGain !== undefined &&
  (target.power > 0 || target.energyGain > 0)

export const isChargedMovePvE = (target: any): target is ChargedMovePvE =>
  typeof target == 'object' && target.energy !== undefined && target.duration !== undefined

// pathname에 현재 locale 적용하는 함수
export const redirectedPathname = (pathname: string, locale: Locale) => {
  if (!pathname) return '/'
  const segments = pathname.split('/')
  if (i18n.locales.includes(segments[1] as Locale)) segments[1] = locale
  else segments.splice(1, 0, locale)
  return segments.join('/')
}

export const getFastMoveData = (moves: object[]) => {
  const result: FastMove[] = []
  moves.map((move) => {
    if (isFastMove(move)) result.push(move)
  })
  return result
}

export const getChargedMoveData = (moves: object[]) => {
  const result: ChargedMove[] = []
  moves.map((move) => {
    if (isChargedMove(move) && !unreleasedMove.includes(move.id)) result.push(move)
  })
  return result
}
export const getFastMovePvEData = (moves: object[]) => {
  const result: FastMovePvE[] = []
  moves.map((move) => {
    if (isFastMovePvE(move)) result.push(move)
  })
  return result
}

export const getChargedMovePvEData = (moves: object[]) => {
  const result: ChargedMovePvE[] = []
  moves.map((move) => {
    if (isChargedMovePvE(move) && !unreleasedMove.includes(move.id)) result.push(move)
  })
  return result
}
