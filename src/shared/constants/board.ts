// Board dimensions
export const BOARD_FILES = 9    // a-i (columns)
export const BOARD_RANKS = 10   // 0-9 (rows)

// Rendering constants
export const CELL_SIZE = 72
export const PADDING = 72
export const PIECE_RADIUS = CELL_SIZE * 0.42

// Canvas size
export const BOARD_WIDTH = PADDING * 2 + CELL_SIZE * (BOARD_FILES - 1)
export const BOARD_HEIGHT = PADDING * 2 + CELL_SIZE * (BOARD_RANKS - 1)

// River position (between rank 4 and rank 5)
export const RIVER_TOP = PADDING + 4 * CELL_SIZE
export const RIVER_BOTTOM = PADDING + 5 * CELL_SIZE

// Palace positions
export const RED_PALACE = [
  { file: 3, rank: 0 }, { file: 5, rank: 0 },
  { file: 4, rank: 1 },
  { file: 3, rank: 2 }, { file: 5, rank: 2 }
] as const

export const BLACK_PALACE = [
  { file: 3, rank: 7 }, { file: 5, rank: 7 },
  { file: 4, rank: 8 },
  { file: 3, rank: 9 }, { file: 5, rank: 9 }
] as const

// Starting positions for cross marks (cannon and pawn positions)
export const CROSS_MARK_POSITIONS = [
  // Cannon positions
  { file: 1, rank: 2 }, { file: 7, rank: 2 },
  { file: 1, rank: 7 }, { file: 7, rank: 7 },
  // Pawn positions (red)
  { file: 0, rank: 3 }, { file: 2, rank: 3 }, { file: 4, rank: 3 },
  { file: 6, rank: 3 }, { file: 8, rank: 3 },
  // Pawn positions (black)
  { file: 0, rank: 6 }, { file: 2, rank: 6 }, { file: 4, rank: 6 },
  { file: 6, rank: 6 }, { file: 8, rank: 6 }
] as const

export function boardToPixel(file: number, rank: number): { x: number; y: number } {
  return {
    x: PADDING + file * CELL_SIZE,
    y: PADDING + (9 - rank) * CELL_SIZE
  }
}

export function pixelToBoard(px: number, py: number): { file: number; rank: number } | null {
  const file = Math.round((px - PADDING) / CELL_SIZE)
  const rank = Math.round(((PADDING + 9 * CELL_SIZE) - py) / CELL_SIZE)
  if (file < 0 || file > 8 || rank < 0 || rank > 9) return null
  const { x, y } = boardToPixel(file, rank)
  if (Math.abs(px - x) > CELL_SIZE * 0.45 || Math.abs(py - y) > CELL_SIZE * 0.45) return null
  return { file, rank }
}
