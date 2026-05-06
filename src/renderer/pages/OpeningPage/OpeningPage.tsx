import React from 'react'

export default function OpeningPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full">
      <div className="text-center">
        <div className="text-6xl mb-4">📖</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">开局定式</h2>
        <p className="text-gray-500">开局定式学习功能即将上线</p>
        <div className="mt-6 space-y-2 text-sm text-gray-400">
          <p>包含以下开局体系：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>中炮类（中炮对屏风马、中炮对反宫马等）</li>
            <li>飞相局</li>
            <li>仙人指路</li>
            <li>士角炮</li>
            <li>过宫炮</li>
            <li>起马局</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
