import React, { useState, useEffect } from 'react'
import {
  X, Clock, Play, Square, MessageSquare, Tag,
  Calendar, CheckCircle2, AlertCircle, Send, Check
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { formatDate, formatRelativeTime, getInitials, priorityColors, statusColors } from '../../lib/utils'
import { useAuthStore } from '../../stores/authStore'
import { getSocket } from '../../lib/socket'
import api from '../../lib/api'

interface TaskDetailDialogProps {
  taskId: string | null
  open: boolean
  onClose: () => void
  onTaskUpdated?: () => void
}

export function TaskDetailDialog({ taskId, open, onClose, onTaskUpdated }: TaskDetailDialogProps) {
  const { user } = useAuthStore()
  const [task, setTask] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [timerRunning, setTimerRunning] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!taskId || !open) return

    setLoading(true)
    api.get(`/tasks/${taskId}`).then((res) => {
      setTask(res.data.task)
      setComments(res.data.comments || [])
    }).finally(() => setLoading(false))

    const socket = getSocket()
    socket.emit('join:task', taskId)

    const handleTaskUpdated = (updated: any) => {
      if (updated._id === taskId) {
        setTask(updated)
      }
    }

    const handleNewComment = (comment: any) => {
      if (comment.task === taskId) {
        setComments((prev) => [...prev, comment])
      }
    }

    socket.on('task:updated', handleTaskUpdated)
    socket.on('comment:new', handleNewComment)

    return () => {
      socket.emit('leave:task', taskId)
      socket.off('task:updated', handleTaskUpdated)
      socket.off('comment:new', handleNewComment)
    }
  }, [taskId, open])

  const handleStatusChange = async (newStatus: string) => {
    if (!task) return
    try {
      const res = await api.put(`/tasks/${task._id}`, { status: newStatus })
      setTask(res.data.task)
      onTaskUpdated?.()
    } catch (err) {
      console.error(err)
    }
  }

  const handlePriorityChange = async (newPriority: string) => {
    if (!task) return
    try {
      const res = await api.put(`/tasks/${task._id}`, { priority: newPriority })
      setTask(res.data.task)
      onTaskUpdated?.()
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleTimer = async () => {
    if (!task) return
    try {
      if (!timerRunning) {
        await api.post(`/tasks/${task._id}/time/start`, {})
        setTimerRunning(true)
      } else {
        await api.post(`/tasks/${task._id}/time/stop`, {})
        setTimerRunning(false)
        onTaskUpdated?.()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !task) return
    try {
      await api.post(`/tasks/${task._id}/comments`, { content: newComment })
      setNewComment('')
    } catch (err) {
      console.error(err)
    }
  }

  if (!task && !loading) return null

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading task details...</div>
        ) : (
          <>
            <DialogHeader className="p-6 border-b flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={statusColors[task.status] || ''}>
                  {task.status?.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge variant="outline" className={priorityColors[task.priority] || ''}>
                  {task.priority?.toUpperCase()}
                </Badge>
                {task.sprint?.name && (
                  <Badge variant="secondary" className="text-xs">
                    {task.sprint.name}
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-xl font-bold">{task.title}</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Properties Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/40 border border-border/50 text-xs">
                <div>
                  <span className="text-muted-foreground block mb-1">Status</span>
                  <Select value={task.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backlog">Backlog</SelectItem>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <span className="text-muted-foreground block mb-1">Priority</span>
                  <Select value={task.priority} onValueChange={handlePriorityChange}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <span className="text-muted-foreground block mb-1">Due Date</span>
                  <div className="flex items-center gap-1.5 h-8 font-medium">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{formatDate(task.dueDate)}</span>
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground block mb-1">Assignee</span>
                  <div className="flex items-center gap-1.5 h-8">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px]">
                        {task.assignee ? getInitials(task.assignee.name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium truncate">{task.assignee?.name || 'Unassigned'}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {task.description || 'No description provided.'}
                </p>
              </div>

              {/* Time Tracking Widget */}
              <div className="p-4 rounded-xl border border-border/60 bg-card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold">Time Tracking</h5>
                    <p className="text-xs text-muted-foreground">
                      Logged: {task.actualHours || 0} hrs / Est: {task.estimatedHours || 0} hrs
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={timerRunning ? 'destructive' : 'default'}
                  onClick={handleToggleTimer}
                  className="gap-1.5 text-xs h-8"
                >
                  {timerRunning ? (
                    <>
                      <Square className="h-3.5 w-3.5" /> Stop Timer
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" /> Start Timer
                    </>
                  )}
                </Button>
              </div>

              {/* Comments Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold">Discussion ({comments.length})</h4>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No comments yet. Start the conversation!</p>
                  ) : (
                    comments.map((c) => (
                      <div key={c._id} className="p-3 rounded-lg bg-muted/30 border border-border/40 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{c.author?.name || 'Team Member'}</span>
                          <span className="text-[10px] text-muted-foreground">{formatRelativeTime(c.createdAt)}</span>
                        </div>
                        <p className="text-muted-foreground">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <Input
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="text-xs h-9"
                  />
                  <Button type="submit" size="sm" className="h-9 px-3 gap-1">
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </form>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
