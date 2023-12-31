import chargedMoves from '@data/charged_moves.json'
import fastMoves from '@data/fast_moves.json'
import { ChargedMove, FastMove } from '@types'
import { isChargedMove, isFastMove } from '@utils'

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
    if (isFastMove(move)) {
      const { energyGain, power, turn } = move
      result.push({
        ...move,
        dpt: Math.round((power / turn) * 100) / 100,
        ept: Math.round((energyGain / turn) * 100) / 100,
      })
    }
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

export const FastMoveData: FastMove[] = getFastMoveData(fastMoves)
export const ChargedMoveData: ChargedMove[] = getChargedMoveData(chargedMoves)
