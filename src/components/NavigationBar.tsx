'use client'

import { getDictionary } from '@core/constants/dictionary'
import { Locale } from '@core/types/i18n-config'
import { redirectedPathname } from '@core/utils'
import { styled } from '@mui/material'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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

export const NavigationBar: FC<{
  locale: Locale
}> = ({ locale }) => {
  const router = useRouter()
  const pathname = usePathname()
  const dictionary = getDictionary(locale)
  return (
    <NavigationBarContainer>
      <TitleBannerWrapper>
        <Image
          className="object-contain cursor-pointer"
          src="/images/title_banner.png"
          alt="Title banner"
          priority
          fill
          onClick={() => {
            router.push('/')
          }}
        />
      </TitleBannerWrapper>
      <div className="max-w-[480px] flex gap-2 scroll-hidden overflow-scroll">
        <Button
          variant="contained"
          color="secondary"
          className="static-text"
          onClick={() => {
            router.push(redirectedPathname('/moves/fast', locale))
          }}
        >
          {dictionary.common.fastMove}
        </Button>
        <Button
          variant="contained"
          color="secondary"
          className="static-text"
          onClick={() => {
            router.push(redirectedPathname('/moves/charged', locale))
          }}
        >
          {dictionary.common.chargedMove}
        </Button>
        <Button
          variant="contained"
          color="secondary"
          className="static-text"
          onClick={() => {
            router.push(redirectedPathname('/type', locale))
          }}
        >
          {dictionary.common.typeChart}
        </Button>
        <div className="flex flex-col gap-2">
          <Link href={{ pathname: redirectedPathname(pathname, 'ko') }} replace>
            <Image src="/country/kr.svg" width={24} height={16} alt="kr" />
          </Link>
          <Link href={{ pathname: redirectedPathname(pathname, 'en') }} replace>
            <Image src="/country/en.svg" width={24} height={16} alt="en" />
          </Link>
        </div>
      </div>
    </NavigationBarContainer>
  )
}
