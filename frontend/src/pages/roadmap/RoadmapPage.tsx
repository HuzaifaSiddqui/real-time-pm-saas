import React from 'react'
import { Map, Calendar, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { formatDate, healthColors } from '../../lib/utils'
import api from '../../lib/api'

export function RoadmapPage() {
  const { currentWorkspace } = useWorkspaceStore()

  const { data: projectsData } = useQuery({
    queryKey: ['workspace-projects', currentWorkspace?._id],
    queryFn: () => api.get(`/workspaces/${currentWorkspace?._id}/projects`).then((r) => r.data.projects),
    enabled: !!currentWorkspace?._id,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Project Roadmaps</h1>
        <p className="text-sm text-muted-foreground">High-level timeline and milestones across all initiatives</p>
      </div>

      <div className="space-y-6">
        {!projectsData || projectsData.length === 0 ? (
          <Card className="p-12 text-center text-sm text-muted-foreground">
            No projects found on the roadmap.
          </Card>
        ) : (
          projectsData.map((project: any) => (
            <Card key={project._id} className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: project.color || '#6366f1' }} />
                    <h3 className="text-lg font-bold">{project.name}</h3>
                    <Badge variant="outline" className={healthColors[project.health] || ''}>
                      {project.health?.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{project.description}</p>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(project.startDate)} → {formatDate(project.dueDate)}</span>
                  </div>
                </div>
              </div>

              {/* Visual Gantt Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground font-medium">
                  <span>Planning & Execution</span>
                  <span>{project.progress || 0}% Complete</span>
                </div>
                <div className="h-4 w-full bg-secondary rounded-full overflow-hidden flex">
                  <div
                    className="h-full transition-all rounded-full"
                    style={{
                      width: `${project.progress || 0}%`,
                      backgroundColor: project.color || '#6366f1',
                    }}
                  />
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
