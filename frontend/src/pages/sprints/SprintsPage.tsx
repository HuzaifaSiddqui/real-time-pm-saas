import React, { useState } from 'react'
import { Zap, Plus, CheckCircle2, Calendar, Target, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Progress } from '../../components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { useQuery } from '@tanstack/react-query'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { formatDate } from '../../lib/utils'
import api from '../../lib/api'

export function SprintsPage() {
  const { currentWorkspace } = useWorkspaceStore()
  const [showCreate, setShowCreate] = useState(false)
  const [sprintName, setSprintName] = useState('')
  const [sprintGoal, setSprintGoal] = useState('')
  const [projectId, setProjectId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: projectsData } = useQuery({
    queryKey: ['workspace-projects', currentWorkspace?._id],
    queryFn: () => api.get(`/workspaces/${currentWorkspace?._id}/projects`).then((r) => r.data.projects),
    enabled: !!currentWorkspace?._id,
  })

  const { data: allSprints, refetch } = useQuery({
    queryKey: ['workspace-sprints', currentWorkspace?._id, projectsData],
    queryFn: async () => {
      if (!projectsData || projectsData.length === 0) return []
      const sprintArrays = await Promise.all(
        projectsData.map((p: any) =>
          api.get(`/projects/${p._id}/sprints`).then((r) => r.data.sprints || [])
        )
      )
      return sprintArrays.flat()
    },
    enabled: !!projectsData && projectsData.length > 0,
  })

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sprintName.trim() || !projectId) return
    setLoading(true)

    try {
      await api.post(`/projects/${projectId}/sprints`, {
        name: sprintName,
        goal: sprintGoal,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        workspace: currentWorkspace?._id,
      })
      setSprintName('')
      setSprintGoal('')
      setShowCreate(false)
      refetch()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sprints & Agile</h1>
          <p className="text-sm text-muted-foreground">Manage iterative delivery cycles, velocities, and burndowns</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Sprint
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!allSprints || allSprints.length === 0 ? (
          <div className="col-span-full p-12 text-center text-sm text-muted-foreground border rounded-xl bg-card">
            No active sprints found. Create one to begin your sprint planning!
          </div>
        ) : (
          allSprints.map((sprint: any) => {
            const stats = sprint.stats || { total: 0, completed: 0, remaining: 0 }
            const completion = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

            return (
              <Card key={sprint._id} className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant="outline"
                      className={
                        sprint.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60'
                          : 'bg-muted text-muted-foreground'
                      }
                    >
                      {sprint.status?.toUpperCase()}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(sprint.endDate)}</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-lg mb-1">{sprint.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                    <Target className="h-3.5 w-3.5 inline mr-1 text-primary" />
                    {sprint.goal || 'No sprint goal specified'}
                  </p>
                </div>

                <div className="space-y-2 pt-4 border-t border-border/60">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Sprint Progress</span>
                    <span className="font-semibold text-foreground">{completion}%</span>
                  </div>
                  <Progress value={completion} className="h-2" />
                  <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                    <span>{stats.completed} Done</span>
                    <span>{stats.inProgress || 0} In Progress</span>
                    <span>{stats.remaining} Left</span>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Sprint</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSprint} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projectsData?.map((p: any) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sprintName">Sprint Name</Label>
              <Input
                id="sprintName"
                placeholder="e.g. Sprint 3 - Auth & Security"
                value={sprintName}
                onChange={(e) => setSprintName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sprintGoal">Sprint Goal</Label>
              <textarea
                id="sprintGoal"
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="What will this sprint accomplish?"
                value={sprintGoal}
                onChange={(e) => setSprintGoal(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Sprint'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
