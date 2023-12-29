'use client'

import { debounce } from '@mui/material'
import { POGO_MOVES_COLORS } from '@styles/colors'
import { FC, useEffect, useRef, useState } from 'react'

interface GraphAxisProps {
  labelName?: string
  labelHeight?: number
  labelWidth?: number
  labelTextSize?: number
  initialValue?: number
  interval?: number
  intervalTextSize?: number
  subInterval?: number
  divisionCount?: number
  subDivisionCount?: number
}

interface GraphProps {
  xAxisProps?: GraphAxisProps
  yAxisProps?: GraphAxisProps
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

  const initialValueX = xAxisProps?.initialValue ?? 0
  const initialValueY = yAxisProps?.initialValue ?? 0
  const intervalX = xAxisProps?.interval ?? 1
  const intervalY = yAxisProps?.interval ?? 1

  const intervalTextSizeX = xAxisProps?.intervalTextSize ?? 16
  const intervalTextSizeY = yAxisProps?.intervalTextSize ?? 16

  const labelTextSizeX = xAxisProps?.labelTextSize ?? 16
  const labelTextSizeY = yAxisProps?.labelTextSize ?? 16
  const labelNameX = xAxisProps?.labelName ?? 'X Axis'
  const labelNameY = yAxisProps?.labelName ?? 'Y Axis'

  useEffect(() => {
    const canvas1 = canvasFirstLayerRef.current
    const canvas2 = canvasSecondLayerRef.current
    const ctx1 = canvas1?.getContext('2d')
    const ctx2 = canvas2?.getContext('2d')
    if (typeof window !== 'undefined' && ctx1 && ctx2) {
      ctx1.clearRect(0, 0, canvasSize.width, canvasSize.height)
      ctx1.strokeStyle = POGO_MOVES_COLORS.gray[2]
      ctx2.strokeStyle = POGO_MOVES_COLORS.gray[7]
      ctx1.fillStyle = POGO_MOVES_COLORS.white
      ctx2.fillStyle = POGO_MOVES_COLORS.white
      ctx2.font = `${intervalTextSizeY}px Arial`
      const yAxisHeight = canvasSize.height - xAxisLabelHeight
      const xAxisWidth = canvasSize.width - yAxisLabelWidth

      // y axis label - 90 degree rotate하여 draw
      ctx1.textAlign = 'center'
      ctx1.font = `${labelTextSizeY}px Arial`
      ctx1.translate(0, yAxisHeight / 2)
      ctx1.rotate(-Math.PI / 2)
      ctx1.fillText(labelNameY, 0, labelTextSizeY)
      ctx1.rotate(Math.PI / 2)
      ctx1.translate(0, -yAxisHeight / 2)

      ctx1.font = `${intervalTextSizeY}px Arial`
      ctx1.textBaseline = 'middle'
      ctx1.textAlign = 'right'

      // x axis stroke, y axis interval label
      for (let i = 0; i < divisionCountY; i++) {
        const positionY = (1 - i / divisionCountY) * yAxisHeight
        ctx1.beginPath()
        ctx1.moveTo(yAxisLabelWidth, positionY)
        ctx1.lineTo(canvasSize.width, positionY)
        ctx1.stroke()
        // label
        ctx1.fillText(
          String(initialValueY + i * intervalY),
          yAxisLabelWidth - intervalTextSizeY / 2,
          positionY,
        )

        // x axis sub stroke, y axis sub interval label
        for (let j = 1; j < subDivisionCountY; j++) {
          const subPositionY =
            positionY - (1 / divisionCountY) * (j / subDivisionCountY) * yAxisHeight
          ctx2.beginPath()
          ctx2.moveTo(yAxisLabelWidth, subPositionY)
          ctx2.lineTo(canvasSize.width, subPositionY)
          ctx2.stroke()
        }
      }

      ctx1.textBaseline = 'top'
      ctx1.textAlign = 'center'

      // x axis label
      ctx1.font = `${labelTextSizeX}px Arial`
      ctx1.fillText(
        labelNameX,
        yAxisLabelWidth + xAxisWidth / 2,
        canvasSize.height - labelTextSizeX,
      )

      ctx1.font = `${intervalTextSizeX}px Arial`

      // y axis stroke, x axis interval label
      for (let i = 0; i < divisionCountX; i++) {
        const positionX = yAxisLabelWidth + (xAxisWidth * i) / divisionCountX
        ctx1.beginPath()
        ctx1.moveTo(positionX, 0)
        ctx1.lineTo(positionX, yAxisHeight)
        ctx1.stroke()
        // label
        ctx1.fillText(
          String(initialValueX + i * intervalX),
          positionX,
          yAxisHeight + intervalTextSizeX / 2,
        )

        // y axis sub stroke, x axis sub interval label
        for (let j = 1; j < subDivisionCountX; j++) {
          const subPositionX =
            positionX + (1 / divisionCountX) * (j / subDivisionCountX) * xAxisWidth
          ctx2.beginPath()
          ctx2.moveTo(subPositionX, 0)
          ctx2.lineTo(subPositionX, yAxisHeight)
          ctx2.stroke()
        }
      }

      ctx1.textBaseline = 'middle'
      ctx1.textAlign = 'center'
    }
  }, [canvasSize])

  // window resize handler
  const handleResize = debounce(() => {
    if (canvasFirstLayerRef?.current?.parentElement) {
      const parentElement = canvasFirstLayerRef.current.parentElement
      const isParentVideoRatio = parentElement.clientWidth > (parentElement.clientHeight * 16) / 9
      let parentWidth = canvasSize.width
      let parentHeight = canvasSize.height
      if (isParentVideoRatio) {
        parentWidth = parentElement.clientWidth
        parentHeight = (parentWidth * 9) / 16
      } else {
        parentHeight = parentElement.clientHeight
        parentWidth = (parentHeight * 16) / 9
      }
      setCanvasSize({ width: parentWidth, height: parentHeight })
    }
  }, 500)

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
