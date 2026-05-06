import { create } from 'zustand'
import type { BoardPosition, Move, Color } from '@shared/types/chess'
import { XiangqiEngine } from '@shared/xiangqi/engine'
import type { Puzzle, PuzzleCategory, PuzzleProgress, PuzzleMove } from '@shared/types/puzzle'
import { puzzleCategories } from '@shared/data/puzzles'

type PuzzleView = 'categories' | 'puzzle-list' | 'solving'

interface PuzzleState {
  view: PuzzleView
  selectedCategoryId: string | null
  selectedPuzzle: Puzzle | null

  engine: XiangqiEngine
  pieces: { piece: import('@shared/types/chess').Piece; position: BoardPosition }[]
  selectedPosition: BoardPosition | null
  legalMoves: BoardPosition[]
  lastMove: Move | null
  turn: Color
  isCheck: boolean

  currentMoveStep: number
  isSolved: boolean
  isWrongMove: boolean
  isShowingHint: boolean
  hintMove: PuzzleMove | null
  startTime: number | null
  moveHistory: Move[]

  progressMap: Record<string, PuzzleProgress>

  setView: (view: PuzzleView) => void
  selectCategory: (categoryId: string) => void
  startPuzzle: (puzzle: Puzzle) => void
  handleSquareClick: (pos: BoardPosition) => void
  resetPuzzle: () => void
  undoStep: () => void
  showHint: () => void
  hideHint: () => void
  goNextPuzzle: () => void
  goBack: () => void
  loadProgress: () => void
  saveProgress: (puzzleId: string, completed: boolean) => void
}

function loadProgressFromStorage(): Record<string, PuzzleProgress> {
  try {
    const raw = localStorage.getItem('puzzle-progress')
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return {}
}

function saveProgressToStorage(map: Record<string, PuzzleProgress>) {
  try {
    localStorage.setItem('puzzle-progress', JSON.stringify(map))
  } catch { /* ignore */ }
}

export const usePuzzleStore = create<PuzzleState>((set, get) => ({
  view: 'categories' as PuzzleView,
  selectedCategoryId: null,
  selectedPuzzle: null,

  engine: new XiangqiEngine(),
  pieces: [],
  selectedPosition: null,
  legalMoves: [],
  lastMove: null,
  turn: 'r',
  isCheck: false,

  currentMoveStep: 0,
  isSolved: false,
  isWrongMove: false,
  isShowingHint: false,
  hintMove: null,
  startTime: null,
  moveHistory: [],

  progressMap: loadProgressFromStorage(),

  setView: (view) => set({ view }),

  selectCategory: (categoryId) => {
    set({ selectedCategoryId: categoryId, view: 'puzzle-list' })
  },

  startPuzzle: (puzzle) => {
    const engine = new XiangqiEngine(puzzle.initialFen)
    set({
      selectedPuzzle: puzzle,
      view: 'solving',
      engine,
      pieces: engine.getAllPieces(),
      selectedPosition: null,
      legalMoves: [],
      lastMove: null,
      turn: engine.turn,
      isCheck: engine.isInCheck(engine.turn),
      currentMoveStep: 0,
      isSolved: false,
      isWrongMove: false,
      isShowingHint: false,
      hintMove: null,
      startTime: Date.now(),
      moveHistory: []
    })
  },

  handleSquareClick: (pos) => {
    const { selectedPuzzle, currentMoveStep, isSolved, engine, selectedPosition, turn } = get()
    if (!selectedPuzzle || isSolved) return
    if (currentMoveStep >= selectedPuzzle.moves.length) return
    if (turn !== selectedPuzzle.playerColor) return

    const clickedPiece = engine.getPiece(pos)

    if (selectedPosition) {
      if (clickedPiece && clickedPiece.color === turn) {
        set({ selectedPosition: pos, legalMoves: engine.getLegalMoves(pos) })
        return
      }

      const move = engine.makeMove(selectedPosition, pos)
      if (!move) {
        set({ selectedPosition: null, legalMoves: [] })
        return
      }

      const attemptedIccs = move.iccs
      const expectedMove = selectedPuzzle.moves[currentMoveStep]

      if (attemptedIccs === expectedMove.iccs) {
        const newMoveHistory = [...get().moveHistory, move]
        const nextStep = currentMoveStep + 1
        const newPieces = engine.getAllPieces()
        const newTurn = engine.turn
        const newIsCheck = engine.isInCheck(newTurn)

        set({
          moveHistory: newMoveHistory,
          currentMoveStep: nextStep,
          lastMove: move,
          selectedPosition: null,
          legalMoves: [],
          pieces: newPieces,
          turn: newTurn,
          isCheck: newIsCheck,
          isWrongMove: false,
          isShowingHint: false,
          hintMove: null
        })

        if (nextStep >= selectedPuzzle.moves.length) {
          set({ isSolved: true })
          get().saveProgress(selectedPuzzle.id, true)
          return
        }

        // Auto-play opponent's response (odd step index)
        if (nextStep % 2 === 1) {
          const opponentMove = selectedPuzzle.moves[nextStep]
          const from = engine.iccsToPos(opponentMove.iccs.substring(0, 2))
          const to = engine.iccsToPos(opponentMove.iccs.substring(2, 4))
          setTimeout(() => {
            const { engine: eng, moveHistory: hist, selectedPuzzle: sp } = get()
            if (!sp || !eng) return
            const autoMove = eng.makeMove(from, to)
            if (autoMove) {
              const afterStep = get().currentMoveStep + 1
              const newPieces2 = eng.getAllPieces()
              const newTurn2 = eng.turn
              const newCheck2 = eng.isInCheck(newTurn2)
              const finalHistory = [...hist, autoMove]

              set({
                moveHistory: finalHistory,
                currentMoveStep: afterStep,
                lastMove: autoMove,
                pieces: newPieces2,
                turn: newTurn2,
                isCheck: newCheck2
              })

              if (afterStep >= sp.moves.length) {
                set({ isSolved: true })
                get().saveProgress(sp.id, true)
              }
            }
          }, 400)
        }
      } else {
        engine.undoMove()
        set({
          isWrongMove: true,
          selectedPosition: null,
          legalMoves: [],
          pieces: engine.getAllPieces()
        })
        setTimeout(() => set({ isWrongMove: false }), 1500)
        get().saveProgress(selectedPuzzle.id, false)
      }
      return
    }

    if (clickedPiece && clickedPiece.color === turn) {
      set({ selectedPosition: pos, legalMoves: engine.getLegalMoves(pos) })
    }
  },

  resetPuzzle: () => {
    const { selectedPuzzle } = get()
    if (selectedPuzzle) get().startPuzzle(selectedPuzzle)
  },

  undoStep: () => {
    const { engine, currentMoveStep, moveHistory, selectedPuzzle } = get()
    if (!selectedPuzzle || currentMoveStep === 0) return

    // If opponent just auto-played, undo 2 moves (player + opponent)
    // Otherwise undo 1 move (just the player's move)
    const undoCount = currentMoveStep % 2 === 0 ? 2 : 1
    for (let i = 0; i < undoCount; i++) {
      if (engine.moveHistory.length > 0) engine.undoMove()
    }
    const newStep = currentMoveStep - undoCount
    const newHistory = moveHistory.slice(0, -undoCount)

    set({
      currentMoveStep: Math.max(0, newStep),
      moveHistory: newHistory,
      selectedPosition: null,
      legalMoves: [],
      isSolved: false,
      isShowingHint: false,
      hintMove: null,
      pieces: engine.getAllPieces(),
      turn: engine.turn,
      isCheck: engine.isInCheck(engine.turn),
      lastMove: newHistory.length > 0 ? newHistory[newHistory.length - 1] : null
    })
  },

  showHint: () => {
    const { selectedPuzzle, currentMoveStep } = get()
    if (!selectedPuzzle || currentMoveStep >= selectedPuzzle.moves.length) return
    set({
      isShowingHint: true,
      hintMove: selectedPuzzle.moves[currentMoveStep]
    })
  },

  hideHint: () => set({ isShowingHint: false, hintMove: null }),

  goNextPuzzle: () => {
    const { selectedPuzzle, selectedCategoryId } = get()
    if (!selectedPuzzle || !selectedCategoryId) return
    const category = puzzleCategories.find(c => c.id === selectedCategoryId)
    if (!category) return
    const idx = category.puzzles.findIndex(p => p.id === selectedPuzzle.id)
    if (idx >= 0 && idx < category.puzzles.length - 1) {
      get().startPuzzle(category.puzzles[idx + 1])
    }
  },

  goBack: () => {
    set({ view: 'puzzle-list', selectedPuzzle: null })
  },

  loadProgress: () => {
    set({ progressMap: loadProgressFromStorage() })
  },

  saveProgress: (puzzleId, completed) => {
    const { progressMap, startTime } = get()
    const existing = progressMap[puzzleId]
    const elapsed = startTime ? Date.now() - startTime : null

    const updated: PuzzleProgress = {
      puzzleId,
      completed: completed || existing?.completed || false,
      attempts: (existing?.attempts ?? 0) + 1,
      bestTimeMs: completed && elapsed
        ? (existing?.bestTimeMs ? Math.min(existing.bestTimeMs, elapsed) : elapsed)
        : existing?.bestTimeMs ?? null,
      lastAttemptedAt: new Date().toISOString()
    }

    const newMap = { ...progressMap, [puzzleId]: updated }
    set({ progressMap: newMap })
    saveProgressToStorage(newMap)
  }
}))
