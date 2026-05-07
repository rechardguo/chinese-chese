import { createServer } from 'http'
import { readFileSync, existsSync } from 'fs'
import { join, extname } from 'path'
import { WebSocketServer } from 'ws'
import { networkInterfaces } from 'os'

const PORT = parseInt(process.argv[2]) || 19526
const STATIC_DIR = join(import.meta.dirname, 'dist')

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2'
}

// HTTP server: serve static files from dist/
const server = createServer((req, res) => {
  let path = req.url === '/' ? '/index.html' : req.url
  const file = join(STATIC_DIR, path)
  if (!existsSync(file)) { path = '/index.html' }
  try {
    const data = readFileSync(join(STATIC_DIR, path))
    res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'text/plain' })
    res.end(data)
  } catch {
    res.writeHead(404)
    res.end('Not found')
  }
})

// WebSocket server on the same port
const wss = new WebSocketServer({ server })
const rooms = new Map()

function getLocalIP() {
  const nets = networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address
    }
  }
  return 'localhost'
}

function getRoomList() {
  return [...rooms.entries()]
    .map(([id, r]) => ({ id, name: r.name, status: r.guest ? 'playing' : 'waiting', createdAt: r.createdAt, spectatorCount: r.spectators ? r.spectators.size : 0 }))
}

function broadcastRoomList() {
  const list = JSON.stringify({ type: '_room_list', rooms: getRoomList() })
  for (const ws of wss.clients) {
    if (ws.readyState === 1) ws.send(list)
  }
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: '_room_list', rooms: getRoomList() }))

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString())
      if (msg.type === '_create_room') {
        const roomId = Date.now().toString(36)
        rooms.set(roomId, { host: ws, guest: null, spectators: new Set(), moves: [], name: msg.name || '房间', createdAt: Date.now() })
        ws._roomId = roomId
        ws._role = 'host'
        ws.send(JSON.stringify({ type: '_room_created', roomId, name: msg.name }))
        console.log(`  Room created: ${msg.name} (${roomId})`)
        broadcastRoomList()
      } else if (msg.type === '_join_room') {
        const room = rooms.get(msg.roomId)
        if (!room || room.guest) {
          ws.send(JSON.stringify({ type: '_error', message: '房间不存在或已满' }))
          return
        }
        room.guest = ws
        ws._roomId = msg.roomId
        ws._role = 'guest'
        // Randomly assign colors
        const hostColor = Math.random() < 0.5 ? 'r' : 'b'
        const guestColor = hostColor === 'r' ? 'b' : 'r'
        room.host.send(JSON.stringify({ type: '_opponent_joined', color: hostColor }))
        ws.send(JSON.stringify({ type: '_joined_room', color: guestColor }))
        console.log(`  Guest joined room: ${room.name} (host=${hostColor})`)
        broadcastRoomList()
      } else if (msg.type === '_spectate_room') {
        const room = rooms.get(msg.roomId)
        if (!room || !room.guest) {
          ws.send(JSON.stringify({ type: '_error', message: '房间不存在或未开始' }))
          return
        }
        room.spectators.add(ws)
        ws._roomId = msg.roomId
        ws._role = 'spectator'
        // Replay all recorded moves to the spectator
        for (const moveMsg of room.moves) {
          ws.send(JSON.stringify(moveMsg))
        }
        ws.send(JSON.stringify({ type: '_spectating' }))
        const specCount = room.spectators.size
        if (room.host && room.host.readyState === 1) room.host.send(JSON.stringify({ type: '_spectator_count', count: specCount }))
        if (room.guest && room.guest.readyState === 1) room.guest.send(JSON.stringify({ type: '_spectator_count', count: specCount }))
        console.log(`  Spectator joined room: ${room.name} (${specCount} watching)`)
        broadcastRoomList()
      } else {
        const room = rooms.get(ws._roomId)
        if (!room) return
        // Record move messages for spectator replay
        if (msg.type === 'move' && ws._role !== 'spectator') {
          room.moves.push(msg)
        }
        const peer = ws._role === 'host' ? room.guest : room.host
        if (peer && peer.readyState === 1) {
          peer.send(JSON.stringify(msg))
        }
        // Forward to spectators
        if (room.spectators && ws._role !== 'spectator') {
          for (const spec of room.spectators) {
            if (spec.readyState === 1) spec.send(JSON.stringify(msg))
          }
        }
      }
    } catch { /* ignore */ }
  })

  ws.on('close', () => {
    const room = rooms.get(ws._roomId)
    if (!room) return
    if (ws._role === 'spectator') {
      room.spectators.delete(ws)
      const specCount = room.spectators.size
      if (room.host && room.host.readyState === 1) room.host.send(JSON.stringify({ type: '_spectator_count', count: specCount }))
      if (room.guest && room.guest.readyState === 1) room.guest.send(JSON.stringify({ type: '_spectator_count', count: specCount }))
      broadcastRoomList()
    } else {
      const peer = ws._role === 'host' ? room.guest : room.host
      if (peer && peer.readyState === 1) {
        peer.send(JSON.stringify({ type: '_opponent_left' }))
      }
      for (const spec of room.spectators) {
        if (spec.readyState === 1) spec.send(JSON.stringify({ type: '_opponent_left' }))
      }
      rooms.delete(ws._roomId)
      console.log(`  Room closed: ${ws._roomId}`)
      broadcastRoomList()
    }
  })
})

server.listen(PORT, () => {
  const ip = getLocalIP()
  console.log(`\n  象棋训练大师已启动`)
  console.log(`  本机: http://localhost:${PORT}`)
  console.log(`  局域网: http://${ip}:${PORT}`)
  console.log(`\n  等待玩家连接...\n`)
})
