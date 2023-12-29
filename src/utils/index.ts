import { ReactNode } from 'react'
import { createPortal } from 'react-dom'

export const portalToBody = (dom: ReactNode) => {
  const isSSR = typeof window === 'undefined'
  if (isSSR) return dom
  return createPortal(dom, document.body)
}
