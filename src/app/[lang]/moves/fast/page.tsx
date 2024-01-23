'use client'

import { Chart, ChartComponentProps } from '@components/Chart'
import { MoveChip } from '@components/MoveChip'
import { POKEMON_TYPE, fastMoveData } from '@core/constants'
import { getDictionary } from '@core/constants/dictionary'
import { useGlobalLoadingPanel } from '@core/hooks'
import { ChartWrapper, TypeButton, TypeButtonContainer } from '@core/modules/components'
import { PokemonType } from '@core/types'
import { Locale } from '@core/types/i18n-config'
import { handleMoveChip } from '@core/utils'
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

  useEffect(() => {
    setGlobalLoadingPanelVisible(true)
    handleResize()
    window.addEventListener('resize', handleResize)
    document.addEventListener('mousemove', handleMoveChip)
    return () => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('mousemove', handleMoveChip)
    }
  }, [])

  return (
    <>
      <TypeButtonContainer>
        <TypeButton
          style={{ backgroundColor: POGO_MOVES_COLORS.gray[7] }}
          onClick={() => {
            setFastMoveList(fastMoveData)
            setSelectedType({})
          }}
        >
          {dictionary.common.allType}
        </TypeButton>
        {Object.keys(POKEMON_TYPE).map((key) => {
          const type = key as PokemonType
          const isSelected = Object.values(selectedType).length === 0 || selectedType[type]
          return (
            <TypeButton
              key={type}
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
            </TypeButton>
          )
        })}
      </TypeButtonContainer>
      <ChartWrapper ref={chartWrapperRef}>
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
      </ChartWrapper>
    </>
  )
}

export default FastMovesPage
