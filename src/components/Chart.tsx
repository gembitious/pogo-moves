'use client'

import { darken } from '@mui/material'
import { POGO_MOVES_COLORS } from '@styles/colors'
import { Placement } from '@types'
import { Dispatch, FC, SetStateAction, useEffect, useRef, useState } from 'react'

interface ChartAxisProps {
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

export interface ChartComponentProps {
  xAxisProps?: ChartAxisProps
  yAxisProps?: ChartAxisProps
  graphProps?: {
    yOfX: (x: number) => number
    lineWidth?: number
    strokeStyle?: string
    label?: string
  }[]
  graphLabelProps?: {
    placement?: Placement
    offsetX?: number
    offsetY?: number
    textSize?: number
    gap?: number
    paddingX?: number
    paddingY?: number
  }
  setIsLoading?: Dispatch<SetStateAction<boolean>> // canvas drawing 이후 외부 isLoading 변수 false 전환
}

export const Chart: FC<ChartComponentProps> = ({
  xAxisProps,
  yAxisProps,
  graphProps,
  graphLabelProps = { placement: 'left-start' },
  setIsLoading,
}) => {
  const canvasFirstLayerRef = useRef<HTMLCanvasElement>(null)
  const canvasSecondLayerRef = useRef<HTMLCanvasElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

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
    if (
      canvasSize.width > 0 &&
      canvasSize.height > 0 &&
      typeof window !== 'undefined' &&
      ctx1 &&
      ctx2
    ) {
      setIsLoading?.(true)
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

      // Draw graph from props
      const labelList: { label: string; color: string }[] = []
      let maxLabelLength = 0
      graphProps?.forEach((props) => {
        const { yOfX, lineWidth, strokeStyle, label } = props
        ctx1.beginPath()
        for (let x = 0; x <= xAxisWidth; x += 5) {
          let y =
            ((yOfX((x * divisionCountX * intervalX) / xAxisWidth + initialValueX) - initialValueY) *
              yAxisHeight) /
            (divisionCountY * intervalY)
          if (y <= yAxisHeight) ctx1.lineTo(x + yAxisLabelWidth, yAxisHeight - y)
        }
        ctx1.strokeStyle = strokeStyle ?? POGO_MOVES_COLORS.white
        ctx1.lineWidth = lineWidth ?? 1
        ctx1.stroke()
        ctx1.closePath()
        if (label) {
          labelList.push({ label: label, color: strokeStyle ?? POGO_MOVES_COLORS.white })
          if (label.length > maxLabelLength) maxLabelLength = label.length
        }
      })

      if (labelList.length > 0) {
        const {
          offsetX,
          offsetY,
          textSize,
          gap: gapProps,
          paddingX: paddingXProps,
          paddingY: paddingYProps,
        } = graphLabelProps
        // TODO: apply placement
        const ltX = yAxisLabelWidth + (offsetX ?? 0)
        const ltY = offsetY ?? 0
        const fontSize = textSize ?? 12
        const gap = gapProps ?? 4
        const paddingX = paddingXProps ?? 4
        const paddingY = paddingYProps ?? 4
        ctx1.fillStyle = darken(POGO_MOVES_COLORS.background, 0.2)
        ctx1.fillRect(
          ltX,
          ltY,
          maxLabelLength * fontSize * 0.6 + paddingX * 2 + 20,
          labelList.length * fontSize + (labelList.length - 1) * gap + paddingY * 2,
        )
        ctx1.font = `200 ${fontSize}px Arial`
        ctx1.textBaseline = 'top'
        ctx1.textAlign = 'left'
        ctx1.fillStyle = POGO_MOVES_COLORS.gray[1]
        ctx1.lineWidth = 1
        labelList.forEach((item, index) => {
          ctx1.strokeStyle = item.color
          ctx1.beginPath()
          ctx1.moveTo(ltX + paddingX, ltY + paddingY + fontSize / 2 + index * (fontSize + gap))
          ctx1.lineTo(ltX + paddingX + 16, ltY + paddingY + fontSize / 2 + index * (fontSize + gap))
          ctx1.stroke()
          ctx1.fillText(
            item.label,
            ltX + paddingX * 2 + 16,
            ltY + paddingY + index * (fontSize + gap),
          )
        })
      }

      setIsLoading?.(false)
    }
  }, [canvasSize])

  // window resize handler
  const handleResize = () => {
    if (canvasFirstLayerRef?.current?.parentElement) {
      const { clientWidth, clientHeight } = canvasFirstLayerRef.current.parentElement
      const isParentVideoRatio = clientWidth > (clientHeight * 16) / 9
      let parentWidth = canvasSize.width
      let parentHeight = canvasSize.height
      if (isParentVideoRatio) {
        parentWidth = clientWidth
        parentHeight = (parentWidth * 9) / 16
      } else {
        parentHeight = clientHeight
        parentWidth = (parentHeight * 16) / 9
      }
      setCanvasSize({ width: parentWidth, height: parentHeight })
      setIsLoading?.(false)
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
        className="absolute z-[-1]"
        ref={canvasFirstLayerRef}
        width={canvasSize.width}
        height={canvasSize.height}
      />
      <canvas
        className="absolute z-[-2]"
        ref={canvasSecondLayerRef}
        width={canvasSize.width}
        height={canvasSize.height}
      />
    </>
  )
}
