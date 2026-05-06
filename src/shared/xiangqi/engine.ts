/**
 * Xiangqi (Chinese Chess) Engine - Pure TypeScript implementation
 * Provides move generation, validation, check/checkmate detection, and FEN handling.
 */
import type { Color, PieceType, Piece, BoardPosition, Move, GameStatus } from '../types/chess'
import { PIECE_CHARS, FEN_PIECE_MAP, PIECE_TO_FEN, PIECE_NOTATION_NAMES, RED_FILE_NAMES, BLACK_FILE_NAMES } from '../constants/pieces'

type Board = (Piece | null)[][]

export class XiangqiEngine {
  board: Board
  turn: Color
  moveHistory: Move[]
  halfmoveClock: number
  fullmoveNumber: number
  gameOver: boolean
  winner: Color | null

  constructor(fen: string = 'rheakaehr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RHEAKAEHR w - - 0 1') {
    this.board = this.createEmptyBoard()
    this.turn = 'r'
    this.moveHistory = []
    this.halfmoveClock = 0
    this.fullmoveNumber = 1
    this.gameOver = false
    this.winner = null
    this.loadFEN(fen)
  }

  private createEmptyBoard(): Board {
    return Array.from({ length: 10 }, () => Array(9).fill(null))
  }

  getFEN(): string {
    const rows: string[] = []
    for (let rank = 9; rank >= 0; rank--) {
      let empty = 0
      let row = ''
      for (let file = 0; file < 9; file++) {
        const piece = this.board[rank][file]
        if (!piece) {
          empty++
        } else {
          if (empty > 0) { row += empty; empty = 0 }
          row += PIECE_TO_FEN[piece.type][piece.color]
        }
      }
      if (empty > 0) row += empty
      rows.push(row)
    }
    return `${rows.join('/')} ${this.turn === 'r' ? 'w' : 'b'} - - ${this.halfmoveClock} ${this.fullmoveNumber}`
  }

  loadFEN(fen: string): void {
    this.board = this.createEmptyBoard()
    const parts = fen.split(' ')
    const rows = parts[0].split('/')
    for (let ri = 0; ri < rows.length; ri++) {
      const rank = 9 - ri
      let file = 0
      for (const ch of rows[ri]) {
        if (ch >= '1' && ch <= '9') {
          file += parseInt(ch)
        } else {
          const info = FEN_PIECE_MAP[ch]
          if (info) {
            this.board[rank][file] = { type: info.type, color: info.color }
          }
          file++
        }
      }
    }
    this.turn = parts[1] === 'b' ? 'b' : 'r'
    this.halfmoveClock = parseInt(parts[4] || '0')
    this.fullmoveNumber = parseInt(parts[5] || '1')
  }

  getPiece(pos: BoardPosition): Piece | null {
    return this.board[pos.rank]?.[pos.file] ?? null
  }

  getKingPosition(color: Color): BoardPosition | null {
    for (let rank = 0; rank <= 9; rank++) {
      for (let file = 0; file <= 8; file++) {
        const p = this.board[rank][file]
        if (p && p.type === 'K' && p.color === color) return { file, rank }
      }
    }
    return null
  }

  isInCheck(color: Color): boolean {
    const kingPos = this.getKingPosition(color)
    if (!kingPos) return false
    const opponent: Color = color === 'r' ? 'b' : 'r'
    return this.isSquareAttacked(kingPos, opponent)
  }

  isSquareAttacked(pos: BoardPosition, byColor: Color): boolean {
    // Check all opponent pieces
    for (let rank = 0; rank <= 9; rank++) {
      for (let file = 0; file <= 8; file++) {
        const piece = this.board[rank][file]
        if (piece && piece.color === byColor) {
          if (this.canPieceAttack({ file, rank }, pos, piece)) return true
        }
      }
    }
    return false
  }

  private canPieceAttack(from: BoardPosition, to: BoardPosition, piece: Piece): boolean {
    const df = to.file - from.file
    const dr = to.rank - from.rank
    const af = Math.abs(df)
    const ar = Math.abs(dr)

    switch (piece.type) {
      case 'K':
        // King: one step orthogonally only (not diagonal)
        return (af + ar === 1) && this.inPalace(to, piece.color)
      case 'A':
        return af === 1 && ar === 1 && this.inPalace(to, piece.color)
      case 'E':
        if (af !== 2 || ar !== 2) return false
        // Check blocking piece (elephant eye)
        const eyeFile = from.file + df / 2
        const eyeRank = from.rank + dr / 2
        if (this.board[eyeRank][eyeFile]) return false
        return !this.crossedRiver(to, piece.color)
      case 'H':
        // Horse: L-shape, check leg blocking
        if (!((af === 1 && ar === 2) || (af === 2 && ar === 1))) return false
        // Check blocking leg
        if (af === 2) {
          if (this.board[from.rank][from.file + df / 2]) return false
        } else {
          if (this.board[from.rank + dr / 2][from.file]) return false
        }
        return true
      case 'R':
        if (df !== 0 && dr !== 0) return false
        return this.isPathClear(from, to)
      case 'C':
        if (df !== 0 && dr !== 0) return false
        const count = this.countBetween(from, to)
        const target = this.board[to.rank][to.file]
        if (target) return count === 1  // capture: exactly one piece between
        return count === 0  // move: no pieces between
      case 'P':
        if (piece.color === 'r') {
          if (this.crossedRiver(from, 'r')) {
            // Crossed river: can move forward, left, or right
            return (dr === 1 && df === 0) || (dr === 0 && af === 1)
          }
          return dr === 1 && df === 0  // Before river: forward only
        } else {
          if (this.crossedRiver(from, 'b')) {
            return (dr === -1 && df === 0) || (dr === 0 && af === 1)
          }
          return dr === -1 && df === 0
        }
      default:
        return false
    }
  }

  private inPalace(pos: BoardPosition, color: Color): boolean {
    if (pos.file < 3 || pos.file > 5) return false
    if (color === 'r') return pos.rank >= 0 && pos.rank <= 2
    return pos.rank >= 7 && pos.rank <= 9
  }

  private crossedRiver(pos: BoardPosition, color: Color): boolean {
    return color === 'r' ? pos.rank >= 5 : pos.rank <= 4
  }

  private isPathClear(from: BoardPosition, to: BoardPosition): boolean {
    const df = Math.sign(to.file - from.file)
    const dr = Math.sign(to.rank - from.rank)
    let f = from.file + df
    let r = from.rank + dr
    while (f !== to.file || r !== to.rank) {
      if (this.board[r][f]) return false
      f += df
      r += dr
    }
    return true
  }

  private countBetween(from: BoardPosition, to: BoardPosition): number {
    const df = Math.sign(to.file - from.file)
    const dr = Math.sign(to.rank - from.rank)
    let count = 0
    let f = from.file + df
    let r = from.rank + dr
    while (f !== to.file || r !== to.rank) {
      if (this.board[r][f]) count++
      f += df
      r += dr
    }
    return count
  }

  getLegalMoves(pos: BoardPosition): BoardPosition[] {
    const piece = this.getPiece(pos)
    if (!piece || piece.color !== this.turn) return []

    const moves: BoardPosition[] = []
    for (let rank = 0; rank <= 9; rank++) {
      for (let file = 0; file <= 8; file++) {
        const target = this.board[rank][file]
        // Can't capture own piece
        if (target && target.color === piece.color) continue
        if (this.isMoveLegal(pos, { file, rank }, piece)) {
          moves.push({ file, rank })
        }
      }
    }
    return moves
  }

  private isMoveLegal(from: BoardPosition, to: BoardPosition, piece: Piece): boolean {
    if (!this.canPieceAttack(from, to, piece)) return false
    // Simulate move and check if own king is in check
    const captured = this.board[to.rank][to.file]
    this.board[to.rank][to.file] = piece
    this.board[from.rank][from.file] = null
    const inCheck = this.isInCheck(piece.color)
    this.board[from.rank][from.file] = piece
    this.board[to.rank][to.file] = captured
    return !inCheck
  }

  getLegalMovesForColor(color: Color): { from: BoardPosition; to: BoardPosition }[] {
    const moves: { from: BoardPosition; to: BoardPosition }[] = []
    for (let rank = 0; rank <= 9; rank++) {
      for (let file = 0; file <= 8; file++) {
        const piece = this.board[rank][file]
        if (piece && piece.color === color) {
          const targets = this.getLegalMoves({ file, rank })
          for (const to of targets) {
            moves.push({ from: { file, rank }, to })
          }
        }
      }
    }
    return moves
  }

  makeMove(from: BoardPosition, to: BoardPosition): Move | null {
    const piece = this.getPiece(from)
    if (!piece || piece.color !== this.turn) return null
    if (!this.isMoveLegal(from, to, piece)) return null

    const captured = this.getPiece(to)
    const move: Move = {
      from,
      to,
      iccs: this.posToICCS(from) + this.posToICCS(to),
      notation: this.moveToNotation(from, to, piece, captured),
      fen: '',
      piece,
      captured: captured ?? undefined,
      san: this.posToICCS(from) + this.posToICCS(to)
    }

    // Execute move
    this.board[to.rank][to.file] = piece
    this.board[from.rank][from.file] = null

    // Update turn
    if (this.turn === 'b') this.fullmoveNumber++
    this.turn = this.turn === 'r' ? 'b' : 'r'

    // Update halfmove clock
    if (captured || piece.type === 'P') {
      this.halfmoveClock = 0
    } else {
      this.halfmoveClock++
    }

    move.fen = this.getFEN()
    this.moveHistory.push(move)

    // Check game end
    const opponentMoves = this.getLegalMovesForColor(this.turn)
    if (opponentMoves.length === 0) {
      this.gameOver = true
      if (this.isInCheck(this.turn)) {
        this.winner = this.turn === 'r' ? 'b' : 'r'
      }
    }

    return move
  }

  undoMove(): Move | null {
    if (this.moveHistory.length === 0) return null
    const lastMove = this.moveHistory.pop()!

    const { from, to, piece, captured } = lastMove
    this.board[from.rank][from.file] = piece
    this.board[to.rank][to.file] = captured ?? null

    this.turn = piece.color
    this.gameOver = false
    this.winner = null

    if (this.turn === 'b') this.fullmoveNumber--
    else this.fullmoveNumber++

    return lastMove
  }

  getStatus(): GameStatus {
    if (this.gameOver) {
      if (this.winner === 'r') return 'red_wins'
      if (this.winner === 'b') return 'black_wins'
      return 'draw'
    }
    if (this.isInCheck(this.turn)) return 'check'
    return 'playing'
  }

  getAllPieces(): { piece: Piece; position: BoardPosition }[] {
    const pieces: { piece: Piece; position: BoardPosition }[] = []
    for (let rank = 0; rank <= 9; rank++) {
      for (let file = 0; file <= 8; file++) {
        const piece = this.board[rank][file]
        if (piece) pieces.push({ piece, position: { file, rank } })
      }
    }
    return pieces
  }

  posToICCS(pos: BoardPosition): string {
    return String.fromCharCode(97 + pos.file) + pos.rank
  }

  iccsToPos(iccs: string): BoardPosition {
    return {
      file: iccs.charCodeAt(0) - 97,
      rank: parseInt(iccs[1])
    }
  }

  moveToNotation(from: BoardPosition, to: BoardPosition, piece: Piece, captured?: Piece | null): string {
    const pieceName = PIECE_NOTATION_NAMES[piece.type][piece.color]
    const color = piece.color

    // File number from the player's perspective
    // Both Red and Black number from their own right to their own left
    // Screen file 0 = Red's 九 / Black's 1, Screen file 8 = Red's 一 / Black's 9
    let fileNames = color === 'r' ? RED_FILE_NAMES : BLACK_FILE_NAMES
    let fromFileIndex = from.file
    let toFileIndex = to.file

    const fileStr = fileNames[fromFileIndex]

    // Determine action
    let action: string
    let target: string

    if (from.rank === to.rank) {
      action = '平'
      target = fileNames[toFileIndex]
    } else {
      const forward = (color === 'r' && to.rank > from.rank) || (color === 'b' && to.rank < from.rank)
      action = forward ? '进' : '退'
      // For R/C/P: target is file; for K/A/E/H: target is number of ranks
      if (['R', 'C', 'P'].includes(piece.type) && from.file !== to.file) {
        target = fileNames[toFileIndex]
      } else {
        target = String(Math.abs(to.rank - from.rank))
      }
    }

    return `${pieceName}${fileStr}${action}${target}`
  }
}
