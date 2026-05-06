export interface GameMove {
  iccs: string
  notation: string
  fen: string
}

export interface GameRecord {
  id: string
  date: string
  redPlayer: string
  blackPlayer: string
  result: 'red_wins' | 'black_wins' | 'draw'
  initialFen: string
  moves: GameMove[]
  analysis: AnalysisResult | null
  engineSettings: {
    difficulty: number
    timeControl: string
  }
}

export interface GameFilters {
  dateFrom?: string
  dateTo?: string
  result?: string
  opponent?: string
  limit?: number
  offset?: number
}
