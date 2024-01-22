import { NextPageStaticParams } from '@core/types'
import { NextPage } from 'next'

const TypePage: NextPage<{ params: NextPageStaticParams }> = ({ params: { lang } }) => {
  return <div className="text-white">Implementing...</div>
}

export default TypePage
