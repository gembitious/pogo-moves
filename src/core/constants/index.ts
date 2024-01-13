import { ChargedMove, ChargedMovePvE, FastMove, FastMovePvE } from '@core/types'
import { isChargedMove, isChargedMovePvE, isFastMove, isFastMovePvE } from '@core/utils'
import chargedMoves from '@data/charged_moves.json'
import pveChargedMoves from '@data/charged_moves_pve.json'
import fastMoves from '@data/fast_moves.json'
import pveFastMoves from '@data/fast_moves_pve.json'

export const pokemonType = {
  normal: 'normal',
  fire: 'fire',
  water: 'water',
  grass: 'grass',
  electric: 'electric',
  ice: 'ice',
  fighting: 'fighting',
  poison: 'poison',
  ground: 'ground',
  flying: 'flying',
  psychic: 'psychic',
  bug: 'bug',
  rock: 'rock',
  ghost: 'ghost',
  dragon: 'dragon',
  dark: 'dark',
  steel: 'steel',
  fairy: 'fairy',
}

export const pokemonTypeText = {
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

export const unreleasedMove = ['roar_of_time', 'spacial_rend']

export const getFastMoveData = (moves: object[]) => {
  const result: FastMove[] = []
  moves.map((move) => {
    if (isFastMove(move)) result.push(move)
  })
  return result
}

export const getChargedMoveData = (moves: object[]) => {
  const result: ChargedMove[] = []
  moves.map((move) => {
    if (isChargedMove(move) && !unreleasedMove.includes(move.id)) result.push(move)
  })
  return result
}
export const getFastMovePvEData = (moves: object[]) => {
  const result: FastMovePvE[] = []
  moves.map((move) => {
    if (isFastMovePvE(move)) result.push(move)
  })
  return result
}

export const getChargedMovePvEData = (moves: object[]) => {
  const result: ChargedMovePvE[] = []
  moves.map((move) => {
    if (isChargedMovePvE(move) && !unreleasedMove.includes(move.id)) result.push(move)
  })
  return result
}

export const fastMoveData: FastMove[] = getFastMoveData(fastMoves)
export const chargedMoveData: ChargedMove[] = getChargedMoveData(chargedMoves)
export const pveFastMoveData: FastMovePvE[] = getFastMovePvEData(pveFastMoves)
export const pveChargedMoveData: ChargedMovePvE[] = getChargedMovePvEData(pveChargedMoves)
