import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Plus, CheckCircle2, Calendar,
  Users, BarChart2, Trello, Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Progress } from '../../components/ui/progress'
import { useQuery } from '@tanstack/react-query'
import { formatDate, priorityColors, statusColors, healthColors, isOverdue } from '../../lib/utils'
import { TaskDetailDialog } from '../../components/tasks/TaskDetailDialog'
import { CreateTaskDialog } from '../../components/tasks/CreateTaskDialog'
import api from '../../lib/api'

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [activeTab, setActiveTab] = useState<'tasks' | 'sprints' | 'overview'>('tasks')

  const { data: projectData, refetch: refetchProject } = useQuery({
    queryKey: ['project-detail', id],
    queryFn: () => api.get(`/projects/${id}`).then((r) => r.data),
    enabled: !!id,
  })

  const { data: tasksData, refetch: refetchTasks } = useQuery({
    queryKey: ['project-tasks', id],
    queryFn: () => api.get(`/projects/${id}/tasks`).then((r) => r.data.tasks),
    enabled: !!id,
  })

  const { data: sprintsData } = useQuery({
    queryKey: ['project-sprints', id],
    queryFn: () => api.get(`/projects/${id}/sprints`).then((r) => r.data.sprints),
    enabled: !!id,
  })

  const project = projectData?.project
  const stats = projectData?.stats || { total: 0, done: 0, inProgress: 0, blocked: 0 }

  if (!project) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading project...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/projects">
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            <ArrowLeft className="h-4 w-4" /> Back to Projects
          </Button>
        </Link>
      </div>

      {/* Project Banner Header */}
      <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: project.color || '#6366f1' }} />
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant="outline" className={healthColors[project.health] || ''}>
              {project.health?.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">{project.description}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => setShowCreateTask(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Task
          </Button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Tasks</p>
          <p className="text-xl font-bold mt-1">{stats.total || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Completed</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{stats.done || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">In Progress</p>
          <p className="text-xl font-bold text-indigo-600 mt-1">{stats.inProgress || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Blocked</p>
          <p className="text-xl font-bold text-rose-600 mt-1">{stats.blocked || 0}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex gap-4">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'tasks' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Tasks List ({tasksData?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('sprints')}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'sprints' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Sprints ({sprintsData?.length || 0})
        </button>
      </div>

      {activeTab === 'tasks' ? (
        <Card>
          <CardContent className="p-0 divide-y divide-border/60">
            {!tasksData || tasksData.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">No tasks yet.</div>
            ) : (
              tasksData.map((task: any) => (
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
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!sprintsData || sprintsData.length === 0 ? (
            <div className="col-span-full p-12 text-center text-sm text-muted-foreground">No sprints configured.</div>
          ) : (
            sprintsData.map((s: any) => (
              <Card key={s._id} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-base">{s.name}</h3>
                  <Badge variant="outline">{s.status?.toUpperCase()}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-4">{s.goal || 'No goal set'}</p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{s.stats?.completed || 0} completed</span>
                  <span>{s.stats?.remaining || 0} remaining</span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      <TaskDetailDialog
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={() => {
          refetchTasks()
          refetchProject()
        }}
      />

      <CreateTaskDialog
        open={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onTaskCreated={() => {
          refetchTasks()
          refetchProject()
        }}
        defaultProjectId={id}
        projects={project ? [project] : []}
      />
    </div>
  )
}
