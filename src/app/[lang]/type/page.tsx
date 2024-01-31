'use client'

import { POKEMON_TYPE } from '@core/constants'
import { getDictionary } from '@core/constants/dictionary'
import { POKEMON_TYPE_EFFECTIVENESS } from '@core/constants/pokemonType'
import { TypeIcon, TypeLabel } from '@core/modules/components'
import { NextPageStaticParams, PokemonType } from '@core/types'
import { NextPage } from 'next'
import Image from 'next/image'

const pokemonTypeList = Object.keys(POKEMON_TYPE)

const TypePage: NextPage<{ params: NextPageStaticParams }> = ({ params: { lang } }) => {
  const dictionary = getDictionary(lang)
  return (
    <div className="flex flex-col">
      <div className="flex pl-[128px]">
        {pokemonTypeList.map((key) => {
          const type = key as PokemonType
          return <TypeIcon type={type} size={32} />
        })}
      </div>
      <div className="flex">
        <div className="flex flex-col">
          {pokemonTypeList.map((key) => {
            const type = key as PokemonType
            return (
              <TypeLabel key={type} type={type} dictionary={dictionary}>
                <Image src={`/images/types/${type}.png`} alt={type} width={24} height={24} />
                {dictionary.type[type]}
              </TypeLabel>
            )
          })}
        </div>
        <div className="flex flex-col">
          {pokemonTypeList.map((key) => {
            const type = key as PokemonType
            return (
              <div className="flex">
                {Object.entries(POKEMON_TYPE_EFFECTIVENESS[type]).map(
                  ([defendType, effectiveness]) => (
                    <Image
                      src={`/images/types/type_${effectiveness}.png`}
                      className="cursor-pointer"
                      alt={type}
                      width={32}
                      height={32}
                    />
                  ),
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default TypePage
