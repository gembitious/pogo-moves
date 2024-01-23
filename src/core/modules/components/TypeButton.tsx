import Button from '@components/Button'
import { ButtonProps, styled } from '@mui/material'
import { POGO_MOVES_COLORS } from '@styles/colors'
import { FC } from 'react'

const BaseButton = styled(Button)`
  display: flex;
  gap: 2px;
  min-width: 24px !important;
  height: 24px;
  padding: 4px 8px;
  border-radius: 12px;
  color: ${POGO_MOVES_COLORS.white};
  font-size: 12px;
  @media (min-width: 768px) {
    min-width: 32px !important;
    height: 32px;
    padding: 4px 8px;
    border-radius: 16px;
    font-size: 14px;
  }
`

export const TypeButton: FC<ButtonProps> = ({ children, className, ...others }) => {
  return (
    <BaseButton variant="contained" className={`static-text ${className ?? ''}`} {...others}>
      {children}
    </BaseButton>
  )
}
