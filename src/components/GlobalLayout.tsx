'use client'

import { styled } from '@mui/material'

export const MainContainer = styled('main')`
  max-width: '1920px';
  margin: 'auto';
  display: 'flex';
  flex-direction: 'column';
  height: calc(100vh - 44px);
  overflow-y: scroll;

  @media (min-width: 360px) {
    height: calc(100vh - 64px);
  }

  @media (min-width: 768px) {
    height: calc(100vh - 96px);
  }

  @media (min-width: 1024px) {
    height: calc(100vh - 128px);
  }
`
