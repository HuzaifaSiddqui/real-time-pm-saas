import { Bell, Sun, Moon, Plus, Search } from 'lucide-react'
import { Button } from '../ui/button'
import { useThemeStore } from '../../stores/themeStore'
import { useAuthStore } from '../../stores/authStore'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { getInitials } from '../../lib/utils'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useState } from 'react'

export function TopNav() {
  const { theme, toggleTheme } = useThemeStore()
  const { user } = useAuthStore()
  const { currentWorkspace } = useWorkspaceStore()
  const [showNotifs, setShowNotifs] = useState(false)

  const { data: notifsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    refetchInterval: 30000,
  })

  const unreadCount = notifsData?.unreadCount || 0

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Search tasks, projects..."
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Quick Create */}
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Create
        </Button>

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative" onClick={() => setShowNotifs(!showNotifs)}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        {/* User Avatar */}
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarFallback className="text-xs">{user ? getInitials(user.name) : 'U'}</AvatarFallback>
        </Avatar>
      </div>

      {/* Notifications Dropdown */}
      {showNotifs && (
        <div className="absolute right-4 top-14 z-50 w-80 rounded-lg border bg-popover shadow-lg">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-semibold text-sm">Notifications</span>
            <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifsData?.notifications?.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">No notifications</p>
            ) : (
              notifsData?.notifications?.slice(0, 8).map((n: any) => (
                <div key={n._id} className={`px-4 py-3 border-b last:border-0 ${!n.read ? 'bg-primary/5' : ''}`}>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message?.slice(0, 60)}...</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </header>
  )
}
