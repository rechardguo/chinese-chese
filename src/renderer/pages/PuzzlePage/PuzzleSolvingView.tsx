import { useState, useEffect } from 'react'
import { usePuzzleStore } from '../../stores/puzzleStore'
import ChessBoard from '../../components/ChessBoard/ChessBoard'

function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}.${Math.floor((ms % 1000) / 100)}秒`
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

export default function PuzzleSolvingView() {
  const {
    selectedPuzzle, pieces, selectedPosition, legalMoves, lastMove,
    turn, isCheck, currentMoveStep, isSolved, isWrongMove,
    isShowingHint, hintMove, moveHistory, startTime,
    handleSquareClick, resetPuzzle, undoStep, showHint, hideHint,
    goNextPuzzle, goBack
  } = usePuzzleStore()

  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!startTime || isSolved) return
    const timer = setInterval(() => setElapsed(Date.now() - startTime), 200)
    return () => clearInterval(timer)
  }, [startTime, isSolved])

  if (!selectedPuzzle) return null

  const playerMoveCount = Math.ceil(selectedPuzzle.moves.length / 2)
  const playerMovesDone = Math.ceil(currentMoveStep / 2)
  const isPlayerTurn = turn === selectedPuzzle.playerColor

  // Hint: override selected/legal to highlight the correct move
  const displaySelected = isShowingHint && hintMove && !isSolved
    ? selectedPuzzle.playerColor === 'r'
      ? { file: hintMove.iccs.charCodeAt(0) - 97, rank: parseInt(hintMove.iccs[1]) }
      : { file: hintMove.iccs.charCodeAt(0) - 97, rank: parseInt(hintMove.iccs[1]) }
    : selectedPosition

  const displayLegal = isShowingHint && hintMove && !isSolved
    ? [{ file: hintMove.iccs.charCodeAt(2) - 97, rank: parseInt(hintMove.iccs[3]) }]
    : legalMoves

  const difficultyStars = Array.from({ length: 5 }, (_, i) =>
    <span key={i} className={i < selectedPuzzle.difficulty ? 'text-yellow-400' : 'text-gray-200'}>★</span>
  )

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ← 返回
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-800">{selectedPuzzle.name}</h2>
            <p className="text-xs text-gray-400">{selectedPuzzle.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-0.5 text-sm">{difficultyStars}</div>
          <span className="text-sm text-gray-500">
            第 {playerMovesDone}/{playerMoveCount} 步
          </span>
          {!isSolved && (
            <span className="text-sm text-gray-400">{formatTime(elapsed)}</span>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Board area */}
        <div className="flex-1 flex items-center justify-center bg-gray-200 p-4 relative">
          {/* Wrong move overlay */}
          {isWrongMove && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-red-500 text-white px-4 py-2 rounded-full text-sm shadow-lg">
                走法错误，请重试
              </div>
            </div>
          )}

          {/* Solved overlay */}
          {isSolved && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-white px-6 py-4 rounded-lg shadow-xl border-2 border-green-200 text-center">
                <div className="text-xl font-bold text-green-600 mb-1">恭喜通关！</div>
                <div className="text-sm text-gray-500">
                  用时: {formatTime(elapsed)}
                </div>
                <div className="flex gap-2 mt-3 justify-center">
                  <button
                    onClick={resetPuzzle}
                    className="px-4 py-1.5 bg-gray-100 text-gray-600 text-sm rounded hover:bg-gray-200"
                  >
                    重做
                  </button>
                  <button
                    onClick={goNextPuzzle}
                    className="px-4 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    下一题
                  </button>
                </div>
              </div>
            </div>
          )}

          <ChessBoard
            pieces={pieces}
            selectedPosition={displaySelected}
            legalMoves={displayLegal}
            lastMove={lastMove}
            turn={turn}
            isCheck={isCheck}
            onSquareClick={handleSquareClick}
            boardStyle="wooden"
            showCoords={true}
          />
        </div>

        {/* Side panel */}
        <div className="w-64 bg-white border-l flex flex-col overflow-hidden shrink-0">
          {/* Move list */}
          <div className="flex flex-col h-full">
            <div className="px-3 py-2 bg-gray-50 border-b text-sm font-medium text-gray-600">
              走法记录
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {moveHistory.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-8">
                  请走棋破解杀法
                </div>
              ) : (
                <div className="space-y-0.5">
                  {moveHistory.map((move, index) => {
                    const isRed = index % 2 === 0
                    return (
                      <div
                        key={index}
                        className={`px-2 py-1 rounded text-sm flex items-center gap-2 text-gray-700`}
                      >
                        {isRed && <span className="text-gray-400 w-8 shrink-0">{Math.floor(index / 2) + 1}.</span>}
                        {!isRed && <span className="w-8 shrink-0" />}
                        <span className={`w-2 h-2 rounded-full shrink-0 ${isRed ? 'bg-red-500' : 'bg-gray-800'}`} />
                        <span className="font-kai">{move.notation}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="p-3 border-t bg-gray-50 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={isShowingHint ? hideHint : showHint}
                className="flex-1 py-1.5 bg-yellow-100 text-yellow-700 text-sm rounded hover:bg-yellow-200"
              >
                {isShowingHint ? '隐藏提示' : '提示'}
              </button>
              <button
                onClick={resetPuzzle}
                className="flex-1 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
              >
                重来
              </button>
            </div>
            <button
              onClick={undoStep}
              disabled={currentMoveStep === 0 || isSolved}
              className="w-full py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 disabled:opacity-40"
            >
              悔棋
            </button>
            {isSolved && (
              <button
                onClick={goNextPuzzle}
                className="w-full py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                下一题
              </button>
            )}
          </div>

          {/* Puzzle info */}
          <div className="p-3 border-t bg-gray-50 text-xs text-gray-500">
            <div className="flex justify-between mb-1">
              <span>难度: {selectedPuzzle.difficulty}/5</span>
              <span>步数: {playerMoveCount}</span>
            </div>
            {selectedPuzzle.tags.length > 0 && (
              <div className="flex gap-1 mt-1">
                {selectedPuzzle.tags.map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
