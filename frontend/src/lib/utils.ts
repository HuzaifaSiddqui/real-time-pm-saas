import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const d = new Date(date)
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function isOverdue(date: string | Date | null | undefined): boolean {
  if (!date) return false
  return new Date(date) < new Date()
}

export const priorityColors: Record<string, string> = {
  low: 'text-blue-500 bg-blue-50 dark:bg-blue-950',
  medium: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950',
  high: 'text-orange-500 bg-orange-50 dark:bg-orange-950',
  urgent: 'text-red-500 bg-red-50 dark:bg-red-950',
}

export const statusColors: Record<string, string> = {
  backlog: 'text-gray-500 bg-gray-100 dark:bg-gray-800',
  todo: 'text-blue-500 bg-blue-50 dark:bg-blue-950',
  in_progress: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950',
  in_review: 'text-purple-500 bg-purple-50 dark:bg-purple-950',
  blocked: 'text-red-500 bg-red-50 dark:bg-red-950',
  done: 'text-green-600 bg-green-50 dark:bg-green-950',
}

export const healthColors: Record<string, string> = {
  on_track: 'text-green-600 bg-green-50 dark:bg-green-950',
  at_risk: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950',
  delayed: 'text-red-500 bg-red-50 dark:bg-red-950',
}
