'use client'

import { Button, TextField } from '@mui/material'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { FC, useState } from 'react'

const HomePage: FC = () => {
  const router = useRouter()
  const [dexNum, setDexNum] = useState(0)
  return (
    <main className="">
      <div className="flex flex-col justify-center m-auto">
        <TextField
          variant="outlined"
          onChange={(e) => {
            const value = Number(e.target.value)
            if (Number(e.target.value) > 0) {
              setDexNum(value)
            }
          }}
        />
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
        <Image
          src={`/images/pokemon/${dexNum}.png`}
          alt={'pokemon sprite'}
          width={128}
          height={128}
        />
      </div>
    </main>
  )
}

export default HomePage
