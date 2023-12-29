'use client'

import { styled } from '@mui/material'

export const MainContainer = styled('main')`
  max-width: 1920px;
  margin: auto;
  width: 100%;
  height: 100%;
  position: relative;
`

export const MainWrapper = styled('div')`
  height: calc(100vh - 44px);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 0 16px;
  overflow-y: scroll;

  @media (min-width: 360px) {
    height: calc(100vh - 64px);
  }

  @media (min-width: 768px) {
    height: calc(100vh - 96px);
    padding: 0 24px;
  }

  @media (min-width: 1024px) {
    height: calc(100vh - 128px);
    padding: 0 32px;
  }
`

export const Header = styled('div')`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 44px;
  padding: 6px 2px;

  @media (min-width: 360px) {
    height: 64px;
    padding: 8px 4px;
  }

  @media (min-width: 768px) {
    height: 96px;
    padding: 12px 8px;
  }

  @media (min-width: 1024px) {
    height: 128px;
    padding: 16px 8px;
  }
`
