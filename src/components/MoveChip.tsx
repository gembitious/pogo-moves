import { POGO_MOVES_COLORS } from '@styles/colors'
import { ChargedMove, FastMove } from '@types'
import { FC, HTMLAttributes } from 'react'

interface MoveChipProps extends HTMLAttributes<HTMLDivElement> {
  data: FastMove | ChargedMove
}

export const MoveChip: FC<MoveChipProps> = ({ data, style, ...others }) => {
  return (
    <div
      className="h-6 px-2 flex items-center rounded relative"
      style={{ ...style, backgroundColor: POGO_MOVES_COLORS.type[data.type] }}
      {...others}
    >
      <div
        className="move-chip absolute -top-1 -left-1 w-2 h-2 border-solid border-[1px] rounded-full"
        style={{ backgroundColor: POGO_MOVES_COLORS.type[data.type] }}
      />
      <span className="text-sm">{data.name}</span>
    </div>
  )
}
