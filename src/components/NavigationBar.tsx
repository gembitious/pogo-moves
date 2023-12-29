'use client'

import { styled } from '@mui/material'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { FC } from 'react'
import Button from './Button'

const NavigationBarContainer = styled('div')`
  position: fixed;
  top: 0;
  left: auto;
  right: 0;
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

const TitleBannerWrapper = styled('div')`
  position: relative;
  width: 160px;
  height: 32px;
  padding: 0 4px;

  @media (min-width: 360px) {
    width: 240px;
    height: 48px;
    padding: 0 8px;
  }

  @media (min-width: 768px) {
    width: 360px;
    height: 72px;
    padding: 0 12px;
  }

  @media (min-width: 1024px) {
    width: 480px;
    height: 96px;
    padding: 0 16px;
  }
`

export const NavigationBar: FC = () => {
  const router = useRouter()
  return (
    <NavigationBarContainer>
      <TitleBannerWrapper>
        <Image
          className="object-contain cursor-pointer"
          src={'/images/title_banner.png'}
          alt={'Title banner'}
          priority
          fill
          onClick={() => {
            router.push('/')
          }}
        />
      </TitleBannerWrapper>
      <div>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => {
            router.push('/moves/fast')
          }}
        >
          Fast Moves
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            router.push('/moves/charged')
          }}
        >
          Charge Moves
        </Button>
      </div>
    </NavigationBarContainer>
  )
}
