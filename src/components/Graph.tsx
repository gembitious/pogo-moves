'use client'

import { POGO_MOVES_COLORS } from '@styles/colors'
import { FC, useEffect, useRef, useState } from 'react'

interface GraphProps {
  xAxisProps?: {
    labelHeight?: number
    interval?: number
    divisionCount?: number
    subDivisionCount?: number
  }
  yAxisProps?: {
    labelWidth?: number
    interval?: number
    divisionCount?: number
    subDivisionCount?: number
  }
}

export const Graph: FC<GraphProps> = ({ xAxisProps, yAxisProps }) => {
  const canvasFirstLayerRef = useRef<HTMLCanvasElement>(null)
  const canvasSecondLayerRef = useRef<HTMLCanvasElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1920 })

  const xAxisLabelHeight = xAxisProps?.labelHeight ?? 48
  const yAxisLabelWidth = yAxisProps?.labelWidth ?? 48

  const divisionCountX = xAxisProps?.divisionCount ?? 5
  const divisionCountY = yAxisProps?.divisionCount ?? 5
  const subDivisionCountX = xAxisProps?.subDivisionCount ?? 5
  const subDivisionCountY = yAxisProps?.subDivisionCount ?? 5

  useEffect(() => {
    const canvas1 = canvasFirstLayerRef.current
    const canvas2 = canvasSecondLayerRef.current
    const ctx1 = canvas1?.getContext('2d')
    const ctx2 = canvas2?.getContext('2d')
    if (ctx1 && ctx2) {
      ctx1.strokeStyle = POGO_MOVES_COLORS.gray[2]
      ctx2.strokeStyle = POGO_MOVES_COLORS.gray[7]
      const yAxisHeight = canvasSize.height - xAxisLabelHeight
      const xAxisWidth = canvasSize.width - yAxisLabelWidth

      // x axis stroke
      for (let i = 0; i < divisionCountY; i++) {
        const positionY = (1 - i / divisionCountY) * yAxisHeight
        ctx1.beginPath()
        ctx1.moveTo(yAxisLabelWidth, positionY)
        ctx1.lineTo(canvasSize.width, positionY)
        ctx1.stroke()

        // x axis sub stroke
        for (let j = 1; j < subDivisionCountY; j++) {
          const subPositionY =
            positionY - (1 / divisionCountY) * (j / subDivisionCountY) * yAxisHeight
          ctx2.beginPath()
          ctx2.moveTo(yAxisLabelWidth, subPositionY)
          ctx2.lineTo(canvasSize.width, subPositionY)
          ctx2.stroke()
        }
      }

      // y axis stroke
      for (let i = 0; i < divisionCountX; i++) {
        const positionX = yAxisLabelWidth + (xAxisWidth * i) / divisionCountX
        ctx1.beginPath()
        ctx1.moveTo(positionX, 0)
        ctx1.lineTo(positionX, yAxisHeight)
        ctx1.stroke()

        // y axis sub stroke
        for (let j = 1; j < subDivisionCountX; j++) {
          const subPositionX =
            positionX + (1 / divisionCountX) * (j / subDivisionCountX) * xAxisWidth
          ctx2.beginPath()
          ctx2.moveTo(subPositionX, 0)
          ctx2.lineTo(subPositionX, yAxisHeight)
          ctx2.stroke()
        }
      }
    }
  }, [canvasSize])

  const handleResize = () => {
    if (typeof window !== 'undefined' && canvasFirstLayerRef?.current?.parentElement) {
      const windowWidth = window.innerWidth
      const parentWidth = canvasFirstLayerRef.current.parentElement.clientWidth
      const parentHeight =
        windowWidth > 1024
          ? (parentWidth * 9) / 16
          : windowWidth > 768
            ? parentWidth
            : parentWidth * 2

      setCanvasSize({ width: parentWidth, height: parentHeight })
    }
  }

  useEffect(() => {
    // init
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <>
      <canvas
        className="absolute z-0"
        ref={canvasFirstLayerRef}
        width={canvasSize.width}
        height={canvasSize.height}
      />
      <canvas
        className="absolute z-[-1]"
        ref={canvasSecondLayerRef}
        width={canvasSize.width}
        height={canvasSize.height}
      />
    </>
  )
}
