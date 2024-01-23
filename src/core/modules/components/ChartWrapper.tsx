import { styled } from '@mui/material'
import { ContainerHeight, ContainerMobileHeight } from './TypeButtonContainer'

export const ChartWrapper = styled('div')`
  width: 100%;
  height: calc(100% - ${ContainerMobileHeight});
  position: relative;
  overflow: scroll;
  @media (min-width: 768px) {
    height: calc(100% - ${ContainerHeight});
  }
`
