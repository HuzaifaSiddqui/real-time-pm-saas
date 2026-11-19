import React, { useEffect } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'
import { useAuthStore } from '../../stores/authStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { getSocket } from '../../lib/socket'
import api from '../../lib/api'

export function AppLayout() {
  const { isAuthenticated, token } = useAuthStore()
  const { currentWorkspace, setWorkspaces, setCurrentWorkspace } = useWorkspaceStore()

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch workspaces
      api.get('/workspaces').then((res) => {
        const list = res.data.workspaces || []
        setWorkspaces(list)
        if (!currentWorkspace && list.length > 0) {
          setCurrentWorkspace(list[0])
        }
      }).catch(console.error)

      // Connect Socket
      const socket = getSocket()
      if (currentWorkspace?._id) {
        socket.emit('join:workspace', currentWorkspace._id)
      }

      return () => {
        if (currentWorkspace?._id) {
          socket.emit('leave:workspace', currentWorkspace._id)
        }
      }
    }
  }, [isAuthenticated, currentWorkspace?._id])

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
