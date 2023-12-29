import { Chip, ChipProps } from '@mui/material'
import { ChargedMove, FastMove } from '@types'
import { FC } from 'react'

interface MoveChipProps extends ChipProps {
  data: FastMove | ChargedMove
}

export const MoveChip: FC<MoveChipProps> = ({ data, ...others }) => {
  return <Chip label={data.nameEn} {...others} />
}
