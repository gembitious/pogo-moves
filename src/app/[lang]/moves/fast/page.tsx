'use client'

import Button from '@components/Button'
import { Chart, ChartComponentProps } from '@components/Chart'
import { MoveChip } from '@components/MoveChip'
import { fastMoveData, pokemonType } from '@core/constants'
import { getDictionary } from '@core/constants/dictionary'
import { useGlobalLoadingPanel } from '@core/hooks'
import { PokemonType } from '@core/types'
import { Locale } from '@core/types/i18n-config'
import { darken, lighten } from '@mui/material'
import { POGO_MOVES_COLORS, POKEMON_TYPE_COLORS } from '@styles/colors'
import { NextPage } from 'next'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

const maxDpt = 6
const minDpt = 0
const eptWeight = 1
const minEpt = 1
const maxEpt = 6
const dptInterval = 1
const eptInterval = 1
const labelHeightX = 48
const labelWidthY = 48

const graphProps: ChartComponentProps['graphProps'] = [
  {
    label: 'DPT*EPT^1.5 = 10',
    yOfX: (x) => 10 / Math.pow(x, 1.5),
    lineWidth: 1,
    strokeStyle: darken(POGO_MOVES_COLORS.secondary, 0.3),
  },
  {
    label: 'DPT*EPT^1.5 = 15',
    yOfX: (x) => 15 / Math.pow(x, 1.5),
    lineWidth: 1,
    strokeStyle: POGO_MOVES_COLORS.secondary,
  },
  {
    label: 'DPT*EPT^1.5 = 20',
    yOfX: (x) => 20 / Math.pow(x, 1.5),
    lineWidth: 1,
    strokeStyle: lighten(POGO_MOVES_COLORS.secondary, 0.7),
  },
]

const FastMovesPage: NextPage<{ params: { lang: Locale } }> = ({ params: { lang } }) => {
  const { setGlobalLoadingPanelVisible } = useGlobalLoadingPanel()
  const [selectedType, setSelectedType] = useState<{ [key in PokemonType]?: string }>({})
  const [fastMoveList, setFastMoveList] = useState(fastMoveData)
  const [isLoading, setIsLoading] = useState(true)
  const chartWrapperRef = useRef<HTMLDivElement>(null)
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 })
  const dictionary = getDictionary(lang)

  useEffect(() => {
    if (Object.values(selectedType).length > 0)
      setFastMoveList(fastMoveData.filter((value) => selectedType[value.type] !== undefined))
    else setFastMoveList(fastMoveData)
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
    if (moves.length > 0) {
      moves.map((move, index) => {
        const moveElement = move.nextElementSibling
        if (moveElement instanceof HTMLDivElement) {
          const offset = moves.length > 1 ? (index - (moves.length - 1) / 2) * 18 : 0
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
            setFastMoveList(fastMoveData)
            setSelectedType({})
          }}
        >
          {dictionary.common.allType}
        </Button>
        {Object.keys(pokemonType).map((key) => {
          const type = key as PokemonType
          const isSelected = Object.values(selectedType).length === 0 || selectedType[type]
          return (
            <Button
              key={type}
              variant="contained"
              className="flex gap-0.5 static-text h-8 !min-w-[32px] !py-[2px]"
              style={{
                opacity: isSelected ? '' : ' 30%',
                backgroundColor: POKEMON_TYPE_COLORS[type],
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
              {dictionary.type[type]}
            </Button>
          )
        })}
      </div>
      <div ref={chartWrapperRef} className="relative w-full h-[calc(100%-70px)] overflow-scroll">
        {!isLoading &&
          chartSize.width > 0 &&
          chartSize.height > 0 &&
          fastMoveList.map((move) => {
            const { id, dpt, ept } = move
            return (
              <MoveChip
                key={id}
                data={move}
                locale={lang}
                style={{
                  position: 'absolute',
                  left: labelWidthY + (chartSize.width * (dpt - minDpt)) / (maxDpt - minDpt),
                  top: chartSize.height * (1 - (ept * eptWeight - minEpt) / (maxEpt - minEpt)),
                }}
              />
            )
          })}
        <Chart
          setIsLoading={setIsLoading}
          xAxisProps={{
            labelName: 'DPT',
            labelHeight: labelHeightX,
            initialValue: minDpt,
            divisionCount: 6,
            interval: dptInterval,
          }}
          yAxisProps={{
            labelName: `EPT`,
            labelWidth: 48,
            initialValue: minEpt,
            divisionCount: 5,
            interval: eptInterval,
          }}
          graphProps={graphProps}
          graphLabelProps={{ gap: 16, paddingX: 16, paddingY: 16 }}
        />
      </div>
    </>
  )
}

export default FastMovesPage
