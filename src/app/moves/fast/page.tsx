'use client'

import Table, { TableHeadCell } from '@components/Table'
import { TextField } from '@mui/material'
import Image from 'next/image'
import { FC, useState } from 'react'

const headCells: TableHeadCell[] = [
  {
    id: 'name',
    numeric: false,
    disablePadding: false,
    label: 'Dessert (100g serving)',
  },
  {
    id: 'calories',
    numeric: true,
    disablePadding: false,
    label: 'Calories',
  },
  {
    id: 'fat',
    numeric: true,
    disablePadding: false,
    label: 'Fat (g)',
  },
  {
    id: 'carbs',
    numeric: true,
    disablePadding: false,
    label: 'Carbs (g)',
  },
  {
    id: 'protein',
    numeric: true,
    disablePadding: false,
    label: 'Protein (g)',
  },
]
const FastMovesPage: FC = () => {
  const [dexNum, setDexNum] = useState(0)
  return (
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
      {dexNum > 0 && (
        <Image
          src={`/images/pokemon/${dexNum}.png`}
          alt={'pokemon sprite'}
          width={128}
          height={128}
        />
      )}
      <Table headCells={headCells} />
    </div>
  )
}

export default FastMovesPage
