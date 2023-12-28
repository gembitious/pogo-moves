'use client'

import Table, { TableHeadCell } from '@components/Table'
import { FastMoveData } from '@constants'
import { FastMove } from '@types'
import Image from 'next/image'
import { FC, useState } from 'react'

const headCells: TableHeadCell[] = [
  {
    id: 'name',
    label: 'Name',
  },
  {
    id: 'type',
    label: 'Type',
    disablePadding: true,
    cell: (data: FastMove) => (
      <Image src={`/images/types/${data.type}.png`} alt={data.type} width={24} height={24} />
    ),
  },
  {
    id: 'damage',
    label: 'Damage',
  },
  {
    id: 'energy',
    label: 'Energy',
  },
  {
    id: 'turn',
    label: 'Turn',
  },
  {
    id: 'dpt',
    label: 'DPT',
  },
  {
    id: 'ept',
    label: 'EPT',
  },
]

const defaultImageSrc = '/images/pokemon_background.png'

const FastMovesPage: FC = () => {
  const [dexImageSrc, setDexImageSrc] = useState(defaultImageSrc)
  const moveList = FastMoveData.map((move) => {
    const { id, power, energyGain, type, turn, name } = move
    return {
      id,
      name,
      type,
      damage: power,
      energy: energyGain,
      turn,
      dpt: Math.round((power / turn) * 100) / 100,
      ept: Math.round((energyGain / turn) * 100) / 100,
    }
  })
  return (
    <div className="flex flex-col justify-center items-center w-full m-auto px-4 md:px-6 lg:px-8">
      {/* <TextField
          variant="outlined"
          placeholder="도감번호 입력"
          type="number"
          onChange={(e) => {
            const value = Number(e.target.value)
            if (Number(e.target.value) > 0) {
              setDexImageSrc(`/images/pokemon/${value}.png`)
            } else {
              setDexImageSrc(defaultImageSrc)
            }
          }}
        /> */}
      <Table
        headCells={headCells}
        dataSource={moveList}
        title="Fast Moves"
        wrapperClassName="w-full"
        size="small"
      />
    </div>
  )
}

export default FastMovesPage
