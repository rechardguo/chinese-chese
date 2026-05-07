import React, { useRef, useEffect } from 'react'
import type { Move } from '@shared/types/chess'

interface MoveListProps {
  moves: Move[]
  currentMoveIndex: number
  onMoveClick?: (index: number) => void
}

export default function MoveList({ moves, currentMoveIndex, onMoveClick }: MoveListProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current
      const activeItem = container.querySelector('.move-active')
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [currentMoveIndex])

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 bg-gray-50 border-b text-sm font-medium text-gray-600">
        走法记录
      </div>
      <div ref={containerRef} className="flex-1 overflow-y-auto p-2">
        {moves.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            暂无走法
          </div>
        ) : (
          <div className="space-y-0.5">
            {moves.map((move, index) => {
              const roundNum = Math.floor(index / 2) + 1
              const isRed = index % 2 === 0
              return (
                <button
                  key={index}
                  onClick={onMoveClick ? () => onMoveClick(index) : undefined}
                  className={`w-full text-left px-2 py-1 rounded text-sm flex items-center gap-2 ${
                    index === currentMoveIndex
                      ? 'move-active bg-blue-100 text-blue-800'
                      : onMoveClick
                        ? 'hover:bg-gray-100 text-gray-700'
                        : 'text-gray-700 cursor-default'
                  }`}
                >
                  {isRed && (
                    <span className="text-gray-400 w-8 shrink-0">{roundNum}.</span>
                  )}
                  {!isRed && <span className="w-8 shrink-0" />}
                  <span className={`w-2 h-2 rounded-full shrink-0 ${isRed ? 'bg-red-500' : 'bg-gray-800'}`} />
                  <span className="font-kai">{move.notation}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
