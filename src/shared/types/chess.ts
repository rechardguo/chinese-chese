export type Color = 'r' | 'b'

export type PieceType = 'K' | 'A' | 'E' | 'R' | 'C' | 'H' | 'P'

export interface Piece {
  type: PieceType
  color: Color
}

export interface BoardPosition {
  file: number  // 0-8 (a-i)
  rank: number  // 0-9 (0=bottom/red side, 9=top/black side)
}

export interface Move {
  from: BoardPosition
  to: BoardPosition
  iccs: string       // e.g. "h2e2"
  notation: string   // e.g. "炮二平五"
  fen: string        // FEN after this move
  piece: Piece
  captured?: Piece
  san: string
}

export type GameStatus =
  | 'playing'
  | 'check'
  | 'checkmate'
  | 'stalemate'
  | 'draw'
  | 'resigned'
  | 'red_wins'
  | 'black_wins'

export interface GameState {
  fen: string
  turn: Color
  moves: Move[]
  status: GameStatus
  selectedPosition: BoardPosition | null
  legalMoves: string[]  // ICCS format legal moves for selected piece
}

export interface GameConfig {
  playerColor: Color
  engineDifficulty: number  // 1-20
  timeControl: TimeControl
}

export interface TimeControl {
  initialTime: number   // seconds
  increment: number     // seconds per move
}

export const INITIAL_FEN = 'rheakaehr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RHEAKAEHR w - - 0 1'
