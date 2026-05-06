export interface PuzzleMove {
  iccs: string
  notation: string
  isCorrect: boolean
  comment: string
}

export interface Puzzle {
  id: string
  name: string
  description: string
  initialFen: string
  moves: PuzzleMove[]
  playerColor: 'r' | 'b'
  difficulty: number  // 1-5
  category: string
  tags: string[]
}

export interface PuzzleCategory {
  id: string
  name: string
  nameEn: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  puzzles: Puzzle[]
}

export interface PuzzleProgress {
  puzzleId: string
  completed: boolean
  attempts: number
  bestTimeMs: number | null
  lastAttemptedAt: string | null
}
