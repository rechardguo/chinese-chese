import { create } from 'zustand'
import type { BoardPosition, Move, Color, GameConfig, GameStatus } from '@shared/types/chess'
import { XiangqiEngine, INITIAL_FEN } from '@shared'

interface GameState {
  engine: XiangqiEngine
  fen: string
  turn: Color
  status: GameStatus
  moves: Move[]
  selectedPosition: BoardPosition | null
  legalMoves: BoardPosition[]
  currentMoveIndex: number
  gameMode: 'pvp' | 'pve' | 'lan'
  config: GameConfig
  pieces: { piece: import('@shared/types/chess').Piece; position: BoardPosition }[]
  isCheck: boolean
  engineThinking: boolean
  playerColor: Color
  lanConnected: boolean
  isSpectator: boolean
  lanRoomInfo: { ip: string; port: number } | null
  boardStyle: 'wooden' | 'classic' | 'minimal'
  showCoords: boolean

  initNewGame: (mode?: 'pvp' | 'pve' | 'lan', config?: Partial<GameConfig>) => void
  handleSquareClick: (pos: BoardPosition) => void
  handleRemoteMove: (iccs: string) => void
  undoMove: () => void
  goToMove: (index: number) => void
  requestEngineMove: () => void
  setEngineThinking: (thinking: boolean) => void
  setLanConnected: (connected: boolean) => void
  setLanRoomInfo: (info: { ip: string; port: number } | null) => void
  setBoardStyle: (style: 'wooden' | 'classic' | 'minimal') => void
  setShowCoords: (show: boolean) => void
  setIsSpectator: (v: boolean) => void
  resign: () => void
}

export const useGameStore = create<GameState>((set, get) => ({
  engine: new XiangqiEngine(INITIAL_FEN),
  fen: INITIAL_FEN,
  turn: 'r',
  status: 'playing',
  moves: [],
  selectedPosition: null,
  legalMoves: [],
  currentMoveIndex: -1,
  gameMode: 'pvp',
  config: {
    playerColor: 'r',
    engineDifficulty: 10,
    timeControl: { initialTime: 600, increment: 0 }
  },
  pieces: [],
  isCheck: false,
  engineThinking: false,
  playerColor: 'r',
  lanConnected: false,
  isSpectator: false,
  lanRoomInfo: null,
  boardStyle: 'wooden' as 'wooden' | 'classic' | 'minimal',
  showCoords: true,

  initNewGame: (mode = 'pvp', config) => {
    const engine = new XiangqiEngine(INITIAL_FEN)
    const playerColor = config?.playerColor || 'r'
    set({
      engine,
      fen: INITIAL_FEN,
      turn: 'r',
      status: 'playing',
      moves: [],
      selectedPosition: null,
      legalMoves: [],
      currentMoveIndex: -1,
      gameMode: mode,
      config: { ...get().config, ...config },
      playerColor,
      pieces: engine.getAllPieces(),
      isCheck: false,
      engineThinking: false
    })

    if (mode === 'pve' && playerColor === 'b') {
      setTimeout(() => get().requestEngineMove(), 500)
    }
  },

  handleSquareClick: (pos) => {
    const { engine, selectedPosition, turn, gameMode, playerColor, engineThinking, lanConnected, isSpectator } = get()
    if (engine.gameOver) return
    if (isSpectator) return
    if (engineThinking) return
    if ((gameMode === 'pve' || gameMode === 'lan') && turn !== playerColor) return

    const clickedPiece = engine.getPiece(pos)

    if (selectedPosition) {
      if (clickedPiece && clickedPiece.color === turn) {
        const legalMoves = engine.getLegalMoves(pos)
        set({ selectedPosition: pos, legalMoves })
        return
      }

      const move = engine.makeMove(selectedPosition, pos)
      if (move) {
        const status = engine.getStatus()
        const newMoves = [...get().moves, move]
        set({
          fen: engine.getFEN(),
          turn: engine.turn,
          status,
          moves: newMoves,
          currentMoveIndex: newMoves.length - 1,
          selectedPosition: null,
          legalMoves: [],
          pieces: engine.getAllPieces(),
          isCheck: status === 'check'
        })

        if (gameMode === 'pve' && !engine.gameOver) {
          set({ engineThinking: true })
          setTimeout(() => get().requestEngineMove(), 300)
        }

        if (gameMode === 'lan' && lanConnected && window.api) {
          window.api.lan.send({ type: 'move', iccs: move.iccs })
        }
        return
      }

      set({ selectedPosition: null, legalMoves: [] })
      return
    }

    if (clickedPiece && clickedPiece.color === turn) {
      const legalMoves = engine.getLegalMoves(pos)
      set({ selectedPosition: pos, legalMoves })
    }
  },

  handleRemoteMove: (iccs) => {
    const { engine, moves } = get()
    console.log('[LAN] handleRemoteMove:', iccs, 'gameOver:', engine.gameOver)
    if (engine.gameOver) return
    const from = engine.iccsToPos(iccs.substring(0, 2))
    const to = engine.iccsToPos(iccs.substring(2, 4))
    console.log('[LAN] from:', from, 'to:', to)
    const move = engine.makeMove(from, to)
    console.log('[LAN] move result:', move)
    if (move) {
      const status = engine.getStatus()
      const newMoves = [...moves, move]
      set({
        fen: engine.getFEN(),
        turn: engine.turn,
        status,
        moves: newMoves,
        currentMoveIndex: newMoves.length - 1,
        selectedPosition: null,
        legalMoves: [],
        pieces: engine.getAllPieces(),
        isCheck: status === 'check'
      })
    }
  },

  resign: () => {
    const { turn, gameMode, lanConnected, isSpectator } = get()
    if (gameMode === 'lan' && lanConnected && !isSpectator && window.api) {
      window.api.lan.send({ type: 'resign' })
    }
    set({
      status: turn === 'r' ? 'black_wins' : 'red_wins'
    })
  },

  requestEngineMove: () => {
    const { engine, gameMode, config } = get()
    if (gameMode !== 'pve') return
    if (engine.gameOver) { set({ engineThinking: false }); return }

    const doMove = (from: BoardPosition, to: BoardPosition) => {
      const { engine: eng, moves: prevMoves } = get()
      if (eng.gameOver) { set({ engineThinking: false }); return }
      const move = eng.makeMove(from, to)
      if (move) {
        const status = eng.getStatus()
        const newMoves = [...prevMoves, move]
        set({
          fen: eng.getFEN(), turn: eng.turn, status,
          moves: newMoves, currentMoveIndex: newMoves.length - 1,
          selectedPosition: null, legalMoves: [],
          pieces: eng.getAllPieces(), isCheck: status === 'check',
          engineThinking: false
        })
      } else { set({ engineThinking: false }) }
    }

    window.api.builtinAI.getBestMove(engine.board, engine.turn, config.engineDifficulty)
      .then((result) => {
        if (result) doMove(result.from, result.to)
        else set({ engineThinking: false })
      })
      .catch(() => set({ engineThinking: false }))
  },

  undoMove: () => {
    const { engine, moves, gameMode } = get()
    if (moves.length === 0) return
    const undoCount = gameMode === 'pve' && moves.length >= 2 ? 2 : 1
    for (let i = 0; i < undoCount; i++) {
      if (moves.length > 0) engine.undoMove()
    }
    const newMoves = moves.slice(0, -undoCount)
    const status = engine.getStatus()
    set({
      fen: engine.getFEN(), turn: engine.turn, status,
      moves: newMoves, currentMoveIndex: newMoves.length - 1,
      selectedPosition: null, legalMoves: [],
      pieces: engine.getAllPieces(), isCheck: status === 'check',
      engineThinking: false
    })
  },

  goToMove: (index) => {
    const { engine, moves } = get()
    engine.loadFEN(INITIAL_FEN)
    for (let i = 0; i <= index; i++) {
      engine.makeMove(moves[i].from, moves[i].to)
    }
    const status = engine.getStatus()
    set({
      fen: engine.getFEN(), turn: engine.turn, status,
      currentMoveIndex: index,
      selectedPosition: null, legalMoves: [],
      pieces: engine.getAllPieces(), isCheck: status === 'check'
    })
  },

  setEngineThinking: (thinking) => { set({ engineThinking: thinking }) },
  setLanConnected: (connected) => { set({ lanConnected: connected }) },
  setLanRoomInfo: (info) => { set({ lanRoomInfo: info }) },
  setBoardStyle: (style) => { set({ boardStyle: style }) },
  setShowCoords: (show) => { set({ showCoords: show }) },
  setIsSpectator: (v: boolean) => { set({ isSpectator: v }) }
}))
