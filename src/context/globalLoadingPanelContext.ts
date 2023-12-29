'use client'

import { createContext, Dispatch, SetStateAction } from 'react'

export interface globalLoadingPanelContext {
  visible: boolean
  dispatch: Dispatch<SetStateAction<boolean>> | ((data: boolean) => void)
}

const defaultValue: globalLoadingPanelContext = {
  visible: false,
  dispatch: () => {},
}

export const globalLoadingPanelContext = createContext<globalLoadingPanelContext>(defaultValue)
