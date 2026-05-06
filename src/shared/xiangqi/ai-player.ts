/**
 * Built-in Chinese Chess AI using minimax with alpha-beta pruning.
 * Used as fallback when external engine (Pikafish) is not available.
 */
import type { Color, BoardPosition, Piece } from '../types/chess'

type Board = (Piece | null)[][]

const PIECE_VALUES: Record<string, number> = {
  K: 10000, A: 120, E: 120, H: 270, R: 600, C: 285, P: 30
}

// Position bonus tables (from Red's perspective, rank 0 = Red's back rank)
const HORSE_POS = [
  [0,  -3,  5,   4,   2,   4,   5,  -3,   0],
  [0,   5,  8,  16,  12,  16,   8,   5,   0],
  [2,  8,  18, 22,  28,  22,  18,   8,   2],
  [0,   6, 16, 20,  24,  20,  16,   6,   0],
  [0,  12, 14, 20,  28,  20,  14,  12,  0],
  [0,  12, 14,  20,  28,  20,  14,  12,  0],
  [0,   6, 16,  20,  24,  20,  16,   6,   0],
  [2,   8, 18, 22,  28,  22,  18,   8,   2],
  [0,   5,  8,  16,  12,  16,   8,   5,   0],
  [0,  -3,  5,   4,   2,   4,   5,  -3,   0]
]

const ROOK_POS = [
  [6,   8,   8,  14,  14,  14,  14,   8,   6],
  [6,  10,  14,  14,  18,  14,  14,  10,   6],
  [6,  10,  14,  16,  20,  16,  14,  10,   6],
  [10,  14,  14,  20,  20,  20,  14,  14,  10],
  [12,  16,  20,  22,  22,  22,  20,  16,  12],
  [12,  16,  20,  22,  22,  22,  20,  16,  12],
  [10,  14,  14,  20,  20,  20,  14,  14,  10],
  [6,  10,  14,  16,  20,  16,  14,  10,   6],
  [6,  10,  14,  14,  18,  14,  14,  10,   6],
  [6,   8,   8,  14,  14,  14,  14,   8,   6]
]

const CANNON_POS = [
  [0,   0,   2,   6,   6,   6,   2,   0,   0],
  [0,   0,   2,   6,   12,  6,   2,   0,   0],
  [0,   0,   2,   8,   10,  8,   2,   0,   0],
  [0,   0,   2,   8,  12,  8,   2,   0,   0],
  [0,   2,   4,   10,  10,  10,   4,   2,   0],
  [0,   2,   4,  10,  10,  10,   4,   2,   0],
  [0,   0,   2,   8,  12,  8,   2,   0,   0],
  [0,   0,   2,   8,  10,  8,   2,   0,   0],
  [0,   0,   2,   6,   12,  6,   2,   0,   0],
  [0,   0,   0,   4,   4,   4,   0,   0,   0]
]

const PAWN_POS = [
  [0,   0,   0,   2,   6,   2,   0,   0,   0],
  [20,  0,  40,  50,  60,  50,  40,   0,  20],
  [20,  30,  50,  70,  80,  70,  50,  30,  20],
  [0,   20,  40,  60,  80,  60,  40,  20,   0],
  [0,   0,   20,  40,  60,  40,  20,   0,   0],
  [0,   0,   20,  40,  60,  40,   20,   0,   0],
  [0,   20,  40,  60,  80,  60,  40,  20,   0],
  [20,  30,  50,  70,  80,  70,  50,  30,  20],
  [20,  0,  40,  50,  60,  50,  40,   0,  20],
  [0,   0,   0,   2,   6,   2,   0,   0,   0]
]

function posBonus(type: string, file: number, rank: number, color: Color): number {
  let table: number[][]
  switch (type) {
    case 'H': table = HORSE_POS; break
    case 'R': table = ROOK_POS; break
    case 'C': table = CANNON_POS; break
    case 'P': table = PAWN_POS; break
    default: return 0
  }
  if (color === 'r') return table[9 - rank][file]
  return table[rank][8 - file]
}

export class AIPlayer {
  private difficulty: number // 1-20

  constructor(difficulty: number = 10) {
    this.difficulty = difficulty
  }

  getSearchDepth(): number {
    if (this.difficulty <= 3) return 2
    if (this.difficulty <= 7) return 3
    if (this.difficulty <= 12) return 3
    return 4
  }

  getRandomness(): number {
    if (this.difficulty <= 3) return 60
    if (this.difficulty <= 7) return 25
    if (this.difficulty <= 12) return 8
    return 2
  }

  findBestMove(board: Board, turn: Color): { from: BoardPosition; to: BoardPosition } | null {
    const moves = this.getAllMoves(board, turn)
    if (moves.length === 0) return null
    if (moves.length === 1) return moves[0]

    const depth = this.getSearchDepth()
    const noise = this.getRandomness()
    let bestScore = -Infinity
    let bestMoves: { from: BoardPosition; to: BoardPosition }[] = []

    // Shuffle for variety
    for (let i = moves.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[moves[i], moves[j]] = [moves[j], moves[i]]
    }

    for (const move of moves) {
      const captured = board[move.to.rank][move.to.file]
      const piece = board[move.from.rank][move.from.file]!
      board[move.to.rank][move.to.file] = piece
      board[move.from.rank][move.from.file] = null

      let score: number
      if (this.isInCheck(board, turn === 'r' ? 'b' : 'r')) {
        // Capturing king is the best move
        score = 100000 + PIECE_VALUES[captured?.type || 'P']
      } else {
        score = this.search(board, depth - 1, -Infinity, Infinity, false, turn)
      }

      board[move.from.rank][move.from.file] = piece
      board[move.to.rank][move.to.file] = captured

      score += (Math.random() - 0.5) * noise

      if (score > bestScore) {
        bestScore = score
        bestMoves = [move]
      } else if (Math.abs(score - bestScore) < noise) {
        bestMoves.push(move)
      }
    }

    return bestMoves[Math.floor(Math.random() * bestMoves.length)]
  }

  private search(board: Board, depth: number, alpha: number, beta: number, maximizing: boolean, aiColor: Color): number {
    if (depth === 0) return this.evaluate(board, aiColor)

    const color = maximizing ? aiColor : (aiColor === 'r' ? 'b' : 'r')
    const moves = this.getAllMoves(board, color)

    if (moves.length === 0) {
      return this.isInCheck(board, color) ? (-100000 + (this.getSearchDepth() - depth)) : 0
    }

    // Move ordering: captures first, then checks
    moves.sort((a, b) => {
      const aCap = board[a.to.rank][a.to.file]
      const bCap = board[b.to.rank][b.to.file]
      return (bCap ? PIECE_VALUES[bCap.type] : 0) - (aCap ? PIECE_VALUES[aCap.type] : 0)
    })

    if (maximizing) {
      let maxEval = -Infinity
      for (const move of moves) {
        const captured = board[move.to.rank][move.to.file]
        const piece = board[move.from.rank][move.from.file]!
        board[move.to.rank][move.to.file] = piece
        board[move.from.rank][move.from.file] = null

        const eval_ = this.search(board, depth - 1, alpha, beta, false, aiColor)
        maxEval = Math.max(maxEval, eval_)
        alpha = Math.max(alpha, eval_)

        board[move.from.rank][move.from.file] = piece
        board[move.to.rank][move.to.file] = captured

        if (beta <= alpha) break
      }
      return maxEval
    } else {
      let minEval = Infinity
      for (const move of moves) {
        const captured = board[move.to.rank][move.to.file]
        const piece = board[move.from.rank][move.from.file]!
        board[move.to.rank][move.to.file] = piece
        board[move.from.rank][move.from.file] = null

        const eval_ = this.search(board, depth - 1, alpha, beta, true, aiColor)
        minEval = Math.min(minEval, eval_)
        beta = Math.min(beta, eval_)

        board[move.from.rank][move.from.file] = piece
        board[move.to.rank][move.to.file] = captured

        if (beta <= alpha) break
      }
      return minEval
    }
  }

  private evaluate(board: Board, aiColor: Color): number {
    let score = 0
    const oppColor: Color = aiColor === 'r' ? 'b' : 'r'

    for (let rank = 0; rank <= 9; rank++) {
      for (let file = 0; file <= 8; file++) {
        const piece = board[rank][file]
        if (!piece) continue

        const val = PIECE_VALUES[piece.type] + posBonus(piece.type, file, rank, piece.color)
        if (piece.color === aiColor) {
          score += val
        } else {
          score -= val
        }
      }
    }

    // Mobility bonus (simplified)
    const aiMoves = this.getAllMoves(board, aiColor).length
    const oppMoves = this.getAllMoves(board, oppColor).length
    score += (aiMoves - oppMoves) * 2

    return score
  }

  getAllMoves(board: Board, color: Color): { from: BoardPosition; to: BoardPosition }[] {
    const moves: { from: BoardPosition; to: BoardPosition }[] = []

    for (let rank = 0; rank <= 9; rank++) {
      for (let file = 0; file <= 8; file++) {
        const piece = board[rank][file]
        if (!piece || piece.color !== color) continue
        const targets = this.getLegalMoves(board, { file, rank }, piece)
        for (const to of targets) {
          moves.push({ from: { file, rank }, to })
        }
      }
    }
    return moves
  }

  getLegalMoves(board: Board, from: BoardPosition, piece: Piece): BoardPosition[] {
    const moves: BoardPosition[] = []
    for (let rank = 0; rank <= 9; rank++) {
      for (let file = 0; file <= 8; file++) {
        const target = board[rank][file]
        if (target && target.color === piece.color) continue
        if (this.canMove(board, from, { file, rank }, piece)) {
          moves.push({ file, rank })
        }
      }
    }
    return moves
  }

  private canMove(board: Board, from: BoardPosition, to: BoardPosition, piece: Piece): boolean {
    const df = to.file - from.file
    const dr = to.rank - from.rank
    const af = Math.abs(df)
    const ar = Math.abs(dr)

    switch (piece.type) {
      case 'K':
        if (af + ar !== 1) return false
        return this.inPalace(board, to, piece.color)
      case 'A':
        if (af !== 1 || ar !== 1) return false
        return this.inPalace(board, to, piece.color)
      case 'E':
        if (af !== 2 || ar !== 2) return false
        if (board[from.rank + dr / 2][from.file + df / 2]) return false
        return !this.crossedRiver(to, piece.color)
      case 'H':
        if (!((af === 1 && ar === 2) || (af === 2 && ar === 1))) return false
        if (af === 2) {
          if (board[from.rank][from.file + df / 2]) return false
        } else {
          if (board[from.rank + dr / 2][from.file]) return false
        }
        return true
      case 'R':
        if (df !== 0 && dr !== 0) return false
        return this.isPathClear(board, from, to)
      case 'C':
        if (df !== 0 && dr !== 0) return false
        const count = this.countBetween(board, from, to)
        if (board[to.rank][to.file]) return count === 1
        return count === 0
      case 'P': {
        if (piece.color === 'r') {
          if (this.crossedRiver(from, 'r')) {
            return (dr === 1 && df === 0) || (dr === 0 && af === 1)
          }
          return dr === 1 && df === 0
        } else {
          if (this.crossedRiver(from, 'b')) {
            return (dr === -1 && df === 0) || (dr === 0 && af === 1)
          }
          return dr === -1 && df === 0
        }
      }
      default: return false
    }

    // Check move doesn't leave own king in check
    const target = board[to.rank][to.file]
    board[to.rank][to.file] = piece
    board[from.rank][from.file] = null
    const legal = !this.isInCheck(board, piece.color)
    board[from.rank][from.file] = piece
    board[to.rank][to.file] = target
    return legal
  }

  private isInCheck(board: Board, color: Color): boolean {
    // Find king
    let kingPos: BoardPosition | null = null
    for (let rank = 0; rank <= 9; rank++) {
      for (let file = 0; file <= 8; file++) {
        const p = board[rank][file]
        if (p && p.type === 'K' && p.color === color) {
          kingPos = { file, rank }; break
        }
      }
      if (kingPos) break
    }
    if (!kingPos) return true

    // Check flying general (two kings on same file with nothing between)
    const oppColor: Color = color === 'r' ? 'b' : 'r'
    for (let rank = 0; rank <= 9; rank++) {
      for (let file = 0; file <= 8; file++) {
        const p = board[rank][file]
        if (p && p.type === 'K' && p.color === oppColor && file === kingPos.file) {
          let blocked = false
          const minR = Math.min(rank, kingPos.rank)
          const maxR = Math.max(rank, kingPos.rank)
          for (let r = minR + 1; r < maxR; r++) {
            if (board[r][file]) { blocked = true; break }
          }
          if (!blocked) return true
        }
      }
    }

    // Check if any opponent piece attacks king
    for (let rank = 0; rank <= 9; rank++) {
      for (let file = 0; file <= 8; file++) {
        const p = board[rank][file]
        if (p && p.color === oppColor) {
          if (this.canAttack(board, { file, rank }, kingPos, p)) return true
        }
      }
    }
    return false
  }

  private canAttack(board: Board, from: BoardPosition, to: BoardPosition, piece: Piece): boolean {
    const df = to.file - from.file
    const dr = to.rank - from.rank
    const af = Math.abs(df)
    const ar = Math.abs(dr)

    switch (piece.type) {
      case 'K': return af + ar === 1 && this.inPalace(board, to, piece.color)
      case 'A': return af === 1 && ar === 1 && this.inPalace(board, to, piece.color)
      case 'E':
        if (af !== 2 || ar !== 2) return false
        return !board[from.rank + dr / 2][from.file + df / 2]
      case 'H':
        if (!((af === 1 && ar === 2) || (af === 2 && ar === 1))) return false
        if (af === 2) return !board[from.rank][from.file + df / 2]
        return !board[from.rank + dr / 2][from.file]
      case 'R':
        if (df !== 0 && dr !== 0) return false
        return this.isPathClear(board, from, to)
      case 'C':
        if (df !== 0 && dr !== 0) return false
        return this.countBetween(board, from, to) === (board[to.rank][to.file] ? 1 : 0)
      case 'P': {
        if (piece.color === 'r') {
          if (this.crossedRiver(from, 'r')) return (dr === 1 && df === 0) || (dr === 0 && af === 1)
          return dr === 1 && df === 0
        } else {
          if (this.crossedRiver(from, 'b')) return (dr === -1 && df === 0) || (dr === 0 && af === 1)
          return dr === -1 && df === 0
        }
      }
      default: return false
    }
  }

  private inPalace(board: Board, pos: BoardPosition, color: Color): boolean {
    if (pos.file < 3 || pos.file > 5) return false
    return color === 'r' ? (pos.rank >= 0 && pos.rank <= 2) : (pos.rank >= 7 && pos.rank <= 9)
  }

  private crossedRiver(pos: BoardPosition, color: Color): boolean {
    return color === 'r' ? pos.rank >= 5 : pos.rank <= 4
  }

  private isPathClear(board: Board, from: BoardPosition, to: BoardPosition): boolean {
    const df = Math.sign(to.file - from.file)
    const dr = Math.sign(to.rank - from.rank)
    let f = from.file + df, r = from.rank + dr
    while (f !== to.file || r !== to.rank) {
      if (board[r][f]) return false
      f += df; r += dr
    }
    return true
  }

  private countBetween(board: Board, from: BoardPosition, to: BoardPosition): number {
    const df = Math.sign(to.file - from.file)
    const dr = Math.sign(to.rank - from.rank)
    let count = 0
    let f = from.file + df, r = from.rank + dr
    while (f !== to.file || r !== to.rank) {
      if (board[r][f]) count++
      f += df; r += dr
    }
    return count
  }
}
