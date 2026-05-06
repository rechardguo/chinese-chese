import React from 'react'

export default function AnalysisPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full">
      <div className="text-center">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">棋局分析</h2>
        <p className="text-gray-500">AI 棋局分析功能即将上线</p>
        <div className="mt-6 space-y-2 text-sm text-gray-400">
          <p>支持的 AI 服务：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Claude (Anthropic)</li>
            <li>GPT (OpenAI)</li>
            <li>Ollama (本地模型)</li>
          </ul>
          <p className="mt-4">分析功能：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>逐手评估（好棋、失误、漏着、败着）</li>
            <li>关键局面点评</li>
            <li>替代走法建议</li>
            <li>全局总结和准确率</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
