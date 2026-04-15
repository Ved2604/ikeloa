import type { FileState } from '../../../shared/types'

export interface LockInfo {
  fileId: string
  lockedBy: string | null
  lockedByName: string | null
}

export class LockManager {
  private locks: Map<string, LockInfo> = new Map()

  setLock(fileId: string, lockedBy: string | null, lockedByName: string | null): void {
    this.locks.set(fileId, { fileId, lockedBy, lockedByName })
  }

  getLock(fileId: string): LockInfo | undefined {
    return this.locks.get(fileId)
  }

  isLocked(fileId: string): boolean {
    const lock = this.locks.get(fileId)
    return lock?.lockedBy !== null && lock?.lockedBy !== undefined
  }

  isLockedByUser(fileId: string, userId: string): boolean {
    const lock = this.locks.get(fileId)
    return lock?.lockedBy === userId
  }

  isLockedByOther(fileId: string, userId: string): boolean {
    const lock = this.locks.get(fileId)
    return lock?.lockedBy !== null &&
      lock?.lockedBy !== undefined &&
      lock?.lockedBy !== userId
  }

  getLockedByName(fileId: string): string | null {
    return this.locks.get(fileId)?.lockedByName ?? null
  }

  releaseLock(fileId: string): void {
    this.locks.set(fileId, { fileId, lockedBy: null, lockedByName: null })
  }

  // Sync lock state from file state coming from server
  syncFromFiles(files: Record<string, FileState>): void {
    Object.values(files).forEach(file => {
      const extended = file as FileState & { lockedByName?: string | null }
      this.setLock(file.id, file.lockedBy, extended.lockedByName ?? null)
    })
  }
}