import { styled } from '@mui/material'
import { HTMLAttributes, type FC } from 'react'

const Container = styled('div')`
  width: 100%;
  height: 54px;
  gap: 4px;
  padding-bottom: 2px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  overflow-x: scroll;

  @media (min-width: 768px) {
    height: 70px;
    gap: 4px;
    padding-bottom: 2px;
  }
`

export const TypeButtonContainer: FC<HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...others
}) => (
  <Container className={`scroll-hidden ${className ?? ''}`} {...others}>
    {children}
  </Container>
)
