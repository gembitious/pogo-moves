import { NavigationBar } from '@components/NavigationBar'
import { ThemeProvider } from '@mui/material'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import '@styles/globals.css'
import theme from '@styles/theme'
import type { Metadata } from 'next'
import { FC, ReactNode } from 'react'
// import Script from 'next/script'

export const metadata: Metadata = {
  title: 'POGO-MOVES',
  description: 'Pokemon GO Moves for GO Battle League',
}

const RootLayout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <html lang="ko">
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <div className="max-w-[1920px] m-auto flex flex-col">
              <NavigationBar />
              {children}
            </div>
          </ThemeProvider>
        </AppRouterCacheProvider>
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
