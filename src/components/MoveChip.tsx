import { Tooltip } from '@mui/material'
import { POGO_MOVES_COLORS } from '@styles/colors'
import { ChargedMove, FastMove } from '@types'
import { isChargedMove, isFastMove } from '@utils'
import { FC, HTMLAttributes, useState } from 'react'
import Button from './Button'

interface MoveChipProps extends HTMLAttributes<HTMLDivElement> {
  data: FastMove | ChargedMove
}

export const MoveChip: FC<MoveChipProps> = ({ data, style, ...others }) => {
  const [open, setOpen] = useState(false)
  let tooltipText = ''
  if (isFastMove(data)) {
    tooltipText = `DPT: ${data.dpt} EPT: ${data.ept}`
  } else if (isChargedMove(data)) {
    tooltipText = `Energy: ${data.energy} Damage: ${data.power}`
  }
  return (
    <>
      <MoveChipPoint data={data} style={style} />
      <Tooltip
        open={open}
        title={
          <div className="flex flex-col gap-1">
            {tooltipText}
            <Button color="info" variant="contained">
              상세 보기
            </Button>
          </div>
        }
        onClick={() => {
          if (open) {
            setOpen(false)
          } else {
            setOpen(true)
            setTimeout(() => setOpen(false), 2000)
          }
        }}
        PopperProps={{ className: 'move-chip-tooltip' }}
      >
        <div
          className="move-chip h-6 px-2 flex items-center rounded relative"
          style={{ ...style, backgroundColor: POGO_MOVES_COLORS.type[data.type] }}
          {...others}
        >
          <span className="text-xs font-medium overflow-hidden text-ellipsis whitespace-nowrap">
            {data.name}
          </span>
        </div>
      </Tooltip>
    </>
  )
}

export const MoveChipPoint: FC<MoveChipProps> = ({ data, style }) => {
  return (
    <div
      className="move-chip-point absolute z-[10] -top-1 -left-1 w-4 h-4"
      style={{
        left: Number(style?.left ?? 0) - 8,
        top: Number(style?.top ?? 0) - 8,
      }}
    >
      <div
        className="w-2 h-2 m-1 border-solid border-[1px] rounded-full"
        style={{
          backgroundColor: POGO_MOVES_COLORS.type[data.type],
        }}
      />
    </div>
  )
}
