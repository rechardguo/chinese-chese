import { useEffect } from 'react'
import { usePuzzleStore } from '../../stores/puzzleStore'
import { puzzleCategories } from '@shared/data/puzzles'
import PuzzleSolvingView from './PuzzleSolvingView'

const CATEGORY_ICONS: Record<string, string> = {
  'basic-kills': '基础杀法',
  'chariot-kills': '车杀法',
  'horse-kills': '马杀法',
  'cannon-kills': '炮杀法',
  'combination-kills': '组合杀法',
  'endgame-patterns': '残局模式'
}

const DIFFICULTY_LABEL: Record<string, { text: string; cls: string }> = {
  beginner: { text: '入门', cls: 'bg-green-100 text-green-700' },
  intermediate: { text: '进阶', cls: 'bg-yellow-100 text-yellow-700' },
  advanced: { text: '高级', cls: 'bg-red-100 text-red-700' }
}

function CategorySelectionView() {
  const { selectCategory, progressMap } = usePuzzleStore()

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-4 bg-white border-b">
        <h2 className="text-xl font-bold text-gray-800">杀法练习</h2>
        <p className="text-sm text-gray-500 mt-1">选择杀法类别开始练习</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {puzzleCategories.map(category => {
            const total = category.puzzles.length
            const completed = category.puzzles.filter(p => progressMap[p.id]?.completed).length
            const percent = total > 0 ? (completed / total) * 100 : 0
            const diff = DIFFICULTY_LABEL[category.difficulty]

            return (
              <button
                key={category.id}
                onClick={() => { selectCategory(category.id) }}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-2xl mb-1">{CATEGORY_ICONS[category.id] || '棋'}</div>
                    <h3 className="font-bold text-gray-800">{category.name}</h3>
                    <p className="text-xs text-gray-400">{category.nameEn}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${diff.cls}`}>
                    {diff.text}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{category.description}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  <span>{total} 题</span>
                  {completed > 0 && <span>{completed} 已完成</span>}
                </div>
                {total > 0 && (
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${percent}%` }} />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function PuzzleListView() {
  const { selectedCategoryId, startPuzzle, progressMap, setView } = usePuzzleStore()
  const category = puzzleCategories.find(c => c.id === selectedCategoryId)

  if (!category) return null

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b shrink-0">
        <button onClick={() => setView('categories')} className="text-gray-400 hover:text-gray-600 text-sm">
          ← 返回
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-800">{category.name}</h2>
          <p className="text-xs text-gray-400">{category.description}</p>
        </div>
        <span className="text-sm text-gray-400">{category.puzzles.length} 题</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {category.puzzles.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            <div className="text-4xl mb-3">🚧</div>
            <p>题目正在制作中，敬请期待</p>
          </div>
        ) : (
          <div className="space-y-2">
            {category.puzzles.map((puzzle, index) => {
              const progress = progressMap[puzzle.id]
              const isCompleted = progress?.completed ?? false

              return (
                <button
                  key={puzzle.id}
                  onClick={() => startPuzzle(puzzle)}
                  className="w-full flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all text-left"
                >
                  <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600 shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{puzzle.name}</span>
                      {isCompleted && <span className="text-green-500 text-sm">✓</span>}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{puzzle.description}</p>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={i < puzzle.difficulty ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {Math.ceil(puzzle.moves.length / 2)} 步
                  </span>
                  {progress?.bestTimeMs != null && (
                    <span className="text-xs text-gray-400 shrink-0">
                      {progress.bestTimeMs < 1000
                        ? `${progress.bestTimeMs}ms`
                        : `${(progress.bestTimeMs / 1000).toFixed(1)}秒`}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PuzzlePage() {
  const { view, loadProgress } = usePuzzleStore()

  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  const renderView = () => { 
  
    switch (view) {
      case 'categories':
        return <CategorySelectionView />
      case 'puzzle-list':
        return <PuzzleListView />
      case 'solving':
        return <PuzzleSolvingView />
      default:
        return null
    }
  
  }


  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {renderView()}
    </div>
  )
}
