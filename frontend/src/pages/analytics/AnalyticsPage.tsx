import React from 'react'
import { BarChart3, TrendingUp, PieChart as PieIcon, CheckCircle2, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Progress } from '../../components/ui/progress'
import { useQuery } from '@tanstack/react-query'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import api from '../../lib/api'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6']

export function AnalyticsPage() {
  const { currentWorkspace } = useWorkspaceStore()

  const { data: analytics } = useQuery({
    queryKey: ['workspace-analytics', currentWorkspace?._id],
    queryFn: () => api.get(`/workspaces/${currentWorkspace?._id}/analytics`).then((r) => r.data),
    enabled: !!currentWorkspace?._id,
  })

  const { data: workloadData } = useQuery({
    queryKey: ['workspace-workload', currentWorkspace?._id],
    queryFn: () => api.get(`/workspaces/${currentWorkspace?._id}/workload`).then((r) => r.data.workload),
    enabled: !!currentWorkspace?._id,
  })

  const taskStatusData = (analytics?.taskStatusDist || []).map((item: any) => ({
    name: item._id?.replace('_', ' ').toUpperCase(),
    value: item.count,
  }))

  const memberWorkloadChart = (workloadData || []).map((w: any) => ({
    name: w.member?.name?.split(' ')[0] || 'User',
    hours: w.estimatedHours || 0,
    tasks: w.taskCount || 0,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics & Reports</h1>
        <p className="text-sm text-muted-foreground">Real-time team productivity metrics, burndowns, and task distribution</p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-xs text-muted-foreground font-medium">Total Deliverables</p>
          <p className="text-2xl font-bold mt-1">{analytics?.overview?.totalTasks || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Across all workspace projects</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground font-medium">Completed Successfully</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{analytics?.overview?.completedTasks || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Completion rate: {analytics?.overview?.completionRate || 0}%</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground font-medium">Overdue Backlog</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{analytics?.overview?.overdueTasks || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Past scheduled deadlines</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Member Workload (Estimated Hours)</CardTitle>
            <CardDescription>Capacity allocation per engineer</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {memberWorkloadChart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No workload data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberWorkloadChart}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} name="Est. Hours" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Task Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Task Status Breakdown</CardTitle>
            <CardDescription>Current workflow pipeline distribution</CardDescription>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
            {taskStatusData.length === 0 ? (
              <div className="text-xs text-muted-foreground">No task status records.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {taskStatusData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
