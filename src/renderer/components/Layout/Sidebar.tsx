import React from 'react'

interface SidebarProps {
  currentPage: string
  onNavigate: (page: string) => void
}

const menuItems = [
  { id: 'play', label: '对弈', icon: '♟' },
  { id: 'lan', label: '联机大厅', icon: '🌐' },
  { id: 'puzzle', label: '杀法练习', icon: '🎯' },
  { id: 'opening', label: '开局定式', icon: '📖' },
  { id: 'analysis', label: '棋局分析', icon: '📊' },
  { id: 'settings', label: '设置', icon: '⚙' }
]

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <div className="w-52 bg-gray-800 text-white flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-gray-700">
        <h1 className="text-xl font-bold tracking-wide">象棋训练大师</h1>
        <p className="text-xs text-gray-400 mt-1">Chinese Chess Trainer</p>
      </div>
      <nav className="flex-1 py-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full text-left px-5 py-3 flex items-center gap-3 transition-colors ${
              currentPage === item.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-gray-700 text-xs text-gray-500">
        v1.0.0
      </div>
    </div>
  )
}
