'use client'

import Button from '@components/Button'
import { Chart, ChartComponentProps } from '@components/Chart'
import { MoveChip } from '@components/MoveChip'
import { ChargedMoveData, pokemonTypeText } from '@constants'
import useGlobalLoadingPanel from '@hooks/useGlobalLoadingPanel'
import { POGO_MOVES_COLORS } from '@styles/colors'
import { PokemonType } from '@types'
import Image from 'next/image'
import { FC, useEffect, useRef, useState } from 'react'

const maxDpe = 2.5
const minDpe = 0
const minEnergy = 30
const maxEnergy = 95
const energyInterval = 5
const damageInterval = 0.5
const labelHeightX = 48
const labelWidthY = 48

const graphProps: ChartComponentProps['graphProps'] = [
  {
    label: 'DPE/Energy = 1/35',
    yOfX: (x) => x / 35,
    lineWidth: 1,
    strokeStyle: POGO_MOVES_COLORS.secondary,
  },
]

const ChargedMovesPage: FC = () => {
  const { setGlobalLoadingPanelVisible } = useGlobalLoadingPanel()
  const [selectedType, setSelectedType] = useState<{ [key in PokemonType]?: string }>({})
  const [chargedMoveList, setChargedMoveList] = useState(ChargedMoveData)
  const [isLoading, setIsLoading] = useState(true)
  const chartWrapperRef = useRef<HTMLDivElement>(null)
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (Object.values(selectedType).length > 0)
      setChargedMoveList(ChargedMoveData.filter((value) => selectedType[value.type] !== undefined))
    else setChargedMoveList(ChargedMoveData)
  }, [selectedType])

  useEffect(() => {
    setGlobalLoadingPanelVisible(isLoading)
  }, [isLoading])

  // chart size handler
  const handleResize = () => {
    if (chartWrapperRef.current) {
      const { clientWidth, clientHeight } = chartWrapperRef.current
      const isVideoRatio = clientWidth > (clientHeight * 16) / 9
      if (isVideoRatio) {
        setChartSize({
          width: clientWidth - labelWidthY,
          height: (clientWidth * 9) / 16 - labelHeightX,
        })
      } else {
        setChartSize({
          width: (clientHeight * 16) / 9 - labelWidthY,
          height: clientHeight - labelHeightX,
        })
      }
    }
  }

  // moves spread handler
  const spreadMove = (move: HTMLDivElement, offset: number) => {
    if (!move.classList.contains('move-chip-spread')) {
      move.classList.add('move-chip-spread')
      move.style.zIndex = '5'
      move.style.top = `${Number(move.style.top.split('px')[0]) + offset}px`
      setTimeout(() => rollbackMove(move, offset), 2000)
    }
  }

  // spread moves rollback handler
  const rollbackMove = (move: HTMLDivElement, offset: number) => {
    if (move.classList.contains('move-chip-spread')) {
      move.classList.remove('move-chip-spread')
      move.style.zIndex = '1'
      move.style.top = `${Number(move.style.top.split('px')[0]) - offset}px`
    }
  }

  // mouse move event handler
  const handleMouse = (e: MouseEvent) => {
    let elements = document.elementsFromPoint(e.clientX, e.clientY)
    const moves = elements.filter((e) => e.classList.contains('move-chip-point'))
    if (moves.length > 1) {
      moves.map((move, index) => {
        const moveElement = move.nextElementSibling
        if (moveElement instanceof HTMLDivElement) {
          const offset = (index - (moves.length - 1) / 2) * 24
          spreadMove(moveElement, offset)
        }
      })
    }
  }

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    document.addEventListener('mousemove', handleMouse)
    return () => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('mousemove', handleMouse)
    }
  }, [])

  return (
    <>
      <div className="w-full h-[70px] pb-1 flex flex-wrap justify-center gap-1 overflow-x-scroll scroll-hidden">
        <Button
          variant="contained"
          className="static-text h-8 !min-w-[32px] !py-[2px]"
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
              className="flex gap-0.5 static-text h-8 !min-w-[32px] !py-[2px]"
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
              <Image src={`/images/types/${type}.png`} alt={type} width={16} height={16} />
              {text}
            </Button>
          )
        })}
      </div>
      <div ref={chartWrapperRef} className="relative w-full h-[calc(100%-70px)] overflow-scroll">
        {!isLoading &&
          chartSize.width > 0 &&
          chartSize.height > 0 &&
          chargedMoveList.map((move) => {
            const { id, power, energy } = move
            const dpe = power / energy
            return (
              <MoveChip
                key={id}
                data={move}
                style={{
                  position: 'absolute',
                  left:
                    labelWidthY +
                    (chartSize.width * (energy - minEnergy)) / (maxEnergy - minEnergy),
                  top: chartSize.height * (1 - (dpe - minDpe) / (maxDpe - minDpe)),
                }}
              />
            )
          })}
        <Chart
          setIsLoading={setIsLoading}
          xAxisProps={{
            labelName: 'Energy',
            labelHeight: labelHeightX,
            initialValue: minEnergy,
            divisionCount: 13,
            interval: energyInterval,
          }}
          yAxisProps={{
            labelName: 'DPE (Damage Per Energy)',
            labelWidth: 48,
            divisionCount: 5,
            interval: damageInterval,
          }}
          graphProps={graphProps}
        />
      </div>
    </>
  )
}

export default ChargedMovesPage
