import React from 'react'
import type { ReactNode } from 'react'

interface AppLayoutProps {
  sidebar: ReactNode
  children: ReactNode
}

export default function AppLayout({ sidebar, children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100">
      {sidebar}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
