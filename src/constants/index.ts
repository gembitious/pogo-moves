import moves from '@data/moves.json'
import { ChargedMove, FastMove } from '@types'

export const pokemonType = {
  normal: '노말',
  fire: '불꽃',
  water: '물',
  grass: '풀',
  electric: '전기',
  ice: '얼음',
  fighting: '격투',
  poison: '독',
  ground: '땅',
  flying: '비행',
  psychic: '에스퍼',
  bug: '벌레',
  rock: '바위',
  ghost: '고스트',
  dragon: '드래곤',
  dark: '악',
  steel: '강철',
  fairy: '페어리',
}

const isFastMove = (target: any): target is FastMove =>
  typeof target == 'object' &&
  target.turn !== undefined &&
  target.energyGain !== undefined &&
  (target.power > 0 || target.energyGain > 0)

const isChargedMove = (target: any): target is ChargedMove =>
  typeof target == 'object' && target.energy !== undefined

const getFastMoveData = () => {
  const result: FastMove[] = []
  moves.map((move) => {
    if (isFastMove(move)) result.push(move)
  })
  return result
}

const getChargedMoveData = () => {
  const result: ChargedMove[] = []
  moves.map((move) => {
    if (isChargedMove(move)) result.push(move)
  })
  return result
}

export const FastMoveData: FastMove[] = getFastMoveData()
export const ChargedMoveData: ChargedMove[] = getChargedMoveData()
