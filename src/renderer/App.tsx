import { useState, useEffect } from 'react'
import AppLayout from './components/Layout/AppLayout'
import Sidebar from './components/Layout/Sidebar'
import PlayPage from './pages/PlayPage/PlayPage'
import LanPage from './pages/LanPage/LanPage'
import PuzzlePage from './pages/PuzzlePage/PuzzlePage'
import OpeningPage from './pages/OpeningPage/OpeningPage'
import AnalysisPage from './pages/AnalysisPage/AnalysisPage'
import SettingsPage from './pages/SettingsPage/SettingsPage'
import { useGameStore } from './stores/gameStore'
import type { LANMessage } from '@shared/types/ipc'

export default function App() {
  const [currentPage, setCurrentPage] = useState('play')
  const { handleRemoteMove, setLanConnected, resign } = useGameStore()

  useEffect(() => {
    const unsubMsg = window.api.lan.onMessage((msg: LANMessage) => {
      if (msg.type === 'move') {
        handleRemoteMove(msg.iccs)
      } else if (msg.type === 'resign') {
        resign()
      } else if (msg.type === 'undo-accept') {
        useGameStore.getState().undoMove()
      } else if (msg.type === 'new-game') {
        useGameStore.getState().initNewGame('lan', {
          playerColor: useGameStore.getState().playerColor
        })
      }
    })

    const unsubDisconnect = window.api.lan.onOpponentDisconnected(() => {
      setLanConnected(false)
    })

    return () => {
      unsubMsg()
      unsubDisconnect()
    }
  }, [handleRemoteMove, setLanConnected, resign])

  const renderPage = () => {
    switch (currentPage) {
      case 'play':
        return <PlayPage />
      case 'lan':
        return <LanPage onNavigate={setCurrentPage} />
      case 'puzzle':
        return <PuzzlePage />
      case 'opening':
        return <OpeningPage />
      case 'analysis':
        return <AnalysisPage />
      case 'settings':
        return <SettingsPage />
      default:
        return <PlayPage />
    }
  }

  return (
    <AppLayout
      sidebar={<Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />}
    >
      {renderPage()}
    </AppLayout>
  )
}
