'use client'

import { Dialog as MUIDialog } from '@mui/material'
import { FC, useState } from 'react'

export interface DialogProps {
  visible?: boolean
}

const Dialog: FC<DialogProps> = ({ visible: visibleProps }) => {
  const [visibleState, setVisibleState] = useState(false)
  const visible = visibleProps !== undefined ? visibleProps : visibleState
  return <MUIDialog open={visible} />
}
