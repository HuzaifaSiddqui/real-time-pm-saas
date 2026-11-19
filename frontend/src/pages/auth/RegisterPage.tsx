import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ArrowRight } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { useAuthStore } from '../../stores/authStore'
import api from '../../lib/api'

export function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await api.post('/auth/register', { name, email, password })
      login(res.data.user, res.data.token)

      // Create initial workspace if provided
      if (workspaceName.trim()) {
        await api.post('/workspaces', {
          name: workspaceName,
          slug: workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        })
      }

      navigate('/overview')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please check inputs.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4">
      <div className="w-full max-w-md bg-card/90 backdrop-blur-md rounded-2xl border border-border/40 p-8 shadow-2xl text-card-foreground">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">FlowBoard</h1>
            <p className="text-xs text-muted-foreground">Start your 14-day team trial</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-1">Create your workspace</h2>
        <p className="text-sm text-muted-foreground mb-6">Collaborate on tasks, sprints, and roadmaps in real-time.</p>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Alex Morgan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Work Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="alex@acme.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="workspace">Company / Workspace Name</Label>
            <Input
              id="workspace"
              placeholder="Acme Innovations"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password (min. 6 characters)</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full h-10 gap-2 mt-2" disabled={loading}>
            {loading ? 'Creating workspace...' : 'Get Started'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
