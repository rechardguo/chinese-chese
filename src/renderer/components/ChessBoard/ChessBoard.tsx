import { useRef, useEffect, useCallback } from 'react'
import type { BoardPosition, Piece, Color, Move } from '@shared/types/chess'
import {
  CELL_SIZE, PADDING, PIECE_RADIUS, BOARD_WIDTH, BOARD_HEIGHT,
  boardToPixel as _boardToPixel, pixelToBoard as _pixelToBoard, CROSS_MARK_POSITIONS
} from '@shared/constants/board'
import { PIECE_CHARS } from '@shared/constants/pieces'

interface ChessBoardProps {
  pieces: { piece: Piece; position: BoardPosition }[]
  selectedPosition: BoardPosition | null
  legalMoves: BoardPosition[]
  lastMove: Move | null
  turn: Color
  isCheck: boolean
  onSquareClick: (pos: BoardPosition) => void
  flipped?: boolean
  boardStyle?: 'wooden' | 'classic' | 'minimal'
  showCoords?: boolean
}

const STYLES = {
  wooden: {
    bg: '#DEB887', line: '#5C3317', riverText: '#5C3317',
    pieceBg: '#F5DEB3', pieceGradLight: '#FFF8DC', pieceGradDark: '#F5DEB3',
    red: '#CC0000', black: '#1A1A1A'
  },
  classic: {
    bg: '#F0D9A0', line: '#4A3520', riverText: '#4A3520',
    pieceBg: '#FFF5E1', pieceGradLight: '#FFFEF5', pieceGradDark: '#FFF5E1',
    red: '#B22222', black: '#1A1A1A'
  },
  minimal: {
    bg: '#FAF0E6', line: '#8B7355', riverText: '#8B7355',
    pieceBg: '#FFFFFF', pieceGradLight: '#FFFFFF', pieceGradDark: '#F5F5F5',
    red: '#C0392B', black: '#2C3E50'
  }
}

function toPixel(file: number, rank: number, flipped: boolean) {
  const p = _boardToPixel(file, rank)
  if (!flipped) return p
  return { x: p.x, y: BOARD_HEIGHT - p.y }
}

function toBoard(px: number, py: number, flipped: boolean) {
  if (!flipped) return _pixelToBoard(px, py)
  return _pixelToBoard(px, BOARD_HEIGHT - py)
}

export default function ChessBoard({
  pieces,
  selectedPosition,
  legalMoves,
  lastMove,
  turn,
  isCheck,
  onSquareClick,
  flipped = false,
  boardStyle = 'wooden',
  showCoords = true
}: ChessBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = BOARD_WIDTH * dpr
    canvas.height = BOARD_HEIGHT * dpr

    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)

    const s = STYLES[boardStyle]
    drawBoard(ctx, s, showCoords, flipped)
    drawLastMove(ctx, lastMove, s, flipped)
    drawLegalMoves(ctx, legalMoves, flipped)
    drawPieces(ctx, pieces, selectedPosition, isCheck, turn, s, flipped)
  }, [pieces, selectedPosition, legalMoves, lastMove, turn, isCheck, boardStyle, showCoords, flipped])

  useEffect(() => {
    draw()
  }, [draw])

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = BOARD_WIDTH / rect.width
    const scaleY = BOARD_HEIGHT / rect.height
    const px = (e.clientX - rect.left) * scaleX
    const py = (e.clientY - rect.top) * scaleY
    const pos = toBoard(px, py, flipped)
    if (pos) onSquareClick(pos)
  }, [onSquareClick, flipped])

  return (
    <canvas
      ref={canvasRef}
      className="cursor-pointer rounded-lg shadow-lg"
      style={{ maxWidth: '100%', maxHeight: '100%', aspectRatio: `${BOARD_WIDTH} / ${BOARD_HEIGHT}` }}
      onClick={handleClick}
    />
  )
}

function drawBoard(ctx: CanvasRenderingContext2D, s: typeof STYLES.wooden, showCoords: boolean, flipped: boolean) {
  ctx.fillStyle = s.bg
  ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT)

  // Outer border
  ctx.strokeStyle = s.line
  ctx.lineWidth = 3
  ctx.strokeRect(PADDING - 18, PADDING - 18, CELL_SIZE * 8 + 36, CELL_SIZE * 9 + 36)
  ctx.lineWidth = 1
  ctx.strokeRect(PADDING - 21, PADDING - 21, CELL_SIZE * 8 + 42, CELL_SIZE * 9 + 42)

  // Grid lines
  ctx.strokeStyle = s.line
  ctx.lineWidth = 1

  for (let rank = 0; rank < 10; rank++) {
    const y = toPixel(0, rank, flipped).y
    ctx.beginPath()
    ctx.moveTo(PADDING, y)
    ctx.lineTo(PADDING + 8 * CELL_SIZE, y)
    ctx.stroke()
  }

  for (let file = 0; file < 9; file++) {
    const x = PADDING + file * CELL_SIZE
    if (file === 0 || file === 8) {
      ctx.beginPath()
      ctx.moveTo(x, PADDING)
      ctx.lineTo(x, PADDING + 9 * CELL_SIZE)
      ctx.stroke()
    } else {
      const rt = toPixel(0, 4, flipped).y
      const rb = toPixel(0, 5, flipped).y
      ctx.beginPath()
      ctx.moveTo(x, PADDING)
      ctx.lineTo(x, Math.min(rt, rb))
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x, Math.max(rt, rb))
      ctx.lineTo(x, PADDING + 9 * CELL_SIZE)
      ctx.stroke()
    }
  }

  // Palace diagonals
  const palaces = [
    [3, 0, 5, 2], [5, 0, 3, 2],
    [3, 7, 5, 9], [5, 7, 3, 9]
  ]
  for (const [f1, r1, f2, r2] of palaces) {
    const a = toPixel(f1, r1, flipped)
    const b = toPixel(f2, r2, flipped)
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }

  // River text
  ctx.font = 'bold 26px "KaiTi", "STKaiti", serif'
  ctx.fillStyle = s.riverText
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const rt = toPixel(0, 4, flipped).y
  const rb = toPixel(0, 5, flipped).y
  const riverY = (rt + rb) / 2
  ctx.fillText(flipped ? '汉 界' : '楚 河', PADDING + 2 * CELL_SIZE, riverY)
  ctx.fillText(flipped ? '楚 河' : '汉 界', PADDING + 6 * CELL_SIZE, riverY)

  // Cross marks
  for (const pos of CROSS_MARK_POSITIONS) {
    drawCrossMark(ctx, pos.file, pos.rank, s, flipped)
  }

  // Coordinate labels
  if (showCoords) {
    ctx.font = '13px "Microsoft YaHei", sans-serif'
    ctx.fillStyle = s.line
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const blackLabels = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
    const redLabels = ['九', '八', '七', '六', '五', '四', '三', '二', '一']
    for (let i = 0; i < 9; i++) {
      const x = PADDING + i * CELL_SIZE
      const topY = toPixel(i, 9, flipped).y
      const botY = toPixel(i, 0, flipped).y
      ctx.fillText(flipped ? redLabels[i] : blackLabels[i], x, topY > botY ? topY + 13 : topY - 13)
      ctx.fillText(flipped ? blackLabels[i] : redLabels[i], x, botY > topY ? botY + 13 : botY - 13)
    }
  }
}

function drawCrossMark(ctx: CanvasRenderingContext2D, file: number, rank: number, s: typeof STYLES.wooden, flipped: boolean) {
  const { x, y } = toPixel(file, rank, flipped)
  const size = 6
  const gap = 3
  ctx.strokeStyle = s.line
  ctx.lineWidth = 1

  const drawCorner = (dx: number, dy: number) => {
    ctx.beginPath()
    ctx.moveTo(x + dx * gap, y + dy * gap)
    ctx.lineTo(x + dx * (gap + size), y + dy * gap)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x + dx * gap, y + dy * gap)
    ctx.lineTo(x + dx * gap, y + dy * (gap + size))
    ctx.stroke()
  }

  if (file > 0) { drawCorner(-1, -1); drawCorner(-1, 1) }
  if (file < 8) { drawCorner(1, -1); drawCorner(1, 1) }
}

function drawLastMove(ctx: CanvasRenderingContext2D, lastMove: Move | null, s: typeof STYLES.wooden, flipped: boolean) {
  if (!lastMove) return
  ctx.fillStyle = s.line === '#8B7355' ? 'rgba(139, 115, 85, 0.25)' : 'rgba(92, 51, 23, 0.25)'
  const from = toPixel(lastMove.from.file, lastMove.from.rank, flipped)
  ctx.fillRect(from.x - CELL_SIZE / 2, from.y - CELL_SIZE / 2, CELL_SIZE, CELL_SIZE)
  const to = toPixel(lastMove.to.file, lastMove.to.rank, flipped)
  ctx.fillRect(to.x - CELL_SIZE / 2, to.y - CELL_SIZE / 2, CELL_SIZE, CELL_SIZE)
}

function drawLegalMoves(ctx: CanvasRenderingContext2D, legalMoves: BoardPosition[], flipped: boolean) {
  for (const pos of legalMoves) {
    const { x, y } = toPixel(pos.file, pos.rank, flipped)
    ctx.beginPath()
    ctx.arc(x, y, 8, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0, 180, 0, 0.6)'
    ctx.fill()
  }
}

function drawPieces(
  ctx: CanvasRenderingContext2D,
  pieces: { piece: Piece; position: BoardPosition }[],
  selectedPosition: BoardPosition | null,
  isCheck: boolean,
  turn: Color,
  s: typeof STYLES.wooden,
  flipped: boolean
) {
  for (const { piece, position } of pieces) {
    const { x, y } = toPixel(position.file, position.rank, flipped)
    const isSelected = selectedPosition !== null &&
      selectedPosition.file === position.file &&
      selectedPosition.rank === position.rank
    const isKingInCheck = isCheck && piece.type === 'K' && piece.color === turn
    drawPiece(ctx, piece, x, y, isSelected, isKingInCheck, s)
  }
}

function drawPiece(
  ctx: CanvasRenderingContext2D,
  piece: Piece,
  x: number,
  y: number,
  isSelected: boolean,
  isKingInCheck: boolean,
  s: typeof STYLES.wooden
) {
  const isRed = piece.color === 'r'
  const mainColor = isRed ? s.red : s.black

  ctx.shadowColor = 'rgba(0,0,0,0.3)'
  ctx.shadowBlur = 4
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2

  ctx.beginPath()
  ctx.arc(x, y, PIECE_RADIUS, 0, Math.PI * 2)
  const gradient = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, PIECE_RADIUS)
  gradient.addColorStop(0, s.pieceGradLight)
  gradient.addColorStop(1, s.pieceGradDark)
  ctx.fillStyle = gradient
  ctx.fill()

  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  ctx.beginPath()
  ctx.arc(x, y, PIECE_RADIUS, 0, Math.PI * 2)
  ctx.strokeStyle = mainColor
  ctx.lineWidth = 2.5
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(x, y, PIECE_RADIUS - 4, 0, Math.PI * 2)
  ctx.strokeStyle = mainColor
  ctx.lineWidth = 1
  ctx.stroke()

  const char = PIECE_CHARS[piece.type][piece.color]
  ctx.font = `bold ${PIECE_RADIUS * 1.15}px "KaiTi", "STKaiti", "AR PL UKai CN", serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = isRed ? s.red : s.black
  ctx.fillText(char, x, y + 1)

  if (isSelected) {
    ctx.beginPath()
    ctx.arc(x, y, PIECE_RADIUS + 4, 0, Math.PI * 2)
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = 3
    ctx.stroke()
  }

  if (isKingInCheck) {
    ctx.beginPath()
    ctx.arc(x, y, PIECE_RADIUS + 5, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)'
    ctx.lineWidth = 3
    ctx.stroke()
  }
}
