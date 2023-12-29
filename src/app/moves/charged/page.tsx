'use client'

import { Graph } from '@components/Graph'
import { FC } from 'react'

const ChargedMovesPage: FC = () => {
  return (
    <div className="relative w-full h-full">
      <Graph
        xAxisProps={{ labelName: 'DPT', divisionCount: 6 }}
        yAxisProps={{ labelName: 'EPT*1.4', divisionCount: 6 }}
      />
    </div>
  )
}

export default ChargedMovesPage
