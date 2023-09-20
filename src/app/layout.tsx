import { NavigationBar } from '@components/NavigationBar'
import '@styles/globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
// import Script from 'next/script'
import { FC, ReactNode } from 'react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'POGO-MOVES',
  description: 'Pokemon GO Moves for GO Battle League',
}

const RootLayout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <div className="max-w-[1920px] px-2 md:px-4 lg:px-8 m-auto flex flex-col">
          <NavigationBar />
          {children}
        </div>
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
