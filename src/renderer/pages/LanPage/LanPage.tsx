import { useState, useEffect, useCallback } from 'react'
import { useGameStore } from '../../stores/gameStore'

interface Room {
  id: string
  name: string
  createdAt: number
}

interface LanPageProps {
  onNavigate: (page: string) => void
}

export default function LanPage({ onNavigate }: LanPageProps) {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(true)
  const [rooms, setRooms] = useState<Room[]>([])
  const [status, setStatus] = useState<'idle' | 'creating' | 'waiting' | 'joining'>('idle')
  const [error, setError] = useState('')
  const [roomName, setRoomName] = useState('象棋房间')
  const { initNewGame, setLanConnected, setLanRoomInfo } = useGameStore()

  const host = location.hostname || 'localhost'
  const port = 19526

  const doConnect = useCallback(() => {
    setConnecting(true)
    setError('')
    window.api.lan.connect(host, port)
      .then(() => { setConnected(true); setConnecting(false) })
      .catch(() => {
        setConnected(false)
        setConnecting(false)
        setError(`无法连接服务器 (${host}:${port})，请先运行 node server.mjs`)
      })
  }, [host])

  // Auto-connect on mount
  useEffect(() => { doConnect() }, [doConnect])

  // Listen for room list updates
  useEffect(() => {
    const unsub = window.api.lan.onRoomList((list) => setRooms(list))
    return unsub
  }, [])

  // Listen for opponent connection (host side)
  useEffect(() => {
    if (status !== 'waiting') return
    const unsub = window.api.lan.onOpponentConnected(() => {
      setLanConnected(true)
      initNewGame('lan', { playerColor: 'r' })
      setStatus('idle')
      onNavigate('play')
    })
    return unsub
  }, [status, initNewGame, setLanConnected, onNavigate])

  const handleCreateRoom = useCallback(async () => {
    setError('')
    setStatus('creating')
    try {
      await window.api.lan.createRoom(roomName || '象棋房间')
      setLanRoomInfo({ ip: host, port })
      setStatus('waiting')
    } catch (err: any) {
      setError(`创建失败: ${err.message}`)
      setStatus('idle')
    }
  }, [roomName, host, setLanRoomInfo])

  const handleJoinRoom = useCallback(async (roomId: string) => {
    setError('')
    setStatus('joining')
    try {
      await window.api.lan.joinRoom(roomId)
      setLanConnected(true)
      setLanRoomInfo({ ip: host, port })
      initNewGame('lan', { playerColor: 'b' })
      setStatus('idle')
      onNavigate('play')
    } catch (err: any) {
      setError(`加入失败: ${err.message}`)
      setStatus('idle')
    }
  }, [host, initNewGame, setLanConnected, setLanRoomInfo, onNavigate])

  return (
    <div className="flex-1 flex items-center justify-center h-full bg-gray-100">
      <div className="bg-white rounded-xl shadow-lg p-8 w-[480px]">
        <h2 className="text-xl font-bold text-gray-800 text-center mb-6">联机对战</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {!connected ? (
          <div className="text-center py-4">
            {connecting ? (
              <p className="text-sm text-gray-400">连接服务器中...</p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">未连接到游戏服务器</p>
                <p className="text-xs text-gray-400">请在终端运行: node server.mjs</p>
                <button onClick={doConnect} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                  重试连接
                </button>
              </div>
            )}
          </div>
        ) : status === 'waiting' ? (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm mb-3">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              等待对手加入...
            </div>
            <p className="text-gray-600 font-medium">{roomName}</p>
            <p className="text-xs text-gray-400 mt-1">其他设备打开同一页面即可看到此房间</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Room list first */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">
                可加入的房间 {rooms.length > 0 && `(${rooms.length})`}
              </h3>
              {rooms.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">暂无房间</p>
              ) : (
                <div className="space-y-2">
                  {rooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => handleJoinRoom(room.id)}
                      disabled={status === 'joining'}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                          {room.name.charAt(0)}
                        </span>
                        <span className="font-medium text-gray-800">{room.name}</span>
                      </div>
                      <span className="text-xs text-blue-600 font-medium">加入（执黑）→</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">或</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Create room */}
            <div className="flex gap-2">
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="房间名称"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
              />
              <button
                onClick={handleCreateRoom}
                disabled={status === 'creating'}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors shrink-0 disabled:opacity-50"
              >
                创建（执红）
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
