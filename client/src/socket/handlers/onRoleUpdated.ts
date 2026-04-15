import type { WSMessage, RoleCreatePayload, RoleUpdatePayload, RoleDeletePayload, UserRoleAssignPayload } from '../../../../shared/types'
import type { SessionState } from '../../engine/SessionState'

export const onRoleUpdated = (message: WSMessage, state: SessionState): void => {
  if (message.type === 'role_create') {
    const payload = message.payload as RoleCreatePayload
    state.addRole(payload.role)
    console.log(`[onRoleUpdated] Role created: ${payload.role.name}`)
  }

  else if (message.type === 'role_update') {
    const payload = message.payload as RoleUpdatePayload
    state.updateRole(payload.role)
    console.log(`[onRoleUpdated] Role updated: ${payload.role.name}`)
  }

  else if (message.type === 'role_delete') {
    const payload = message.payload as RoleDeletePayload
    state.deleteRole(payload.roleId)
    console.log(`[onRoleUpdated] Role deleted: ${payload.roleId}`)
  }

  else if (message.type === 'user_role_assign') {
    const payload = message.payload as UserRoleAssignPayload
    state.updateUserRole(payload.userId, payload.roleId)
    console.log(`[onRoleUpdated] User ${payload.userId} assigned role ${payload.roleId}`)
  }
}