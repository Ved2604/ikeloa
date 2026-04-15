import type { Role, User, PermissionLevel } from '../../../shared/types'

export class RoleEngine {
  private roles: Map<string, Role> = new Map()

  setRoles(roles: Record<string, Role>): void {
    this.roles = new Map(Object.entries(roles))
  }

  addRole(role: Role): void {
    this.roles.set(role.id, role)
  }

  updateRole(role: Role): void {
    this.roles.set(role.id, role)
  }

  deleteRole(roleId: string): void {
    this.roles.delete(roleId)
  }

  getRole(roleId: string): Role | undefined {
    return this.roles.get(roleId)
  }

  getAllRoles(): Role[] {
    return Array.from(this.roles.values())
  }

  // Sorted lowest number first — highest authority first
  getRolesByHierarchy(): Role[] {
    return this.getAllRoles().sort((a, b) => a.hierarchyLevel - b.hierarchyLevel)
  }

  // Does role A outrank role B?
  // Lower hierarchyLevel = higher authority
  outranks(roleAId: string, roleBId: string): boolean {
    const a = this.roles.get(roleAId)
    const b = this.roles.get(roleBId)
    if (!a || !b) return false
    return a.hierarchyLevel < b.hierarchyLevel
  }

  // What can this user do to this file?
  resolvePermission(user: User, fileId: string): PermissionLevel {
    // Organiser always has full access to everything
    if (user.isOrganiser) return 'edit'

    // User with no role assigned gets read only
    if (!user.roleId) return 'read'

    const role = this.roles.get(user.roleId)
    if (!role) return 'read'

    // Check if this file has an explicit permission set
    const permission = role.permissions[fileId]

    // Default to read if no explicit permission set
    return permission ?? 'read'
  }

  canEdit(user: User, fileId: string): boolean {
    return this.resolvePermission(user, fileId) === 'edit'
  }

  canRead(user: User, fileId: string): boolean {
    const p = this.resolvePermission(user, fileId)
    return p === 'edit' || p === 'read'
  }

  isHidden(user: User, fileId: string): boolean {
    return this.resolvePermission(user, fileId) === 'hidden'
  }

  // Can this user resolve a change request from another user?
  canResolveRequest(resolver: User, requesterId: string, users: Record<string, User>): boolean {
    if (resolver.isOrganiser) return true
    const requester = users[requesterId]
    if (!requester) return false
    return this.outranks(resolver.roleId, requester.roleId)
  }

  // Get the next available hierarchy level
  // Useful when creating a new role — place it at the bottom
  getNextHierarchyLevel(): number {
    const levels = this.getAllRoles().map(r => r.hierarchyLevel)
    if (levels.length === 0) return 1
    return Math.max(...levels) + 1
  }
}