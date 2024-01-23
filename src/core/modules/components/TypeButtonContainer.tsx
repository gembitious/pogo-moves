import { styled } from '@mui/material'
import { HTMLAttributes, type FC } from 'react'

export const ContainerMobileHeight = '54px'
export const ContainerHeight = '72px'

const Container = styled('div')`
  width: 100%;
  height: ${ContainerMobileHeight};
  gap: 4px;
  padding-bottom: 2px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  overflow-x: scroll;

  @media (min-width: 768px) {
    height: ${ContainerHeight};
    gap: 4px;
    padding-bottom: 4px;
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
