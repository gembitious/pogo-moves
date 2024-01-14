'use client'

import { NextPageStaticParams } from '@core/types'
import { NextPage } from 'next'
import ChargedMovesPage from './moves/charged/page'

const HomePage: NextPage<{ params: NextPageStaticParams }> = ({ params }) => {
  return <ChargedMovesPage params={params} />
}

export default HomePage
