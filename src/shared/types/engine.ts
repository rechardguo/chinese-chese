export interface UCICommand {
  type: 'uci' | 'isready' | 'setoption' | 'position' | 'go' | 'stop' | 'quit'
  args?: string[]
}

export interface SearchResult {
  bestmove: string
  ponder?: string
  score?: number
  depth?: number
  pv?: string[]
}

export interface AnalysisUpdate {
  depth: number
  score: number
  scoreType: 'cp' | 'mate'
  nodes: number
  time: number
  pv: string[]
  multipv?: number
}

export interface EngineConfig {
  enginePath: string
  nnuePath: string
  skillLevel: number  // 1-20
  threads: number
  hashSize: number    // MB
}

export interface SearchOptions {
  depth?: number
  movetime?: number  // ms
  nodes?: number
}
