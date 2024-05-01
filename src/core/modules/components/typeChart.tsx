import Button from '@components/Button'
import { TDictionary } from '@core/constants/dictionary'
import { PokemonType } from '@core/types'
import { ButtonProps, styled } from '@mui/material'
import { POGO_MOVES_COLORS, POKEMON_TYPE_COLORS } from '@styles/colors'
import Image from 'next/image'
import { FC } from 'react'

const BaseButton = styled(Button)`
  display: flex;
  gap: 4px;
  width: 96px;
  height: 24px;
  padding: 4px 8px;
  border-radius: 12px;
  color: ${POGO_MOVES_COLORS.white};
  font-size: 12px;
  @media (min-width: 768px) {
    width: 128px;
    height: 32px;
    padding: 4px 8px;
    border-radius: 16px;
    font-size: 14px;
  }
`

const IconWrapper = styled('div')`
  position: relative;
  width: 24px;
  height: 24px;
  @media (min-width: 768px) {
    width: 32px;
    height: 32px;
  }
`

interface TypeLabelProps extends Omit<ButtonProps, 'type'> {
  type: PokemonType
  dictionary: TDictionary
}

export const TypeLabel: FC<TypeLabelProps> = ({
  type,
  dictionary,
  children,
  className,
  ...others
}) => {
  return (
    <BaseButton
      variant="contained"
      className={`static-text ${className ?? ''}`}
      style={{
        backgroundColor: POKEMON_TYPE_COLORS[type],
      }}
      {...others}
    >
      <TypeIcon type={type} />
      {dictionary.type[type]}
    </BaseButton>
  )
}

export const TypeIcon: FC<{ type: PokemonType; size?: number }> = ({ type, size = 24 }) => (
  <IconWrapper>
    <Image src={`/images/types/${type}.png`} className="cursor-pointer" alt={type} fill />
  </IconWrapper>
)

export const TypeEffectIcon: FC<{ effect: string }> = ({ effect }) => {
  return (
    <IconWrapper>
      <Image
        src={`/images/types/type_${effect}.png`}
        className="cursor-pointer"
        alt={effect}
        fill
      />
    </IconWrapper>
  )
}
