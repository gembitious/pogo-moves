'use client'

import {
  DialogContent,
  DialogTitle,
  Dialog as MUIDialog,
  DialogProps as MUIDialogProps,
} from '@mui/material'
import { FC, ReactNode, useState } from 'react'

export interface DialogProps extends Omit<MUIDialogProps, 'title' | 'open' | 'onClose'> {
  visible?: boolean
  title?: ReactNode
  width?: number | string
  height?: number | string
  onClose?: () => void
}

const Dialog: FC<DialogProps> = ({
  visible: visibleProps,
  title,
  width,
  height,
  onClose,
  children,
  ...others
}) => {
  const [visibleState, setVisibleState] = useState(false)
  const visible = visibleProps !== undefined ? visibleProps : visibleState

  const handleClose = () => {
    onClose?.()
  }

  return (
    <MUIDialog open={visible} onClose={handleClose} {...others}>
      {title && <DialogTitle>{title}</DialogTitle>}
      {children && <DialogContent style={{ width, height }}>{children}</DialogContent>}
    </MUIDialog>
  )
}

export default Dialog
