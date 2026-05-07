import type { AppAPI } from '@shared/types/ipc'
import type { Piece } from '@shared/types/chess'

type Board = (Piece | null)[][]

let aiWorker: Worker | null = null

function getAIWorker(): Worker {
  if (!aiWorker) {
    aiWorker = new Worker(new URL('../workers/ai-worker.ts', import.meta.url), { type: 'module' })
  }
  return aiWorker
}

// --- WebSocket LAN implementation ---
let ws: WebSocket | null = null
const listeners = {
  opponentConnected: [] as ((color: string) => void)[],
  opponentDisconnected: [] as (() => void)[],
  message: [] as ((msg: any) => void)[],
  roomList: [] as ((rooms: any[]) => void)[],
  spectatorCount: [] as ((count: number) => void)[]
}

function setupWsHandlers(socket: WebSocket) {
  socket.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data)
      if (data.type === '_opponent_joined') {
        listeners.opponentConnected.forEach(cb => cb(data.color))
      } else if (data.type === '_opponent_left') {
        listeners.opponentDisconnected.forEach(cb => cb())
      } else if (data.type === '_room_list') {
        listeners.roomList.forEach(cb => cb(data.rooms))
      } else if (data.type === '_spectating') {
        // Spectator has joined — no action needed, just confirmation
      } else if (data.type === '_spectator_count') {
        listeners.spectatorCount.forEach(cb => cb(data.count))
      } else if (data.type === '_error') {
        console.error('[LAN] error:', data.message)
      } else if (!data.type.startsWith('_')) {
        listeners.message.forEach(cb => cb(data))
      }
    } catch { /* ignore non-json */ }
  }
  socket.onclose = () => {
    listeners.opponentDisconnected.forEach(cb => cb())
  }
}

function addListener(arr: any[], cb: any) {
  arr.push(cb)
  return () => { const i = arr.indexOf(cb); if (i >= 0) arr.splice(i, 1) }
}

export const webApi: AppAPI = {
  engine: {
    start: async () => {},
    stop: async () => {},
    isReady: async () => false,
    getBestMove: async () => { throw new Error('Pikafish not available in web mode') },
    startAnalysis: async () => {},
    stopAnalysis: async () => {},
    onAnalysisUpdate: () => () => {},
    checkExists: async () => false
  },

  builtinAI: {
    getBestMove: (board: Board, turn: string, difficulty: number) => {
      return new Promise((resolve) => {
        const worker = getAIWorker()
        const handler = (e: MessageEvent) => {
          worker.removeEventListener('message', handler)
          resolve(e.data)
        }
        worker.addEventListener('message', handler)
        worker.postMessage({ board, turn, difficulty })
      })
    }
  },

  db: {
    saveGame: async () => {},
    loadGames: async () => [],
    deleteGame: async () => {},
    getGame: async () => null,
    savePuzzleProgress: async () => {},
    loadPuzzleProgress: async () => [],
    saveSettings: async (settings: any) => {
      localStorage.setItem('app-settings', JSON.stringify(settings))
    },
    loadSettings: async () => {
      try {
        const raw = localStorage.getItem('app-settings')
        return raw ? JSON.parse(raw) : null
      } catch { return null }
    }
  },

  ai: {
    analyzeGame: async () => { throw new Error('Not available in web mode') },
    onAnalyzeProgress: () => () => {},
    testConnection: async () => false
  },

  data: {
    loadOpenings: async () => [],
    loadPuzzles: async () => []
  },

  lan: {
    connect: (host: string, port = 19526) => {
      return new Promise<void>((resolve, reject) => {
        if (ws) { ws.close(); ws = null }
        const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
        const url = `${protocol}://${host}:${port}`
        console.log('[LAN] connecting to:', url)
        try {
          ws = new WebSocket(url)
        } catch (e) {
          console.error('[LAN] WebSocket constructor failed:', e)
          reject(new Error('无法创建连接'))
          return
        }
        ws.onopen = () => { console.log('[LAN] connected'); setupWsHandlers(ws!); resolve() }
        ws.onerror = (e) => { console.error('[LAN] connection error:', e); reject(new Error('无法连接到服务器')) }
      })
    },

    createRoom: (name = '象棋房间') => {
      return new Promise<{ roomId: string }>((resolve, reject) => {
        if (!ws || ws.readyState !== WebSocket.OPEN) { reject(new Error('未连接')); return }
        const handler = (e: MessageEvent) => {
          const data = JSON.parse(e.data)
          if (data.type === '_room_created') {
            ws!.removeEventListener('message', handler)
            resolve({ roomId: data.roomId })
          } else if (data.type === '_error') {
            ws!.removeEventListener('message', handler)
            reject(new Error(data.message))
          }
        }
        ws.addEventListener('message', handler)
        ws.send(JSON.stringify({ type: '_create_room', name }))
      })
    },

    joinRoom: (roomId: string) => {
      return new Promise<{ color: string }>((resolve, reject) => {
        if (!ws || ws.readyState !== WebSocket.OPEN) { reject(new Error('未连接')); return }
        const handler = (e: MessageEvent) => {
          const data = JSON.parse(e.data)
          if (data.type === '_joined_room') {
            ws!.removeEventListener('message', handler)
            resolve({ color: data.color })
          } else if (data.type === '_error') {
            ws!.removeEventListener('message', handler)
            reject(new Error(data.message))
          }
        }
        ws.addEventListener('message', handler)
        ws.send(JSON.stringify({ type: '_join_room', roomId }))
      })
    },

    leaveRoom: async () => {
      if (ws) { ws.close(); ws = null }
    },

    spectateRoom: (roomId: string) => {
      return new Promise<void>((resolve, reject) => {
        if (!ws || ws.readyState !== WebSocket.OPEN) { reject(new Error('未连接')); return }
        const handler = (e: MessageEvent) => {
          const data = JSON.parse(e.data)
          if (data.type === '_spectating') {
            ws!.removeEventListener('message', handler)
            resolve()
          } else if (data.type === '_error') {
            ws!.removeEventListener('message', handler)
            reject(new Error(data.message))
          }
        }
        ws.addEventListener('message', handler)
        ws.send(JSON.stringify({ type: '_spectate_room', roomId }))
      })
    },

    send: (msg) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg))
      }
    },

    onOpponentConnected: (cb) => addListener(listeners.opponentConnected, cb),
    onOpponentDisconnected: (cb) => addListener(listeners.opponentDisconnected, cb),
    onMessage: (cb) => addListener(listeners.message, cb),
    onRoomList: (cb) => addListener(listeners.roomList, cb),
    onSpectatorCount: (cb: (count: number) => void) => addListener(listeners.spectatorCount, cb)
  }
}

window.api = webApi
