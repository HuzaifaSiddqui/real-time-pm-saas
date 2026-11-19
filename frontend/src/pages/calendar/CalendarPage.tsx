import React, { useState } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { formatDate, priorityColors } from '../../lib/utils'
import { TaskDetailDialog } from '../../components/tasks/TaskDetailDialog'
import api from '../../lib/api'

export function CalendarPage() {
  const { currentWorkspace } = useWorkspaceStore()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const { data: projectsData } = useQuery({
    queryKey: ['workspace-projects', currentWorkspace?._id],
    queryFn: () => api.get(`/workspaces/${currentWorkspace?._id}/projects`).then((r) => r.data.projects),
    enabled: !!currentWorkspace?._id,
  })

  const { data: allTasks } = useQuery({
    queryKey: ['calendar-tasks', currentWorkspace?._id, projectsData],
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Deliverables Calendar</h1>
        <p className="text-sm text-muted-foreground">Schedule of milestone releases, task due dates, and sprint deadlines</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!allTasks || allTasks.length === 0 ? (
          <Card className="col-span-full p-12 text-center text-sm text-muted-foreground">
            No scheduled deliverables found.
          </Card>
        ) : (
          allTasks.map((task: any) => (
            <Card
              key={task._id}
              onClick={() => setSelectedTaskId(task._id)}
              className="p-4 cursor-pointer hover:border-primary/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className={priorityColors[task.priority] || ''}>
                    {task.priority?.toUpperCase()}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    <span>{formatDate(task.dueDate)}</span>
                  </div>
                </div>
                <h4 className="font-semibold text-sm mb-1">{task.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">{task.description || 'No description'}</p>
              </div>

              <div className="pt-3 border-t border-border/40 mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{task.project?.name || 'Project Task'}</span>
                <span className="capitalize font-medium text-foreground">{task.status?.replace('_', ' ')}</span>
              </div>
            </Card>
          ))
        )}
      </div>

      <TaskDetailDialog
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  )
}
