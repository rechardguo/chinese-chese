export type AIProvider = 'claude' | 'openai' | 'ollama'

export interface AIServiceConfig {
  provider: AIProvider
  model: string
  apiKey?: string
  baseUrl?: string
}

export interface AnalysisConfig {
  service: AIServiceConfig
  language: 'zh' | 'en'
  detailLevel: 'brief' | 'standard' | 'detailed'
}

export interface PositionCommentary {
  moveIndex: number
  iccs: string
  notation: string
  evaluation: 'brilliant' | 'good' | 'inaccuracy' | 'mistake' | 'blunder'
  engineScore: number
  commentary: string
  alternativeMoves?: string[]
}

export interface AnalysisResult {
  gameId: string
  positions: PositionCommentary[]
  overallCommentary: string
  summary: {
    totalMoves: number
    brilliant: number
    good: number
    inaccuracies: number
    mistakes: number
    blunders: number
    accuracy: number
  }
}

export interface AnalysisProgress {
  phase: 'preparing' | 'analyzing' | 'generating_commentary' | 'complete'
  currentMove: number
  totalMoves: number
  message: string
}
