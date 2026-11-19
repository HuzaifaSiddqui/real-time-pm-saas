import React, { useState } from 'react'
import { Settings as SettingsIcon, Building2, User as UserIcon, Shield, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { useAuthStore } from '../../stores/authStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import api from '../../lib/api'

export function SettingsPage() {
  const { user, updateUser } = useAuthStore()
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore()
  const [userName, setUserName] = useState(user?.name || '')
  const [userBio, setUserBio] = useState(user?.bio || '')
  const [wsName, setWsName] = useState(currentWorkspace?.name || '')
  const [wsDesc, setWsDesc] = useState(currentWorkspace?.description || '')
  const [savedUser, setSavedUser] = useState(false)
  const [savedWs, setSavedWs] = useState(false)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await api.put('/auth/profile', { name: userName, bio: userBio })
      updateUser(res.data.user)
      setSavedUser(true)
      setTimeout(() => setSavedUser(false), 3000)
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentWorkspace) return
    try {
      const res = await api.put(`/workspaces/${currentWorkspace._id}`, {
        name: wsName,
        description: wsDesc,
      })
      setCurrentWorkspace(res.data.workspace)
      setSavedWs(true)
      setTimeout(() => setSavedWs(false), 3000)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your personal profile and workspace configurations</p>
      </div>

      {/* User Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-primary" />
            <CardTitle>Personal Profile</CardTitle>
          </div>
          <CardDescription>Your public identity across tasks, discussions, and activity logs</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="profName">Display Name</Label>
                <Input
                  id="profName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profEmail">Email</Label>
                <Input id="profEmail" value={user?.email || ''} disabled className="opacity-70" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profBio">Bio / Headline</Label>
              <Input
                id="profBio"
                placeholder="Product Designer & Full-stack Engineer"
                value={userBio}
                onChange={(e) => setUserBio(e.target.value)}
              />
            </div>

            <Button type="submit" size="sm" className="gap-2">
              {savedUser && <Check className="h-4 w-4" />}
              {savedUser ? 'Saved!' : 'Save Profile Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Workspace Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-500" />
            <CardTitle>Workspace Settings</CardTitle>
          </div>
          <CardDescription>Configure workspace details and organization profile</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateWorkspace} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="wsNameInput">Workspace Name</Label>
              <Input
                id="wsNameInput"
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wsDescInput">Description</Label>
              <Input
                id="wsDescInput"
                value={wsDesc}
                onChange={(e) => setWsDesc(e.target.value)}
              />
            </div>

            <Button type="submit" size="sm" className="gap-2">
              {savedWs && <Check className="h-4 w-4" />}
              {savedWs ? 'Workspace Saved!' : 'Update Workspace'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
