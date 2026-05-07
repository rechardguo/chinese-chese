import { useState, useEffect, useCallback } from 'react'
import { useGameStore } from '../../stores/gameStore'
import type { Color } from '@shared/types/chess'

interface Room {
  id: string
  name: string
  status: 'waiting' | 'playing'
  createdAt: number
  spectatorCount: number
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
  const { initNewGame, setLanConnected, setLanRoomInfo, setIsSpectator } = useGameStore()

  const host = location.hostname || 'localhost'
  const port = 19526
 
  const doConnect = useCallback((retries = 3) => {
    setConnecting(true)
    setError('')
    window.api.lan.connect(host, port)
      .then(() => { setConnected(true); setConnecting(false) })
      .catch(() => {
        if (retries > 0) {
          setTimeout(() => doConnect(retries - 1), 1000)
        } else {
          setConnected(false)
          setConnecting(false)
          setError(`无法连接服务器 (${host}:${port})`)
        }
      })
  }, [host, port]) 

  useEffect(() => { doConnect }, [doConnect])

  useEffect(() => {
    window.api.lan.onRoomList((list) => setRooms(list))
  }, [])

  // Host: receive color when opponent joins
  useEffect(() => {
    if (status !== 'waiting') return
    const unsub = window.api.lan.onOpponentConnected((color: string) => {
      console.log('[LAN] host received color:', color)
      setLanConnected(true)
      initNewGame('lan', { playerColor: color as Color })
      setStatus('idle')
      onNavigate('lan')
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
      const result = await window.api.lan.joinRoom(roomId)
      console.log('[LAN] guest received color:', result?.color)
      const color = result?.color || 'b'
      setLanConnected(true)
      setLanRoomInfo({ ip: host, port })
      initNewGame('lan', { playerColor: color as Color })
      setStatus('idle')
      onNavigate('lan')
    } catch (err: any) {
      setError(`加入失败: ${err.message}`)
      setStatus('idle')
    }
  }, [host, initNewGame, setLanConnected, setLanRoomInfo, onNavigate])

  const handleSpectateRoom = useCallback(async (roomId: string) => {
    setError('')
    try {
      await window.api.lan.spectateRoom(roomId)
      setLanConnected(true)
      setLanRoomInfo({ ip: host, port })
      setIsSpectator(true)
      initNewGame('lan', { playerColor: 'r' })
      onNavigate('lan')
    } catch (err: any) {
      setError(`观战失败: ${err.message}`)
    }
  }, [host, initNewGame, setLanConnected, setLanRoomInfo, setIsSpectator, onNavigate])

  const waitingRooms = rooms.filter(r => r.status === 'waiting')
  const playingRooms = rooms.filter(r => r.status === 'playing')

  return (
    <div className="flex-1 flex items-center justify-center h-full bg-gray-100">
      <div className="bg-white rounded-xl shadow-lg p-8 w-[480px]">
        <h2 className="text-xl font-bold text-gray-800 text-center mb-6">联机大厅</h2>

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
                <button onClick={()=>doConnect()} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
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
          </div>
        ) : (
          <div className="space-y-4">
            {/* Waiting rooms */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">
                等待加入 {waitingRooms.length > 0 && `(${waitingRooms.length})`}
              </h3>
              {waitingRooms.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-3">暂无空闲房间</p>
              ) : (
                <div className="space-y-2">
                  {waitingRooms.map((room) => (
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
                      <span className="text-xs text-blue-600 font-medium">加入 →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Playing rooms */}
            {playingRooms.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">
                  对弈中 ({playingRooms.length})
                </h3>
                <div className="space-y-2">
                  {playingRooms.map((room) => (
                    <div
                      key={room.id}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold">
                          {room.name.charAt(0)}
                        </span>
                        <span className="font-medium text-gray-600">{room.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {room.spectatorCount > 0 && (
                          <span className="text-xs text-gray-400">{room.spectatorCount}人观战</span>
                        )}
                        <button
                          onClick={() => handleSpectateRoom(room.id)}
                          className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                        >
                          观战
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                创建房间
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
