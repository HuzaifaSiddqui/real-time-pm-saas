import React, { useState, useEffect } from 'react'
import {
  Plus, MoreHorizontal, Calendar, Clock,
  CheckCircle2, AlertCircle, ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { formatDate, getInitials, priorityColors, statusColors } from '../../lib/utils'
import { TaskDetailDialog } from '../../components/tasks/TaskDetailDialog'
import { CreateTaskDialog } from '../../components/tasks/CreateTaskDialog'
import { getSocket } from '../../lib/socket'
import api from '../../lib/api'

const COLUMNS = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'in_review', title: 'In Review' },
  { id: 'blocked', title: 'Blocked' },
  { id: 'done', title: 'Done' },
]

export function KanbanPage() {
  const { currentWorkspace } = useWorkspaceStore()
  const queryClient = useQueryClient()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [createColumnStatus, setCreateColumnStatus] = useState('todo')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all')

  const { data: projectsData } = useQuery({
    queryKey: ['workspace-projects', currentWorkspace?._id],
    queryFn: () => api.get(`/workspaces/${currentWorkspace?._id}/projects`).then((r) => r.data.projects),
    enabled: !!currentWorkspace?._id,
  })

  const { data: allTasks, refetch } = useQuery({
    queryKey: ['kanban-tasks', currentWorkspace?._id, selectedProjectId, projectsData],
    queryFn: async () => {
      if (!projectsData || projectsData.length === 0) return []
      const targetProjects =
        selectedProjectId === 'all'
          ? projectsData
          : projectsData.filter((p: any) => p._id === selectedProjectId)

      const taskArrays = await Promise.all(
        targetProjects.map((p: any) =>
          api.get(`/projects/${p._id}/tasks`).then((r) => r.data.tasks || [])
        )
      )
      return taskArrays.flat()
    },
    enabled: !!projectsData && projectsData.length > 0,
  })

  // Real-time socket updates for kanban
  useEffect(() => {
    const socket = getSocket()
    const handleTaskUpdated = () => refetch()
    const handleTaskCreated = () => refetch()
    const handleTaskDeleted = () => refetch()

    socket.on('task:updated', handleTaskUpdated)
    socket.on('task:created', handleTaskCreated)
    socket.on('task:deleted', handleTaskDeleted)

    return () => {
      socket.off('task:updated', handleTaskUpdated)
      socket.off('task:created', handleTaskCreated)
      socket.off('task:deleted', handleTaskDeleted)
    }
  }, [refetch])

  const handleMoveStatus = async (e: React.MouseEvent, taskId: string, nextStatus: string) => {
    e.stopPropagation()
    try {
      await api.put(`/tasks/${taskId}`, { status: nextStatus })
      refetch()
    } catch (err) {
      console.error(err)
    }
  }

  const handleQuickAdd = (statusId: string) => {
    setCreateColumnStatus(statusId)
    setShowCreateTask(true)
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kanban Board</h1>
          <p className="text-sm text-muted-foreground">Real-time workflow visualization across all stages</p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-48 h-9 text-xs">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projectsData?.map((p: any) => (
                <SelectItem key={p._id} value={p._id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => handleQuickAdd('todo')} className="gap-2">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Board Columns Grid */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colTasks = (allTasks || []).filter((t: any) => t.status === col.id)

          return (
            <div
              key={col.id}
              className="w-80 flex-shrink-0 flex flex-col rounded-xl bg-slate-100/70 dark:bg-muted/40 border border-border/50 max-h-full"
            >
              {/* Column Header */}
              <div className="p-3 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs tracking-wide uppercase text-foreground">
                    {col.title}
                  </span>
                  <span className="h-5 w-5 rounded-full bg-background border text-[11px] font-bold flex items-center justify-center text-muted-foreground">
                    {colTasks.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground"
                  onClick={() => handleQuickAdd(col.id)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Task Cards Column */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                {colTasks.map((task: any) => (
                  <Card
                    key={task._id}
                    onClick={() => setSelectedTaskId(task._id)}
                    className="p-3.5 shadow-xs hover:border-primary/50 cursor-pointer transition-all bg-card border-border/70 group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${priorityColors[task.priority] || ''}`}>
                        {task.priority?.toUpperCase()}
                      </Badge>
                      {task.project?.name && (
                        <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                          {task.project.name}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                      {task.title}
                    </h4>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[9px]">
                            {task.assignee ? getInitials(task.assignee.name) : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[11px] truncate max-w-[80px]">
                          {task.assignee?.name || 'Unassigned'}
                        </span>
                      </div>

                      {/* Move to next column quick shortcut */}
                      {col.id !== 'done' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-[10px] gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            const nextIdx = COLUMNS.findIndex((c) => c.id === col.id) + 1
                            if (nextIdx < COLUMNS.length) {
                              handleMoveStatus(e, task._id, COLUMNS[nextIdx].id)
                            }
                          }}
                        >
                          Next <ArrowRight className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <TaskDetailDialog
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={() => refetch()}
      />

      <CreateTaskDialog
        open={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onTaskCreated={() => refetch()}
        defaultStatus={createColumnStatus}
        defaultProjectId={selectedProjectId !== 'all' ? selectedProjectId : undefined}
        projects={projectsData || []}
      />
    </div>
  )
}
