'use client'

import { globalLoadingPanelContext } from '@context/globalLoadingPanelContext'
import { FC, ReactNode, useState } from 'react'

const GlobalLoadingPanelProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [globalLoadingPanelVisible, setGlobalLoadingPanelVisible] = useState<boolean>(false)
  return (
    <globalLoadingPanelContext.Provider
      value={{ visible: globalLoadingPanelVisible, dispatch: setGlobalLoadingPanelVisible }}
    >
      {children}
    </globalLoadingPanelContext.Provider>
  )
}

export default GlobalLoadingPanelProvider
