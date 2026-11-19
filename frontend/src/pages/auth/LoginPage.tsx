import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ArrowRight, ShieldCheck, Zap } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { useAuthStore } from '../../stores/authStore'
import api from '../../lib/api'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault()
    setError('')
    setLoading(true)
    const loginEmail = customEmail || email
    const loginPass = customPass || password

    try {
      const res = await api.post('/auth/login', { email: loginEmail, password: loginPass })
      login(res.data.user, res.data.token)
      navigate('/overview')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickDemo = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('Demo1234!')
    handleLogin(undefined, demoEmail, 'Demo1234!')
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
            <p className="text-xs text-muted-foreground">Real-Time Project Management</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-1">Welcome back</h2>
        <p className="text-sm text-muted-foreground mb-6">Enter your details to sign in to your workspace.</p>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Password</Label>
            </div>
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
            {loading ? 'Signing in...' : 'Sign In'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Quick Demo Access</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 justify-start h-9"
            onClick={() => handleQuickDemo('owner@demo.com')}
          >
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            Owner (Alex)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 justify-start h-9"
            onClick={() => handleQuickDemo('pm@demo.com')}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
            PM (Jordan)
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Create workspace
          </Link>
        </p>
      </div>
    </div>
  )
}
