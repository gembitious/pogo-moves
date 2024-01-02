import { ChargedMove, FastMove } from '@types'
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
