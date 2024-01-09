'use client'

import { ChargedMove, FastMove } from '@types'
import { FC } from 'react'
import Dialog, { DialogProps } from './Dialog'

export interface MoveDialogProps extends DialogProps {
  data: FastMove | ChargedMove
}

const MoveDialog: FC<MoveDialogProps> = ({ data, ...others }) => {
  return <Dialog {...others} />
}

export default MoveDialog
