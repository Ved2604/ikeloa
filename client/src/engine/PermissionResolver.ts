import type { User, FileState } from '../../../shared/types'
import { RoleEngine } from './RoleEngine'

export type EditorPermission = 'edit' | 'readonly' | 'hidden'

export interface FilePermissionInfo {
  permission: EditorPermission
  decorationType: 'owned' | 'readable' | 'locked'
  showChangeRequestButton: boolean
  lockTooltip: string
}

export class PermissionResolver {
  private roleEngine: RoleEngine

  constructor(roleEngine: RoleEngine) {
    this.roleEngine = roleEngine
  }

  resolve(user: User, file: FileState): FilePermissionInfo {
    const level = this.roleEngine.resolvePermission(user, file.id)

    if (level === 'edit') {
      return {
        permission: 'edit',
        decorationType: 'owned',
        showChangeRequestButton: false,
        lockTooltip: ''
      }
    }

    if (level === 'read') {
      return {
        permission: 'readonly',
        decorationType: 'readable',
        showChangeRequestButton: true,
        lockTooltip: 'You have read-only access. Request a change to propose edits.'
      }
    }

    return {
      permission: 'hidden',
      decorationType: 'locked',
      showChangeRequestButton: false,
      lockTooltip: 'You do not have access to this file.'
    }
  }

  isLockedByOther(file: FileState, currentUserId: string): boolean {
    return file.lockedBy !== null && file.lockedBy !== currentUserId
  }

  getLockMessage(lockedByName: string): string {
    return `${lockedByName} is currently editing this file`
  }

  canEditNow(user: User, file: FileState): boolean {
    const hasPermission = this.roleEngine.canEdit(user, file.id)
    const lockedByOther = this.isLockedByOther(file, user.id)
    return hasPermission && !lockedByOther
  }
}