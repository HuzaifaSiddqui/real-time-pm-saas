import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CheckSquare, FolderKanban, Trello, Zap,
  Map, Calendar, Users, BarChart3, Settings, ChevronDown,
  Plus, LogOut, Building2
} from 'lucide-react'
import { cn, getInitials } from '../../lib/utils'
import { useAuthStore } from '../../stores/authStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Button } from '../ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '../ui/dropdown-menu'
import { disconnectSocket } from '../../lib/socket'
import api from '../../lib/api'
import { useQuery } from '@tanstack/react-query'

const navItems = [
  { to: '/overview', icon: LayoutDashboard, label: 'Overview' },
  { to: '/my-tasks', icon: CheckSquare, label: 'My Tasks' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/kanban', icon: Trello, label: 'Kanban Board' },
  { to: '/sprints', icon: Zap, label: 'Sprints' },
  { to: '/roadmap', icon: Map, label: 'Roadmaps' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/team', icon: Users, label: 'Team' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspaceStore()
  const navigate = useNavigate()

  const { data: workspacesData } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => api.get('/workspaces').then(r => r.data.workspaces),
  })

  const handleLogout = () => {
    logout()
    disconnectSocket()
    navigate('/login')
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-sidebar text-sidebar-foreground">
      {/* Workspace Switcher */}
      <div className="p-3 border-b">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-between px-2 h-10">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                  {currentWorkspace ? getInitials(currentWorkspace.name) : 'W'}
                </div>
                <span className="text-sm font-semibold truncate">{currentWorkspace?.name || 'Select Workspace'}</span>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(workspacesData || workspaces).map((ws: any) => (
              <DropdownMenuItem key={ws._id} onClick={() => setCurrentWorkspace(ws)} className="cursor-pointer">
                <Building2 className="mr-2 h-4 w-4" />
                <span className="truncate">{ws.name}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Create Workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 px-2 h-10">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">{user ? getInitials(user.name) : 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start" side="top">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
