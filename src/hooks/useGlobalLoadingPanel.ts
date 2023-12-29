'use client'

import { globalLoadingPanelContext } from '@context/globalLoadingPanelContext'
import { useContext } from 'react'

const useGlobalLoadingPanel = () => {
  const { visible, dispatch } = useContext(globalLoadingPanelContext)
  return {
    globalLoadingPanelVisible: visible,
    setGlobalLoadingPanelVisible: dispatch,
  }
}

export default useGlobalLoadingPanel
