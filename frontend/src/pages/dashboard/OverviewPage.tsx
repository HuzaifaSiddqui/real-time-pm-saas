import React, { useState } from 'react'
import {
  FolderKanban, CheckSquare, Clock, AlertTriangle,
  ArrowUpRight, Plus, Activity, CheckCircle2, TrendingUp
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Progress } from '../../components/ui/progress'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { useQuery } from '@tanstack/react-query'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { formatDate, formatRelativeTime, getInitials, priorityColors, statusColors, healthColors } from '../../lib/utils'
import { TaskDetailDialog } from '../../components/tasks/TaskDetailDialog'
import { CreateTaskDialog } from '../../components/tasks/CreateTaskDialog'
import api from '../../lib/api'

export function OverviewPage() {
  const { currentWorkspace } = useWorkspaceStore()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showCreateTask, setShowCreateTask] = useState(false)

  const { data: analytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ['workspace-analytics', currentWorkspace?._id],
    queryFn: () => api.get(`/workspaces/${currentWorkspace?._id}/analytics`).then((r) => r.data),
    enabled: !!currentWorkspace?._id,
  })

  const { data: projectsData } = useQuery({
    queryKey: ['workspace-projects', currentWorkspace?._id],
    queryFn: () => api.get(`/workspaces/${currentWorkspace?._id}/projects`).then((r) => r.data.projects),
    enabled: !!currentWorkspace?._id,
  })

  const { data: activityData } = useQuery({
    queryKey: ['workspace-activity', currentWorkspace?._id],
    queryFn: () => api.get(`/workspaces/${currentWorkspace?._id}/activity`).then((r) => r.data.logs),
    enabled: !!currentWorkspace?._id,
  })

  const overview = analytics?.overview || {
    totalProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    activeTasks: 0,
    completionRate: 0,
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">
            Welcome to {currentWorkspace?.name || 'Workspace'}. Here's what's happening across your team.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreateTask(true)} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-emerald-600 font-semibold">{overview.activeProjects} active</span> projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.activeTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of {overview.totalTasks} total tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.completionRate}%</div>
            <div className="mt-2">
              <Progress value={overview.completionRate} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{overview.overdueTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires immediate attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Health & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Projects Health & Progress</CardTitle>
              <CardDescription>Live health tracking based on deadlines and blockers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!projectsData || projectsData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No projects created yet.</p>
              ) : (
                projectsData.map((project: any) => (
                  <div key={project._id} className="p-4 rounded-xl border border-border/50 bg-card hover:border-primary/40 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.color || '#6366f1' }}
                        />
                        <span className="font-semibold text-sm">{project.name}</span>
                      </div>
                      <Badge variant="outline" className={healthColors[project.health] || ''}>
                        {project.health?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{project.description}</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span className="font-medium text-foreground">{project.progress || 0}%</span>
                      </div>
                      <Progress value={project.progress || 0} className="h-2" />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Activity Feed */}
        <div>
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </div>
              <CardDescription>Workspace audit trail</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4 pr-1">
              {!activityData || activityData.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No recent activity.</p>
              ) : (
                activityData.slice(0, 7).map((log: any) => (
                  <div key={log._id} className="flex gap-3 text-xs pb-3 border-b border-border/40 last:border-0 last:pb-0">
                    <Avatar className="h-7 w-7 mt-0.5">
                      <AvatarFallback className="text-[10px]">
                        {log.actor ? getInitials(log.actor.name) : 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {log.actor?.name || 'Someone'}{' '}
                        <span className="font-normal text-muted-foreground">
                          {log.action?.replace('_', ' ')}
                        </span>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatRelativeTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Task Detail Dialog */}
      <TaskDetailDialog
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={() => refetchAnalytics()}
      />

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onTaskCreated={() => refetchAnalytics()}
        projects={projectsData || []}
      />
    </div>
  )
}
