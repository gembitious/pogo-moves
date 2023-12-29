'use client'

import Button from '@components/Button'
import { Graph } from '@components/Graph'
import { MoveChip } from '@components/MoveChip'
import { ChargedMoveData, pokemonTypeText } from '@constants'
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

  const spreadMove = (move: HTMLDivElement, index: number) => {
    const { top } = move.getBoundingClientRect()
    console.log(top + index * 32)
    move.style.top = `${top + index * 32}px`
  }

  const rollbackMove = (move: HTMLDivElement, index: number) => {
    const { top } = move.getBoundingClientRect()
    move.style.top = `${top - index * 32}px`
  }

  const handleMouse = (e: MouseEvent) => {
    var x = e.clientX
    var y = e.clientY
    let elementUnderMouse = document.elementsFromPoint(x, y)
    const ee = elementUnderMouse.filter((e) => e.className.includes('move-chip'))
    if (ee.length > 1) {
      ee.map((move, index) => {
        const moveElement = move.parentElement
        if (moveElement instanceof HTMLDivElement) {
          moveElement.addEventListener('mouseout', () => rollbackMove(moveElement, index))
          spreadMove(moveElement, index)
          return () => move.removeEventListener('mouseout', () => rollbackMove(moveElement, index))
        }
      })
    }
  }

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    // document.addEventListener('mousemove', handleMouse)
    return () => {
      window.removeEventListener('resize', handleResize)
      // document.removeEventListener('mousemove', handleMouse)
    }
  }, [])

  return (
    <div className="w-full h-full flex flex-col gap-8">
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
          {'타입 전체'}
        </Button>
        {Object.entries(pokemonTypeText).map(([key, text]) => {
          const type = key as PokemonType
          const isSelected = Object.values(selectedType).length === 0 || selectedType[type]
          return (
            <Button
              key={type}
              variant="contained"
              className="!py-[2px]"
              style={{
                opacity: isSelected ? '' : ' 30%',
                backgroundColor: POGO_MOVES_COLORS.type[type],
              }}
              onClick={() =>
                setSelectedType((prev) => {
                  if (prev[type]) {
                    delete prev[type]
                    return { ...prev }
                  } else {
                    return { ...prev, [type]: type }
                  }
                })
              }
            >
              {text}
            </Button>
          )
        })}
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
                data={move}
                style={{
                  position: 'absolute',
                  left:
                    labelWidthY +
                    (graphSize.width * (energy - minEnergy)) / (maxEnergy - minEnergy),
                  top: graphSize.height * (1 - (dpe - minDpe) / (maxDpe - minDpe)),
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
