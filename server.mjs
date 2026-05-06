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
    .filter(([, r]) => !r.guest)
    .map(([id, r]) => ({ id, name: r.name, createdAt: r.createdAt }))
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
        rooms.set(roomId, { host: ws, guest: null, name: msg.name || '房间', createdAt: Date.now() })
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
        room.host.send(JSON.stringify({ type: '_opponent_joined' }))
        ws.send(JSON.stringify({ type: '_joined_room' }))
        console.log(`  Guest joined room: ${room.name}`)
        broadcastRoomList()
      } else {
        const room = rooms.get(ws._roomId)
        if (!room) return
        const peer = ws._role === 'host' ? room.guest : room.host
        if (peer && peer.readyState === 1) {
          peer.send(JSON.stringify(msg))
        }
      }
    } catch { /* ignore */ }
  })

  ws.on('close', () => {
    const room = rooms.get(ws._roomId)
    if (room) {
      const peer = ws._role === 'host' ? room.guest : room.host
      if (peer && peer.readyState === 1) {
        peer.send(JSON.stringify({ type: '_opponent_left' }))
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
