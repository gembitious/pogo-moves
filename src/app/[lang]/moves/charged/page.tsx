'use client'

import Button from '@components/Button'
import { Chart, ChartComponentProps } from '@components/Chart'
import { MoveChip } from '@components/MoveChip'
import { chargedMoveData, pokemonType, pveChargedMoveData } from '@core/constants'
import { getDictionary } from '@core/constants/dictionary'
import { useGlobalLoadingPanel } from '@core/hooks'
import { MoveMode, NextPageStaticParams, PokemonType } from '@core/types'
import { darken, lighten } from '@mui/material'
import { POGO_MOVES_COLORS, POKEMON_TYPE_COLORS } from '@styles/colors'
import { NextPage } from 'next'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

const pvpConstants = {
  maxDpe: 2.5,
  minDpe: 0,
  minEnergy: 30,
  maxEnergy: 95,
  energyInterval: 5,
  dpeInterval: 0.5,
  labelHeightX: 48,
  labelWidthY: 48,
}

const pveConstants = {
  maxDpe: 3,
  minDpe: 0,
  maxDps: 80,
  minDps: 0,
  dpeInterval: 0.5,
  dpsInterval: 5,
  labelHeightX: 48,
  labelWidthY: 48,
}

const pvpChartProps: ChartComponentProps = {
  xAxisProps: {
    labelName: 'Energy',
    labelHeight: pvpConstants.labelHeightX,
    initialValue: pvpConstants.minEnergy,
    divisionCount: 13,
    interval: pvpConstants.energyInterval,
  },
  yAxisProps: {
    labelName: 'DPE (Damage Per Energy)',
    labelWidth: 48,
    divisionCount: 5,
    interval: pvpConstants.dpeInterval,
  },
  graphLabelProps: { paddingX: 12, paddingY: 12 },
  graphProps: [
    {
      label: 'DPE/Energy = 1/35',
      yOfX: (x) => x / 35,
      lineWidth: 1,
      strokeStyle: POGO_MOVES_COLORS.secondary,
    },
  ],
}

const pveChartProps: ChartComponentProps = {
  xAxisProps: {
    labelName: 'DPS (Damage Per Second)',
    labelHeight: pveConstants.labelHeightX,
    initialValue: pveConstants.minDps,
    divisionCount: 16,
    interval: pveConstants.dpsInterval,
  },
  yAxisProps: {
    labelName: 'DPE (Damage Per Energy)',
    labelWidth: 48,
    divisionCount: 6,
    interval: pveConstants.dpeInterval,
  },
  graphLabelProps: { gap: 16, paddingX: 16, paddingY: 16 },
  graphProps: [
    {
      label: 'DPS*DPE = 20',
      yOfX: (x) => 20 / x,
      lineWidth: 1,
      strokeStyle: darken(POGO_MOVES_COLORS.secondary, 0.3),
    },
    {
      label: 'DPS*DPE = 60',
      yOfX: (x) => 60 / x,
      lineWidth: 1,
      strokeStyle: POGO_MOVES_COLORS.secondary,
    },
    {
      label: 'DPS*DPE = 100',
      yOfX: (x) => 100 / x,
      lineWidth: 1,
      strokeStyle: lighten(POGO_MOVES_COLORS.secondary, 0.7),
    },
  ],
}

// moves spread handler
const spreadMove = (move: HTMLDivElement, offset: number) => {
  if (!move.classList.contains('move-chip-spread')) {
    move.classList.add('move-chip-spread')
    move.style.zIndex = '5'
    move.style.top = `${Number(move.style.top.split('px')[0]) + offset}px`
    const t = setTimeout(() => rollbackMove(move, offset), 2000)
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
const handleMouse = (e: MouseEvent, isClicked?: boolean) => {
  let elements = document.elementsFromPoint(e.clientX, e.clientY)
  const moves = elements.filter((e) => e.classList.contains('move-chip-point'))
  if (moves.length > 1) {
    moves.map((move, index) => {
      const moveElement = move.nextElementSibling
      if (moveElement instanceof HTMLDivElement) {
        const offset = moves.length > 1 ? (index - (moves.length - 1) / 2) * 18 : 0
        spreadMove(moveElement, offset)
      }
    })
  }
}

const ChargedMovesPage: NextPage<{ params: NextPageStaticParams }> = ({ params: { lang } }) => {
  const { setGlobalLoadingPanelVisible } = useGlobalLoadingPanel()
  const [selectedType, setSelectedType] = useState<{ [key in PokemonType]?: string }>({})
  const [chargedMoveList, setChargedMoveList] = useState(chargedMoveData)
  const [pveChargedMoveList, setPveChargedMoveList] = useState(pveChargedMoveData)
  const [isLoading, setIsLoading] = useState(true)
  const chartWrapperRef = useRef<HTMLDivElement>(null)
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 })
  const [chartProps, setChartProps] = useState<ChartComponentProps>(pvpChartProps)
  const [mode, setMode] = useState<MoveMode>('pvp')
  const dictionary = getDictionary(lang)

  useEffect(() => {
    if (Object.values(selectedType).length > 0) {
      setChargedMoveList(chargedMoveData.filter((value) => selectedType[value.type] !== undefined))
      setPveChargedMoveList(
        pveChargedMoveData.filter((value) => selectedType[value.type] !== undefined),
      )
    } else {
      setChargedMoveList(chargedMoveData)
      setPveChargedMoveList(pveChargedMoveData)
    }
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
        setChartSize(
          mode === 'pvp'
            ? {
                width: clientWidth - pvpConstants.labelWidthY,
                height: (clientWidth * 9) / 16 - pvpConstants.labelHeightX,
              }
            : {
                width: clientWidth - pveConstants.labelWidthY,
                height: (clientWidth * 9) / 16 - pveConstants.labelHeightX,
              },
        )
      } else {
        setChartSize(
          mode === 'pvp'
            ? {
                width: (clientHeight * 16) / 9 - pvpConstants.labelWidthY,
                height: clientHeight - pvpConstants.labelHeightX,
              }
            : {
                width: (clientHeight * 16) / 9 - pveConstants.labelWidthY,
                height: clientHeight - pveConstants.labelHeightX,
              },
        )
      }
    }
  }

  useEffect(() => {
    if (mode === 'pvp') {
      setChartProps(pvpChartProps)
    } else {
      setChartProps(pveChartProps)
    }
  }, [mode])

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
          className="static-text h-8 !min-w-[32px] !py-[2px] !rounded-full"
          style={{ backgroundColor: POGO_MOVES_COLORS.surface }}
          onClick={() => {
            setMode(mode === 'pve' ? 'pvp' : 'pve')
          }}
        >
          {mode === 'pve' ? 'PvP' : 'PvE'}
        </Button>
        <Button
          variant="contained"
          className="static-text h-8 !min-w-[32px] !py-[2px] !rounded-full"
          style={{ backgroundColor: POGO_MOVES_COLORS.white }}
          onClick={() => {
            setChargedMoveList(chargedMoveData)
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
              className="flex gap-0.5 static-text h-8 !min-w-[32px] !py-[2px] !rounded-full"
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
          (mode === 'pvp'
            ? chargedMoveList.map((move) => {
                const { id, energy, dpe } = move
                return (
                  <MoveChip
                    key={id}
                    data={move}
                    locale={lang}
                    style={{
                      position: 'absolute',
                      left:
                        pvpConstants.labelWidthY +
                        (chartSize.width * (energy - pvpConstants.minEnergy)) /
                          (pvpConstants.maxEnergy - pvpConstants.minEnergy),
                      top:
                        chartSize.height *
                        (1 -
                          (dpe - pvpConstants.minDpe) /
                            (pvpConstants.maxDpe - pvpConstants.minDpe)),
                    }}
                  />
                )
              })
            : pveChargedMoveList.map((move) => {
                const { id, dps, dpe } = move
                return (
                  <MoveChip
                    key={id}
                    data={move}
                    locale={lang}
                    style={{
                      position: 'absolute',
                      left:
                        pveConstants.labelWidthY +
                        (chartSize.width * (dps - pveConstants.minDps)) /
                          (pveConstants.maxDps - pveConstants.minDps),
                      top:
                        chartSize.height *
                        (1 -
                          (dpe - pveConstants.minDpe) /
                            (pveConstants.maxDpe - pveConstants.minDpe)),
                    }}
                  />
                )
              }))}
        <Chart setIsLoading={setIsLoading} {...chartProps} />
      </div>
    </>
  )
}

export default ChargedMovesPage
