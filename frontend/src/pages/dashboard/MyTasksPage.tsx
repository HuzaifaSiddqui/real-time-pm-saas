import React, { useState } from 'react'
import { CheckCircle2, Clock, Calendar, AlertCircle, Plus, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { useQuery } from '@tanstack/react-query'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useAuthStore } from '../../stores/authStore'
import { formatDate, priorityColors, statusColors, isOverdue } from '../../lib/utils'
import { TaskDetailDialog } from '../../components/tasks/TaskDetailDialog'
import { CreateTaskDialog } from '../../components/tasks/CreateTaskDialog'
import api from '../../lib/api'

export function MyTasksPage() {
  const { currentWorkspace } = useWorkspaceStore()
  const { user } = useAuthStore()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [search, setSearch] = useState('')

  const { data: projectsData } = useQuery({
    queryKey: ['workspace-projects', currentWorkspace?._id],
    queryFn: () => api.get(`/workspaces/${currentWorkspace?._id}/projects`).then((r) => r.data.projects),
    enabled: !!currentWorkspace?._id,
  })

  // Fetch all tasks across all projects
  const { data: allTasks, refetch } = useQuery({
    queryKey: ['workspace-all-tasks', currentWorkspace?._id, projectsData],
    queryFn: async () => {
      if (!projectsData || projectsData.length === 0) return []
      const taskArrays = await Promise.all(
        projectsData.map((p: any) =>
          api.get(`/projects/${p._id}/tasks`).then((r) => r.data.tasks || [])
        )
      )
      return taskArrays.flat()
    },
    enabled: !!projectsData && projectsData.length > 0,
  })

  // Filter tasks assigned to current user
  const myTasks = (allTasks || []).filter((task: any) => {
    const isAssignedToMe = task.assignee?._id === user?._id || !task.assignee
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
    const matchesSearch = !search || task.title.toLowerCase().includes(search.toLowerCase())
    return isAssignedToMe && matchesStatus && matchesPriority && matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-sm text-muted-foreground">Manage and execute your personal deliverables</p>
        </div>
        <Button onClick={() => setShowCreateTask(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Task
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36 h-9 text-xs">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      <Card>
        <CardContent className="p-0 divide-y divide-border/60">
          {myTasks.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No tasks match your filters. Great job staying on top of work!
            </div>
          ) : (
            myTasks.map((task: any) => {
              const overdue = isOverdue(task.dueDate) && task.status !== 'done'
              return (
                <div
                  key={task._id}
                  onClick={() => setSelectedTaskId(task._id)}
                  className="flex items-center justify-between p-4 hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                        task.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground/40'
                      }`}
                    >
                      {task.status === 'done' && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{task.description || 'No description'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <Badge variant="outline" className={priorityColors[task.priority] || ''}>
                      {task.priority?.toUpperCase()}
                    </Badge>

                    <Badge variant="outline" className={statusColors[task.status] || ''}>
                      {task.status?.replace('_', ' ').toUpperCase()}
                    </Badge>

                    <div className={`flex items-center gap-1 text-xs ${overdue ? 'text-rose-500 font-semibold' : 'text-muted-foreground'}`}>
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(task.dueDate)}</span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

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
        projects={projectsData || []}
      />
    </div>
  )
}
