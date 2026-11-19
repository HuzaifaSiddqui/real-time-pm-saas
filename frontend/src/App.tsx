import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { OverviewPage } from './pages/dashboard/OverviewPage'
import { MyTasksPage } from './pages/dashboard/MyTasksPage'
import { ProjectsPage } from './pages/projects/ProjectsPage'
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage'
import { KanbanPage } from './pages/tasks/KanbanPage'
import { SprintsPage } from './pages/sprints/SprintsPage'
import { RoadmapPage } from './pages/roadmap/RoadmapPage'
import { CalendarPage } from './pages/calendar/CalendarPage'
import { TeamPage } from './pages/team/TeamPage'
import { AnalyticsPage } from './pages/analytics/AnalyticsPage'
import { SettingsPage } from './pages/settings/SettingsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected workspace routes */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/my-tasks" element={<MyTasksPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/kanban" element={<KanbanPage />} />
            <Route path="/sprints" element={<SprintsPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
