import { NavigationBar } from '@components/NavigationBar'
import '@styles/globals.css'
import type { Metadata } from 'next'
// import Script from 'next/script'
import { FC, ReactNode } from 'react'
import ThemeRegistry from './ThemeRegistry'

export const metadata: Metadata = {
  title: 'POGO-MOVES',
  description: 'Pokemon GO Moves for GO Battle League',
}

const RootLayout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <html lang="ko">
      <body>
        <ThemeRegistry options={{ key: 'mui' }}>
          <div className="max-w-[1920px] m-auto flex flex-col">
            <NavigationBar />
            {children}
          </div>
        </ThemeRegistry>
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
