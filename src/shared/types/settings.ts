export interface AppSettings {
  engine: EngineSettings
  aiServices: AIServiceSettings[]
  ui: UISettings
}

export interface EngineSettings {
  enginePath: string
  nnuePath: string
  skillLevel: number
  threads: number
  hashSize: number
}

export interface AIServiceSettings {
  id: string
  name: string
  provider: string
  model: string
  apiKey: string
  baseUrl: string
  isActive: boolean
}

export interface UISettings {
  theme: 'light' | 'dark'
  boardStyle: 'wooden' | 'classic' | 'minimal'
  showCoordinates: boolean
  showMoveHints: boolean
  animationSpeed: number
  language: 'zh' | 'en'
}

import type { AIProvider } from './ai-analysis'
