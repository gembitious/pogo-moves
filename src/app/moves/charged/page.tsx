'use client'

import { Graph } from '@components/Graph'
import { FC } from 'react'

const ChargedMovesPage: FC = () => {
  return (
    <div className="flex flex-col justify-center items-center w-full m-auto px-4 md:px-6 lg:px-8">
      <div className="w-full aspect-[2/1] md:aspect-square lg:aspect-video">
        <Graph />
      </div>
    </div>
  )
}

export default ChargedMovesPage
