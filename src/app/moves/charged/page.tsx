'use client'

import Button from '@components/Button'
import { Graph } from '@components/Graph'
import { MoveChip } from '@components/MoveChip'
import { ChargedMoveData, pokemonType } from '@constants'
import useGlobalLoadingPanel from '@hooks/useGlobalLoadingPanel'
import { POGO_MOVES_COLORS } from '@styles/colors'
import { PokemonType } from '@types'
import { FC, useEffect, useRef, useState } from 'react'

const maxDpe = 2.5
const minDpe = 0
const minEnergy = 30
const maxEnergy = 95
const energyInterval = 5
const labelHeightX = 48
const labelWidthY = 48

const ChargedMovesPage: FC = () => {
  const { setGlobalLoadingPanelVisible } = useGlobalLoadingPanel()
  const [selectedType, setSelectedType] = useState<{ [key in PokemonType]?: string }>({})
  const [chargedMoveList, setChargedMoveList] = useState(ChargedMoveData)
  const [isLoading, setIsLoading] = useState(true)
  const graphWrapperRef = useRef<HTMLDivElement>(null)
  const [graphSize, setGraphSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (Object.values(selectedType).length > 0)
      setChargedMoveList(ChargedMoveData.filter((value) => selectedType[value.type] !== undefined))
    else setChargedMoveList(ChargedMoveData)
  }, [selectedType])

  useEffect(() => {
    setGlobalLoadingPanelVisible(isLoading)
  }, [isLoading])

  const handleResize = () => {
    if (graphWrapperRef.current) {
      const { clientWidth, clientHeight } = graphWrapperRef.current
      const isVideoRatio = clientWidth > (clientHeight * 16) / 9
      if (isVideoRatio) {
        setGraphSize({
          width: clientWidth - labelWidthY,
          height: (clientWidth * 9) / 16 - labelHeightX,
        })
      } else {
        setGraphSize({
          width: (clientHeight * 16) / 9 - labelWidthY,
          height: clientHeight - labelHeightX,
        })
      }
    }
  }

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-center flex-wrap gap-2">
        <Button
          variant="contained"
          className="!py-[2px]"
          style={{ backgroundColor: POGO_MOVES_COLORS.white }}
          onClick={() => {
            setChargedMoveList(ChargedMoveData)
            setSelectedType({})
          }}
        >
          {'SHOW ALL'}
        </Button>
        {Object.values(pokemonType).map((type) => (
          <Button
            key={type}
            variant="contained"
            className="!py-[2px]"
            style={{ backgroundColor: POGO_MOVES_COLORS.type[type as PokemonType] }}
            onClick={() =>
              setSelectedType((prev) => {
                if (prev[type as PokemonType]) {
                  delete prev[type as PokemonType]
                  return { ...prev }
                } else {
                  return { ...prev, [type]: type }
                }
              })
            }
          >
            {type.toUpperCase()}
          </Button>
        ))}
      </div>
      <div ref={graphWrapperRef} className="relative w-full h-full">
        {!isLoading &&
          graphSize.width > 0 &&
          graphSize.height > 0 &&
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
                  left:
                    labelWidthY +
                    (graphSize.width * (energy - minEnergy)) / (maxEnergy - minEnergy),
                  top: graphSize.height * (1 - (dpe - minDpe) / (maxDpe - minDpe)) - labelHeightX,
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
    </div>
  )
}

export default ChargedMovesPage
