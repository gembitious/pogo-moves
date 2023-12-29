'use client'

import { Graph } from '@components/Graph'
import { MoveChip } from '@components/MoveChip'
import { ChargedMoveData } from '@constants'
import useGlobalLoadingPanel from '@hooks/useGlobalLoadingPanel'
import { POGO_MOVES_COLORS } from '@styles/colors'
import { FC, useEffect, useState } from 'react'

const maxDpe = 2.5
const minDpe = 0
const minEnergy = 30
const maxEnergy = 95
const energyInterval = 5
const labelHeightX = 48
const labelWidthY = 48

const ChargedMovesPage: FC = () => {
  const { setGlobalLoadingPanelVisible } = useGlobalLoadingPanel()
  const [chargedMoveList, setChargedMoveList] = useState(ChargedMoveData)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setGlobalLoadingPanelVisible(isLoading)
  }, [isLoading])

  return (
    <div className="relative w-full h-full">
      {!isLoading &&
        chargedMoveList.map((move) => {
          const { id, type, power, energy } = move
          const dpe = power / energy
          return (
            <MoveChip
              key={id}
              variant="filled"
              size="small"
              data={move}
              style={{
                position: 'absolute',
                backgroundColor: POGO_MOVES_COLORS.type[type],
                left: labelWidthY + (1800 * (energy - minEnergy)) / (maxEnergy - minEnergy),
                bottom: labelHeightX + (800 * (dpe - minDpe)) / (maxDpe - minDpe),
              }}
            />
          )
        })}
      <Graph
        setIsLoading={setIsLoading}
        xAxisProps={{
          labelName: 'Energy',
          labelHeight: labelHeightX,
          initialValue: minEnergy,
          divisionCount: 13,
          interval: energyInterval,
          subInterval: 5,
        }}
        yAxisProps={{
          labelName: 'DPE (Damage Per Energy)',
          labelWidth: 48,
          divisionCount: 5,
          interval: 0.5,
        }}
      />
    </div>
  )
}

export default ChargedMovesPage
