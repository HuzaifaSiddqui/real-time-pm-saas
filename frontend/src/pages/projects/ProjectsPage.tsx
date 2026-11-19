import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderKanban, Plus, Calendar, Users, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Progress } from '../../components/ui/progress'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { useQuery } from '@tanstack/react-query'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { formatDate, getInitials, healthColors, priorityColors } from '../../lib/utils'
import { CreateProjectDialog } from '../../components/projects/CreateProjectDialog'
import api from '../../lib/api'

export function ProjectsPage() {
  const { currentWorkspace } = useWorkspaceStore()
  const [showCreate, setShowCreate] = useState(false)

  const { data: projects, refetch } = useQuery({
    queryKey: ['workspace-projects', currentWorkspace?._id],
    queryFn: () => api.get(`/workspaces/${currentWorkspace?._id}/projects`).then((r) => r.data.projects),
    enabled: !!currentWorkspace?._id,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Manage ongoing initiatives, timelines, and team allocations</p>
        </div>
        <Button onClick={() => setShowCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!projects || projects.length === 0 ? (
          <div className="col-span-full p-12 text-center text-sm text-muted-foreground border rounded-xl bg-card">
            No projects found. Click "New Project" to start one!
          </div>
        ) : (
          projects.map((p: any) => (
            <Card key={p._id} className="hover:border-primary/50 transition-all flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: p.color || '#6366f1' }}
                    />
                    <Badge variant="outline" className={healthColors[p.health] || ''}>
                      {p.health?.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <Badge variant="outline" className={priorityColors[p.priority] || ''}>
                    {p.priority?.toUpperCase()}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-bold">{p.name}</CardTitle>
                <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                  {p.description || 'No description provided.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span className="font-semibold text-foreground">{p.progress || 0}%</span>
                  </div>
                  <Progress value={p.progress || 0} className="h-2" />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(p.dueDate)}</span>
                  </div>

                  <Link to={`/projects/${p._id}`}>
                    <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs px-2 hover:text-primary">
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CreateProjectDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onProjectCreated={() => refetch()}
      />
    </div>
  )
}
