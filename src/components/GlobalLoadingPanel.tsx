'use client'

import { Backdrop, CircularProgress } from '@mui/material'
import { FC } from 'react'

const GlobalLoadingPanel: FC<{ visible: boolean }> = ({ visible }) => {
  return (
    <Backdrop className="z-[99999]" open={visible}>
      <CircularProgress color="primary" />
    </Backdrop>
  )
}

export default GlobalLoadingPanel
