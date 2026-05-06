import React from 'react'
import { useGameStore } from '../../stores/gameStore'

export default function SettingsPage() {
  const { boardStyle, showCoords, setBoardStyle, setShowCoords, config, setEngineThinking: _setET, initNewGame } = useGameStore()

  return (
    <div className="flex-1 flex flex-col h-full overflow-auto">
      <div className="px-8 py-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">设置</h2>

        <div className="space-y-6">
          {/* Engine Settings */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">对弈引擎</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">引擎状态</label>
                <div className="text-sm text-gray-400">内置 AI（Alpha-Beta 剪枝）</div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">难度等级: {config.engineDifficulty}</label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={config.engineDifficulty}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    useGameStore.getState().config.engineDifficulty = val
                  }}
                  className="w-full max-w-xs accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 max-w-xs">
                  <span>入门</span>
                  <span>大师</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Service Settings */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">AI 分析服务</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">AI 服务商</label>
                <select className="border rounded px-3 py-1.5 text-sm w-full max-w-xs">
                  <option value="claude">Claude (Anthropic)</option>
                  <option value="openai">GPT (OpenAI)</option>
                  <option value="ollama">Ollama (本地模型)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">API Key</label>
                <input
                  type="password"
                  placeholder="请输入 API Key"
                  className="border rounded px-3 py-1.5 text-sm w-full max-w-xs"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">模型</label>
                <select className="border rounded px-3 py-1.5 text-sm w-full max-w-xs">
                  <option>claude-sonnet-4-20250514</option>
                </select>
              </div>
            </div>
          </div>

          {/* UI Settings */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">界面设置</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">棋盘风格预览</label>
                <div className="flex gap-3">
                  {([
                    { value: 'wooden', label: '木质', colors: ['#DEB887', '#5C3317'] },
                    { value: 'classic', label: '经典', colors: ['#F0D9A0', '#4A3520'] },
                    { value: 'minimal', label: '简约', colors: ['#FAF0E6', '#8B7355'] }
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setBoardStyle(opt.value)}
                      className={`w-24 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                        boardStyle === opt.value
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="h-10 rounded mb-2" style={{ background: opt.colors[0] }} />
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showCoords"
                  checked={showCoords}
                  onChange={(e) => setShowCoords(e.target.checked)}
                />
                <label htmlFor="showCoords" className="text-sm text-gray-600">显示坐标</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
