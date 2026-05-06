import type { PieceType, Color } from '../types/chess'

export const PIECE_CHARS: Record<PieceType, Record<Color, string>> = {
  K: { r: '帅', b: '将' },
  A: { r: '仕', b: '士' },
  E: { r: '相', b: '象' },
  R: { r: '车', b: '车' },
  C: { r: '炮', b: '炮' },
  H: { r: '马', b: '马' },
  P: { r: '兵', b: '卒' }
}

export const PIECE_VALUES: Record<PieceType, number> = {
  K: 10000,
  R: 900,
  C: 450,
  H: 400,
  E: 200,
  A: 200,
  P: 100
}

export const FEN_PIECE_MAP: Record<string, { type: PieceType; color: Color }> = {
  K: { type: 'K', color: 'r' },
  A: { type: 'A', color: 'r' },
  E: { type: 'E', color: 'r' },
  R: { type: 'R', color: 'r' },
  C: { type: 'C', color: 'r' },
  H: { type: 'H', color: 'r' },
  P: { type: 'P', color: 'r' },
  k: { type: 'K', color: 'b' },
  a: { type: 'A', color: 'b' },
  e: { type: 'E', color: 'b' },
  r: { type: 'R', color: 'b' },
  c: { type: 'C', color: 'b' },
  h: { type: 'H', color: 'b' },
  p: { type: 'P', color: 'b' }
}

export const PIECE_TO_FEN: Record<PieceType, Record<Color, string>> = {
  K: { r: 'K', b: 'k' },
  A: { r: 'A', b: 'a' },
  E: { r: 'E', b: 'e' },
  R: { r: 'R', b: 'r' },
  C: { r: 'C', b: 'c' },
  H: { r: 'H', b: 'h' },
  P: { r: 'P', b: 'p' }
}

// Chinese file numbers (from right side of each player's perspective)
export const RED_FILE_NAMES = ['九', '八', '七', '六', '五', '四', '三', '二', '一']
export const BLACK_FILE_NAMES = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

// Piece names used in notation
export const PIECE_NOTATION_NAMES: Record<PieceType, Record<Color, string>> = {
  K: { r: '帅', b: '将' },
  A: { r: '仕', b: '士' },
  E: { r: '相', b: '象' },
  R: { r: '车', b: '车' },
  C: { r: '炮', b: '炮' },
  H: { r: '马', b: '马' },
  P: { r: '兵', b: '卒' }
}

// Action verbs in notation
export const NOTATION_ACTIONS: Record<string, Record<Color, string>> = {
  forward: { r: '进', b: '进' },
  backward: { r: '退', b: '退' },
  horizontal: { r: '平', b: '平' }
}
