import React from 'react'
import type { ReactNode } from 'react'

interface AppLayoutProps {
  sidebar: ReactNode
  children: ReactNode
}

export default function AppLayout({ sidebar, children }: AppLayoutProps) {
  return (
    <div className="flex bg-gray-100" style={{ height: '100dvh' }}>
      {sidebar}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
