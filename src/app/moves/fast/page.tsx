'use client'

import Button from '@components/Button'
import { Graph } from '@components/Graph'
import { MoveChip } from '@components/MoveChip'
import { FastMoveData, pokemonTypeText } from '@constants'
import useGlobalLoadingPanel from '@hooks/useGlobalLoadingPanel'
import { POGO_MOVES_COLORS } from '@styles/colors'
import { PokemonType } from '@types'
import Image from 'next/image'
import { FC, useEffect, useRef, useState } from 'react'

const maxDpt = 6
const minDpt = 0
const eptWeight = 1.5
const minEpt = 2
const maxEpt = 8
const dptInterval = 1
const eptInterval = 1
const labelHeightX = 48
const labelWidthY = 48

const FastMovesPage: FC = () => {
  const { setGlobalLoadingPanelVisible } = useGlobalLoadingPanel()
  const [selectedType, setSelectedType] = useState<{ [key in PokemonType]?: string }>({})
  const [fastMoveList, setFastMoveList] = useState(FastMoveData)
  const [isLoading, setIsLoading] = useState(true)
  const graphWrapperRef = useRef<HTMLDivElement>(null)
  const [graphSize, setGraphSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (Object.values(selectedType).length > 0)
      setFastMoveList(FastMoveData.filter((value) => selectedType[value.type] !== undefined))
    else setFastMoveList(FastMoveData)
  }, [selectedType])

  useEffect(() => {
    setGlobalLoadingPanelVisible(isLoading)
  }, [isLoading])

  // graph size handler
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
    if (moves.length > 0) {
      moves.map((move, index) => {
        const moveElement = move.nextElementSibling
        if (moveElement instanceof HTMLDivElement) {
          const offset = moves.length > 1 ? (index - (moves.length - 1) / 2) * 24 : 0
          spreadMove(moveElement, offset)
        }
      })
    }
  }

  useEffect(() => {
    setGlobalLoadingPanelVisible(true)
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
            setFastMoveList(FastMoveData)
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
      <div ref={graphWrapperRef} className="relative w-full h-[calc(100%-70px)] overflow-scroll">
        {!isLoading &&
          graphSize.width > 0 &&
          graphSize.height > 0 &&
          fastMoveList.map((move) => {
            const { id, dpt, ept } = move
            return (
              <MoveChip
                key={id}
                data={move}
                style={{
                  position: 'absolute',
                  left: labelWidthY + (graphSize.width * (dpt - minDpt)) / (maxDpt - minDpt),
                  top: graphSize.height * (1 - (ept * eptWeight - minEpt) / (maxEpt - minEpt)),
                }}
              />
            )
          })}
        <Graph
          setIsLoading={setIsLoading}
          xAxisProps={{
            labelName: 'DPT',
            labelHeight: labelHeightX,
            initialValue: minDpt,
            divisionCount: 6,
            interval: dptInterval,
          }}
          yAxisProps={{
            labelName: `EPT*${eptWeight}`,
            labelWidth: 48,
            initialValue: minEpt,
            divisionCount: 6,
            interval: eptInterval,
          }}
        />
      </div>
    </>
  )
}

export default FastMovesPage
