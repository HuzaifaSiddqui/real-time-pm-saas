import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Workspace {
  _id: string
  name: string
  description?: string
  slug: string
  owner: string
  avatar?: string
}

interface WorkspaceState {
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  setCurrentWorkspace: (ws: Workspace) => void
  setWorkspaces: (wss: Workspace[]) => void
  clearWorkspace: () => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentWorkspace: null,
      workspaces: [],
      setCurrentWorkspace: (ws) => set({ currentWorkspace: ws }),
      setWorkspaces: (wss) => set({ workspaces: wss }),
      clearWorkspace: () => set({ currentWorkspace: null, workspaces: [] }),
    }),
    { name: 'workspace-storage' }
  )
)
