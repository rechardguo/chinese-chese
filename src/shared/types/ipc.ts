import type { EngineConfig, SearchOptions, SearchResult, AnalysisUpdate } from './engine'
import type { GameRecord, GameFilters } from './game-record'
import type { PuzzleProgress } from './puzzle'
import type { AnalysisConfig, AnalysisProgress, AnalysisResult } from './ai-analysis'
import type { AppSettings } from './settings'
import type { OpeningCategory, PuzzleCategory } from './puzzle'

export const IPC_CHANNELS = {
  ENGINE_START: 'engine:start',
  ENGINE_STOP: 'engine:stop',
  ENGINE_IS_READY: 'engine:is-ready',
  ENGINE_GET_BEST_MOVE: 'engine:get-best-move',
  ENGINE_START_ANALYSIS: 'engine:start-analysis',
  ENGINE_STOP_ANALYSIS: 'engine:stop-analysis',
  ENGINE_ANALYSIS_UPDATE: 'engine:analysis-update',
  ENGINE_SET_OPTION: 'engine:set-option',
  ENGINE_CHECK_EXISTS: 'engine:check-exists',

  DB_SAVE_GAME: 'db:save-game',
  DB_LOAD_GAMES: 'db:load-games',
  DB_DELETE_GAME: 'db:delete-game',
  DB_GET_GAME: 'db:get-game',
  DB_SAVE_PUZZLE_PROGRESS: 'db:save-puzzle-progress',
  DB_LOAD_PUZZLE_PROGRESS: 'db:load-puzzle-progress',
  DB_SAVE_SETTINGS: 'db:save-settings',
  DB_LOAD_SETTINGS: 'db:load-settings',

  AI_ANALYZE_GAME: 'ai:analyze-game',
  AI_ANALYZE_PROGRESS: 'ai:analyze-progress',
  AI_TEST_CONNECTION: 'ai:test-connection',

  DATA_LOAD_OPENINGS: 'data:load-openings',
  DATA_LOAD_PUZZLES: 'data:load-puzzles',

  LAN_CREATE_ROOM: 'lan:create-room',
  LAN_JOIN_ROOM: 'lan:join-room',
  LAN_LEAVE_ROOM: 'lan:leave-room',
  LAN_SEND_MESSAGE: 'lan:send-message',
  LAN_OPPONENT_CONNECTED: 'lan:opponent-connected',
  LAN_OPPONENT_DISCONNECTED: 'lan:opponent-disconnected',
  LAN_MESSAGE_RECEIVED: 'lan:message-received'
} as const

export type LANMessage =
  | { type: 'move'; iccs: string }
  | { type: 'undo-request' }
  | { type: 'undo-accept' }
  | { type: 'undo-reject' }
  | { type: 'resign' }
  | { type: 'new-game' }
  | { type: 'chat'; text: string }

export interface ElectronAPI {
  engine: {
    start: (config: EngineConfig) => Promise<void>
    stop: () => Promise<void>
    isReady: () => Promise<boolean>
    getBestMove: (fen: string, options?: SearchOptions) => Promise<SearchResult>
    startAnalysis: (fen: string, multipv?: number) => Promise<void>
    stopAnalysis: () => Promise<void>
    onAnalysisUpdate: (cb: (data: AnalysisUpdate) => void) => () => void
    checkExists: () => Promise<boolean>
  }
  db: {
    saveGame: (game: GameRecord) => Promise<void>
    loadGames: (filters?: GameFilters) => Promise<GameRecord[]>
    deleteGame: (id: string) => Promise<void>
    getGame: (id: string) => Promise<GameRecord | null>
    savePuzzleProgress: (progress: PuzzleProgress) => Promise<void>
    loadPuzzleProgress: () => Promise<PuzzleProgress[]>
    saveSettings: (settings: AppSettings) => Promise<void>
    loadSettings: () => Promise<AppSettings | null>
  }
  ai: {
    analyzeGame: (game: GameRecord, config: AnalysisConfig) => Promise<AnalysisResult>
    onAnalyzeProgress: (cb: (data: AnalysisProgress) => void) => () => void
    testConnection: (config: AnalysisConfig) => Promise<boolean>
  }
  data: {
    loadOpenings: () => Promise<OpeningCategory[]>
    loadPuzzles: (categoryId?: string) => Promise<PuzzleCategory[]>
  }
  lan: {
    connect: (host: string, port?: number) => Promise<void>
    createRoom: (name?: string) => Promise<{ roomId: string }>
    joinRoom: (roomId: string) => Promise<void>
    leaveRoom: () => Promise<void>
    send: (msg: LANMessage) => void
    onOpponentConnected: (cb: () => void) => () => void
    onOpponentDisconnected: (cb: () => void) => () => void
    onMessage: (cb: (msg: LANMessage) => void) => () => void
    onRoomList: (cb: (rooms: { id: string; name: string; createdAt: number }[]) => void) => () => void
  }
  builtinAI: {
    getBestMove: (board: any[][], turn: string, difficulty: number) => Promise<{ from: { file: number; rank: number }; to: { file: number; rank: number } } | null>
  }
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
