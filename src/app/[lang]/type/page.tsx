'use client'

import { POKEMON_TYPE } from '@core/constants'
import { getDictionary } from '@core/constants/dictionary'
import { POKEMON_TYPE_EFFECT } from '@core/constants/pokemonType'
import { TypeEffectIcon, TypeIcon, TypeLabel } from '@core/modules/components'
import { NextPageStaticParams, PokemonType } from '@core/types'
import { NextPage } from 'next'

const pokemonTypeList = Object.keys(POKEMON_TYPE)

const TypePage: NextPage<{ params: NextPageStaticParams }> = ({ params: { lang } }) => {
  const dictionary = getDictionary(lang)
  return (
    <div className="flex overflow-scroll">
      <div className="flex flex-col">
        <div className="flex flex-col items-end">
          <div className="text-center text-white">{dictionary.common.defender}</div>
          <div className="flex pl-[96px] md:pl-[128px]">
            {pokemonTypeList.map((key) => {
              const type = key as PokemonType
              return <TypeIcon key={`col-${type}`} type={type} size={32} />
            })}
          </div>
        </div>
        <div className="flex">
          <div className="vertical-rl text-center text-white">{dictionary.common.attacker}</div>
          <div className="flex flex-col">
            {pokemonTypeList.map((key) => {
              const type = key as PokemonType
              return <TypeLabel key={`row-${type}`} type={type} dictionary={dictionary} />
            })}
          </div>
          <div className="flex flex-col">
            {pokemonTypeList.map((key) => {
              const type = key as PokemonType
              return (
                <div key={`row-${type}-effect`} className="flex">
                  {Object.entries(POKEMON_TYPE_EFFECT[type]).map(([defendType, effect]) => (
                    <TypeEffectIcon key={`${defendType}-${effect}`} effect={effect} />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TypePage
