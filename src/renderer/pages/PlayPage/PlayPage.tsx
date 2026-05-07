import React, { useState, useRef, useEffect } from 'react'
import { useGameStore } from '../../stores/gameStore'
import ChessBoard from '../../components/ChessBoard/ChessBoard'
import MoveList from '../../components/MoveList/MoveList'
import type { LanUndoState, LanChatMessage } from '../../App'

interface PlayPageProps {
  lanUndoState: LanUndoState
  onLanUndoStateChange: (state: LanUndoState) => void
  lanMessages: LanChatMessage[]
  onLanChat: (text: string) => void
  onLanBack: () => void
  opponentResigned: boolean
}

export default function PlayPage({ lanUndoState, onLanUndoStateChange, lanMessages, onLanChat, onLanBack, opponentResigned }: PlayPageProps) {
  const {
    turn, status, moves, pieces,
    selectedPosition, legalMoves, currentMoveIndex,
    gameMode, config, isCheck, engineThinking,
    playerColor, lanConnected, lanRoomInfo, isSpectator,
    boardStyle, showCoords,
    initNewGame, handleSquareClick, undoMove, goToMove, resign
  } = useGameStore()

  const [showNewGameDialog, setShowNewGameDialog] = useState(false)
  const [showResignConfirm, setShowResignConfirm] = useState(false)
  const [newGameMode, setNewGameMode] = useState<'pvp' | 'pve'>('pvp')
  const [difficulty, setDifficulty] = useState(config.engineDifficulty)
  const [localPlayerColor, setLocalPlayerColor] = useState<'r' | 'b'>(config.playerColor)
  const [showSettings, setShowSettings] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [lanMessages])

  const sendChat = () => {
    const text = chatInput.trim()
    if (!text) return
    window.api.lan.send({ type: 'chat', text })
    onLanChat(text)
    setChatInput('')
  }

  const lastMove = currentMoveIndex >= 0 ? moves[currentMoveIndex] : null

  const isMyTurn = gameMode !== 'lan' || turn === playerColor

  const getStatusText = () => {
    if (engineThinking) return 'AI 思考中...'
    if (isSpectator) return '观战中 - ' + (turn === 'r' ? '红方走棋' : '黑方走棋')
    if (gameMode === 'lan' && !lanConnected) return '对手已断开连接'
    if (gameMode === 'lan' && !isMyTurn) return '等待对手走棋...'
    switch (status) {
      case 'check': return turn === 'r' ? '红方被将军！' : '黑方被将军！'
      case 'red_wins': return '红方胜利！'
      case 'black_wins': return '黑方胜利！'
      case 'draw': return '和棋！'
      default: return turn === 'r' ? '红方走棋' : '黑方走棋'
    }
  }

  const getStatusColor = () => {
    if (engineThinking) return 'text-blue-600 font-bold animate-pulse'
    switch (status) {
      case 'check': return 'text-red-600 font-bold'
      case 'red_wins': return 'text-red-600 font-bold text-lg'
      case 'black_wins': return 'text-gray-900 font-bold text-lg'
      default: return 'text-gray-600'
    }
  }

  const isGameOver = ['red_wins', 'black_wins', 'draw'].includes(status)

  const startNewGame = () => {
    initNewGame(newGameMode as any, {
      playerColor: newGameMode === 'pve' ? localPlayerColor : 'r',
      engineDifficulty: difficulty
    })
    setShowNewGameDialog(false)
    setShowSettings(false)
  }

  const difficultyLabels: Record<number, string> = {
    1: '入门', 2: '入门', 3: '初级', 4: '初级', 5: '初级',
    6: '中级', 7: '中级', 8: '中级', 9: '中级', 10: '中级',
    11: '高级', 12: '高级', 13: '高级', 14: '高级', 15: '高级',
    16: '大师', 17: '大师', 18: '大师', 19: '大师', 20: '大师'
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-sm font-bold text-gray-800 shrink-0">
            {gameMode === 'pvp' ? '双人对弈' : gameMode === 'lan' ? '对弈' : '人机对弈'}
          </h2>
          {gameMode === 'pve' && (
            <span className="text-xs text-gray-400 shrink-0">
              {difficultyLabels[difficulty]}
            </span>
          )}
          <span className={`text-sm ${getStatusColor()} shrink-0`}>{getStatusText()}</span>
          {gameMode === 'lan' && (
            <span className={`text-xs shrink-0 ${lanConnected ? 'text-green-600' : 'text-red-500'}`}>
              {isSpectator
                ? (lanConnected ? '观战中' : '未连接')
                : (lanConnected ? `已连接 | ${playerColor === 'r' ? '你执红' : '你执黑'}` : '未连接')
              }
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {gameMode !== 'lan' && (
            <>
              <button
                onClick={() => setShowNewGameDialog(true)}
                className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                新游戏
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-4 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
              >
                设置
              </button>
            </>
          )}
          {!isSpectator && (
          <button
            onClick={() => {
              if (gameMode === 'lan') {
                window.api.lan.send({ type: 'undo-request' })
                onLanUndoStateChange('requested')
              } else {
                undoMove()
              }
            }}
            className="px-4 py-1.5 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
            disabled={moves.length === 0 || engineThinking || lanUndoState === 'requested'}
          >
            {lanUndoState === 'requested' ? '等待同意...' : '悔棋'}
          </button>
          )}
          {gameMode === 'lan' && !isSpectator && (
            <button
              onClick={() => setShowResignConfirm(true)}
              className="px-4 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              认输
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Board area */}
        <div className="flex-1 flex items-center justify-center bg-gray-200 p-1 relative">
          {/* Engine thinking overlay */}
          {engineThinking && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-lg">
                <span className="inline-block w-2 h-2 bg-white rounded-full animate-bounce" />
                AI 思考中...
              </div>
            </div>
          )}

          {/* Game over overlay */}
          {isGameOver && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-white px-6 py-3 rounded-lg shadow-xl border-2 border-gray-200 text-center">
                <div className="text-lg font-bold text-gray-800">
                  {opponentResigned ? '对手认输！' : status === 'red_wins' ? '红方获胜！' : status === 'black_wins' ? '黑方获胜！' : '和棋！'}
                </div>
                <button
                  onClick={() => { if (gameMode === 'lan') { onLanBack() } else { setShowNewGameDialog(true) } }}
                  className="mt-2 px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  {gameMode === 'lan' ? '返回大厅' : '再来一局'}
                </button>
              </div>
            </div>
          )}

          <ChessBoard
            pieces={pieces}
            selectedPosition={selectedPosition}
            legalMoves={legalMoves}
            lastMove={lastMove}
            turn={turn}
            isCheck={isCheck}
            onSquareClick={handleSquareClick}
            flipped={gameMode === 'lan' && playerColor === 'b'}
            boardStyle={boardStyle}
            showCoords={showCoords}
          />
        </div>

        {/* Side panel */}
        <div className="w-64 bg-white border-l flex flex-col overflow-hidden shrink-0">
          {showSettings && (
            <div className="p-3 border-b bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">对弈设置</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-500">模式</label>
                  <div className="flex gap-1 mt-1">
                    <button
                      onClick={() => setNewGameMode('pvp')}
                      className={`flex-1 py-1 text-xs rounded ${newGameMode === 'pvp' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                    >
                      双人
                    </button>
                    <button
                      onClick={() => setNewGameMode('pve')}
                      className={`flex-1 py-1 text-xs rounded ${newGameMode === 'pve' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                    >
                      人机
                    </button>
                  </div>
                </div>

                {newGameMode === 'pve' && (
                  <>
                    <div>
                      <label className="text-xs text-gray-500">执子</label>
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => setLocalPlayerColor('r')}
                          className={`flex-1 py-1 text-xs rounded ${localPlayerColor === 'r' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                        >
                          执红
                        </button>
                        <button
                          onClick={() => setLocalPlayerColor('b')}
                          className={`flex-1 py-1 text-xs rounded ${localPlayerColor === 'b' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600'}`}
                        >
                          执黑
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between">
                        <label className="text-xs text-gray-500">难度: {difficultyLabels[difficulty]}</label>
                        <span className="text-xs text-gray-400">{difficulty}/20</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={difficulty}
                        onChange={(e) => setDifficulty(parseInt(e.target.value))}
                        className="w-full h-1.5 mt-1 accent-blue-600"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span>入门</span>
                        <span>大师</span>
                      </div>
                    </div>
                  </>
                )}

                <button
                  onClick={startNewGame}
                  className="w-full py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  开始游戏
                </button>
              </div>
            </div>
          )}

          <div className={`flex-1 min-h-0 ${gameMode === 'lan' ? '' : 'flex flex-col'}`}>
            <MoveList
              moves={moves}
              currentMoveIndex={currentMoveIndex}
              onMoveClick={isGameOver ? goToMove : undefined}
            />
          </div>

          {/* LAN Chat */}
          {gameMode === 'lan' && !isSpectator && (
            <div className="flex-1 border-t flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {lanMessages.length === 0 && (
                  <p className="text-xs text-gray-300 text-center">发送消息给对手</p>
                )}
                {lanMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>
                    <span className={`inline-block px-2 py-1 rounded text-xs max-w-[80%] ${
                      msg.fromMe ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {msg.text}
                    </span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-1 p-2 border-t bg-gray-50">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendChat() } }}
                  placeholder="输入消息..."
                  className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <button
                  onClick={sendChat}
                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  发送
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Game Dialog */}
      {showNewGameDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-80">
            <h3 className="text-lg font-bold text-gray-800 mb-4">新游戏</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">游戏模式</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewGameMode('pvp')}
                    className={`flex-1 py-2 text-sm rounded-lg border-2 transition-colors ${
                      newGameMode === 'pvp'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    双人对弈
                  </button>
                  <button
                    onClick={() => setNewGameMode('pve')}
                    className={`flex-1 py-2 text-sm rounded-lg border-2 transition-colors ${
                      newGameMode === 'pve'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    人机对弈
                  </button>
                </div>
              </div>

              {newGameMode === 'pve' && (
                <>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">选择执子</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setLocalPlayerColor('r')}
                        className={`flex-1 py-2 text-sm rounded-lg border-2 transition-colors ${
                          localPlayerColor === 'r'
                            ? 'border-red-600 bg-red-50 text-red-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        执红先手
                      </button>
                      <button
                        onClick={() => setLocalPlayerColor('b')}
                        className={`flex-1 py-2 text-sm rounded-lg border-2 transition-colors ${
                          localPlayerColor === 'b'
                            ? 'border-gray-800 bg-gray-100 text-gray-800'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        执黑后手
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-sm text-gray-600">AI 难度</label>
                      <span className="text-sm text-blue-600 font-medium">
                        {difficultyLabels[difficulty]} ({difficulty})
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={difficulty}
                      onChange={(e) => setDifficulty(parseInt(e.target.value))}
                      className="w-full h-2 accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>入门</span>
                      <span>初级</span>
                      <span>中级</span>
                      <span>高级</span>
                      <span>大师</span>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowNewGameDialog(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  onClick={startNewGame}
                  className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  开始
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resign confirm dialog */}
      {showResignConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-72 text-center">
            <p className="text-lg font-bold text-gray-800 mb-4">确定认输？</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResignConfirm(false)}
                className="flex-1 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={() => { setShowResignConfirm(false); resign(); onLanBack() }}
                className="flex-1 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
              >
                认输
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Opponent undo request dialog */}
      {lanUndoState === 'incoming' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-72 text-center">
            <p className="text-lg font-bold text-gray-800 mb-4">对手请求悔棋</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  window.api.lan.send({ type: 'undo-reject' })
                  onLanUndoStateChange('idle')
                }}
                className="flex-1 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200"
              >
                拒绝
              </button>
              <button
                onClick={() => {
                  window.api.lan.send({ type: 'undo-accept' })
                  undoMove()
                  onLanUndoStateChange('idle')
                }}
                className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                同意
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
