import { ChargedMove, FastMove, MoveMode } from '@core/types'
import { isChargedMove, isFastMove } from '@core/utils'
import { Tooltip } from '@mui/material'
import { POKEMON_TYPE_COLORS } from '@styles/colors'
import { FC, HTMLAttributes, ReactNode, useState } from 'react'
import Button from './Button'

interface MoveChipProps extends HTMLAttributes<HTMLDivElement> {
  data: FastMove | ChargedMove
  mode?: MoveMode
}

export const MoveChip: FC<MoveChipProps> = ({ data, mode = 'pvp', style, ...others }) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const [isDetailDialogVisible, setIsDetailDialogVisible] = useState(false)

  const onClickDetailButton = () => {
    setIsDetailDialogVisible(true)
  }

  const handleDetailDialogClose = () => {
    setIsDetailDialogVisible(false)
  }

  return (
    <>
      {/* <MoveDialog data={data} visible={isDetailDialogVisible} onClose={handleDetailDialogClose}>
        {data.name}
      </MoveDialog> */}
      <MoveChipPoint data={data} style={style} />
      <Tooltip
        open={isTooltipVisible}
        title={<MoveTooltip data={data} mode={mode} onClickDetailButton={onClickDetailButton} />}
        onClick={() => {
          if (isTooltipVisible) {
            setIsTooltipVisible(false)
          } else {
            setIsTooltipVisible(true)
            setTimeout(() => setIsTooltipVisible(false), 2000)
          }
        }}
        PopperProps={{ className: 'move-chip-tooltip' }}
      >
        <div
          className="move-chip h-6 px-2 flex items-center rounded relative"
          style={{ ...style, backgroundColor: POKEMON_TYPE_COLORS[data.type] }}
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
          backgroundColor: POKEMON_TYPE_COLORS[data.type],
        }}
      />
    </div>
  )
}

const buffTargetText = {
  self: '자신',
  opponent: '상대',
}

export const MoveTooltipText: FC<{ data: FastMove | ChargedMove }> = ({ data }) => {
  let result: ReactNode[] = []
  if (isFastMove(data)) {
    const { turn, power, dpt, energyGain, ept } = data
    result.push(<div>{`Turn: ${turn}`}</div>)
    result.push(
      <div className="flex gap-1">
        <div className="text-[#fbb800]">Damage: {power}</div>
        <div className="text-[#fbb800]">DPT: {dpt}</div>
      </div>,
    )
    result.push(
      <div className="flex gap-1">
        <div className="text-[#fbb800]">Energy: {energyGain}</div>
        <div className="text-[#fbb800]">EPT: {ept}</div>
      </div>,
    )
  } else if (isChargedMove(data)) {
    const { power, energy, dpe, buffs, buffTarget, buffApplyChance } = data
    result.push(<div className="text-[#fbb800]">Damage: {data.power}</div>)
    result.push(<div className="text-[#fbb800]">Energy: {data.energy}</div>)
    result.push(<div className="text-[#fbb800]">DPE: {data.dpe}</div>)
    if (buffs && buffTarget && buffApplyChance) {
      const buffChanceText = `${buffApplyChance * 100}% 확률로`
      const attackBuffText =
        buffs[0] !== 0
          ? `공격 ${buffs[0] > 0 ? `${buffs[0]}랭크 상승` : `${Math.abs(buffs[0])}랭크 하락`}`
          : ''
      const defenseBuffText =
        buffs[1] !== 0
          ? `방어 ${buffs[1] > 0 ? `${buffs[1]}랭크 상승` : `${Math.abs(buffs[1])}랭크 하락`}`
          : ''
      result.push(<div className="text-[#fbb800]">{buffChanceText}</div>)
      if (attackBuffText) {
        result.push(
          <div className="text-[#fbb800]">
            {buffTargetText[buffTarget]} {attackBuffText}
          </div>,
        )
      }
      if (defenseBuffText) {
        result.push(
          <div className="text-[#fbb800]">
            {buffTargetText[buffTarget]} {defenseBuffText}
          </div>,
        )
      }
    }
  }
  return <>{result}</>
}

const MoveTooltip: FC<MoveChipProps & { onClickDetailButton: () => void }> = ({
  data,
  onClickDetailButton,
}) => {
  let tooltipText = ''
  if (isFastMove(data)) {
    tooltipText = `Turn: ${data.turn}\nDamage: ${data.power} DPT: ${data.dpt}\nEnergy: ${data.energyGain} EPT: ${data.ept}`
  } else if (isChargedMove(data)) {
    tooltipText = `Damage: ${data.power}\nEnergy: ${data.energy}\nDPE: ${data.dpe}`
  }

  return (
    <div className="flex flex-col gap-0.5">
      <MoveTooltipText data={data} />
      <Button color="info" variant="contained" onClick={onClickDetailButton}>
        상세 보기
      </Button>
    </div>
  )
}
