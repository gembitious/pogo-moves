'use client'

import { Button } from '@mui/material'
import { useRouter } from 'next/navigation'
import { FC } from 'react'

export const NavigationBar: FC = () => {
  const router = useRouter()
  return (
    <div className="h-16 flex justify-center items-center">
      <div className="px-4">POGO-MOVES</div>
      <div>
        <Button
          variant="outlined"
          onClick={() => {
            router.push('/moves/fast')
          }}
        >
          Fast Moves
        </Button>
        <Button
          onClick={() => {
            router.push('/moves/charge')
          }}
        >
          Charge Moves
        </Button>
      </div>
    </div>
  )
}
