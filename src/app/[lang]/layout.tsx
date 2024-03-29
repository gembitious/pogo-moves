import { AppWrapper, Header, MainContainer, MainWrapper } from '@components/GlobalLayout'
import { NavigationBar } from '@components/NavigationBar'
import GlobalLoadingPanelProvider from '@components/provider/GlobalLoadingPanelProvider'
import { NextPageStaticParams } from '@core/types'
import { i18n } from '@core/types/i18n-config'
import { ThemeProvider } from '@mui/material'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import '@styles/globals.css'
import theme from '@styles/theme'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata } from 'next'
import { FC, ReactNode } from 'react'
// import Script from 'next/script'

export const metadata: Metadata = {
  title: 'POGO-MOVES',
  description: 'Pokemon GO Moves for GO Battle League',
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({
    lang: locale,
  }))
}

const RootLayout: FC<{
  children: ReactNode
  params: NextPageStaticParams
}> = ({ children, params }) => {
  return (
    <html lang={params.lang}>
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <GlobalLoadingPanelProvider>
              <AppWrapper>
                <div className="w-full h-full">
                  <NavigationBar locale={params.lang} />
                  <div className="h-full">
                    <Header />
                    <MainWrapper>
                      <MainContainer>{children}</MainContainer>
                    </MainWrapper>
                  </div>
                </div>
              </AppWrapper>
            </GlobalLoadingPanelProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
        <SpeedInsights />
        <Analytics />
      </body>
      {/* <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2255003690265274"
        crossOrigin="anonymous"
      ></Script> */}
    </html>
  )
}

export default RootLayout
