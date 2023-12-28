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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1920 })

  const xAxisLabelHeight = xAxisProps?.labelHeight ?? 48
  const yAxisLabelWidth = yAxisProps?.labelWidth ?? 48

  const divisionCountX = xAxisProps?.divisionCount ?? 5
  const divisionCountY = yAxisProps?.divisionCount ?? 5
  const subDivisionCountX = xAxisProps?.subDivisionCount ?? 5
  const subDivisionCountY = yAxisProps?.subDivisionCount ?? 5

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx) {
      const yAxisHeight = canvasSize.height - xAxisLabelHeight
      const xAxisWidth = canvasSize.width - yAxisLabelWidth

      // x axis stroke
      for (let i = 0; i < divisionCountY; i++) {
        ctx.strokeStyle = POGO_MOVES_COLORS.gray[2]
        const positionY = (1 - i / divisionCountY) * yAxisHeight
        ctx.beginPath()
        ctx.moveTo(yAxisLabelWidth, positionY)
        ctx.lineTo(canvasSize.width, positionY)
        ctx.stroke()

        // x axis sub stroke
        for (let j = 1; j < subDivisionCountY; j++) {
          ctx.strokeStyle = POGO_MOVES_COLORS.gray[7]
          const subPositionY =
            positionY -
            (1 / divisionCountY) * (j / subDivisionCountY) * yAxisHeight
          ctx.beginPath()
          ctx.moveTo(yAxisLabelWidth, subPositionY)
          ctx.lineTo(canvasSize.width, subPositionY)
          ctx.stroke()
        }
      }

      // y axis stroke
      for (let i = 0; i < divisionCountX; i++) {
        ctx.strokeStyle = POGO_MOVES_COLORS.gray[2]
        const positionX = yAxisLabelWidth + (xAxisWidth * i) / divisionCountX
        ctx.beginPath()
        ctx.moveTo(positionX, 0)
        ctx.lineTo(positionX, yAxisHeight)
        ctx.stroke()

        // y axis sub stroke
        for (let j = 1; j < subDivisionCountX; j++) {
          ctx.strokeStyle = POGO_MOVES_COLORS.gray[7]
          const subPositionX =
            positionX +
            (1 / divisionCountX) * (j / subDivisionCountX) * xAxisWidth
          ctx.beginPath()
          ctx.moveTo(subPositionX, 0)
          ctx.lineTo(subPositionX, yAxisHeight)
          ctx.stroke()
        }
      }
    }
  }, [canvasSize])

  const handleResize = () => {
    if (typeof window !== 'undefined' && canvasRef?.current?.parentElement) {
      const windowWidth = window.innerWidth
      const parentWidth = canvasRef.current.parentElement.clientWidth
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
    <canvas
      className="absolute"
      ref={canvasRef}
      width={canvasSize.width}
      height={canvasSize.height}
    />
  )
}
