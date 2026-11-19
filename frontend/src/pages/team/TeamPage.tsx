import React, { useState } from 'react'
import { Users, UserPlus, Mail, Shield, Check, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { useQuery } from '@tanstack/react-query'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { getInitials } from '../../lib/utils'
import api from '../../lib/api'

export function TeamPage() {
  const { currentWorkspace } = useWorkspaceStore()
  const [showInvite, setShowInvite] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [loading, setLoading] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState('')

  const { data: members, refetch } = useQuery({
    queryKey: ['workspace-members', currentWorkspace?._id],
    queryFn: () => api.get(`/workspaces/${currentWorkspace?._id}/members`).then((r) => r.data.members),
    enabled: !!currentWorkspace?._id,
  })

  const { data: workloadData } = useQuery({
    queryKey: ['workspace-workload', currentWorkspace?._id],
    queryFn: () => api.get(`/workspaces/${currentWorkspace?._id}/workload`).then((r) => r.data.workload),
    enabled: !!currentWorkspace?._id,
  })

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !currentWorkspace) return
    setLoading(true)

    try {
      await api.post(`/workspaces/${currentWorkspace._id}/invite`, { email, role })
      setInviteSuccess(`Invitation sent to ${email}`)
      setEmail('')
      setTimeout(() => setInviteSuccess(''), 4000)
      setShowInvite(false)
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team & Workload</h1>
          <p className="text-sm text-muted-foreground">Manage workspace collaborators, access tiers, and effort capacity</p>
        </div>
        <Button onClick={() => setShowInvite(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Colleague
        </Button>
      </div>

      {inviteSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm font-medium">
          {inviteSuccess}
        </div>
      )}

      {/* Member List */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace Collaborators</CardTitle>
          <CardDescription>All users with access to {currentWorkspace?.name}</CardDescription>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border/60">
          {!members || members.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No members found.</div>
          ) : (
            members.map((m: any) => {
              const workload = workloadData?.find((w: any) => w.member?._id === m.user?._id)
              return (
                <div key={m._id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs font-bold">
                        {m.user ? getInitials(m.user.name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{m.user?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{m.user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {workload && (
                      <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        <span>{workload.taskCount || 0} active tasks ({workload.estimatedHours || 0}h est.)</span>
                      </div>
                    )}
                    <Badge variant="outline" className="capitalize text-xs">
                      {m.role?.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Invite Modal */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="inviteEmail">Email Address</Label>
              <Input
                id="inviteEmail"
                type="email"
                placeholder="colleague@acme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Role Access</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin (Full permissions)</SelectItem>
                  <SelectItem value="project_manager">Project Manager</SelectItem>
                  <SelectItem value="member">Member (Create & edit assigned tasks)</SelectItem>
                  <SelectItem value="viewer">Viewer (Read-only)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowInvite(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
