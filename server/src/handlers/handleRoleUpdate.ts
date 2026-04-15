import {
  WSMessage,
  RoleCreatePayload,
  RoleUpdatePayload,
  RoleDeletePayload,
  UserRoleAssignPayload
} from '../../../shared/types'
import { SessionManager } from '../session/SessionManager'

export const handleRoleUpdate = (
  message: WSMessage,
  sessionManager: SessionManager
): void => {
  const session = sessionManager.get(message.sessionId)
  if (!session) return

  const sender = session.getUser(message.senderId)
  if (!sender) return

  // Only the organiser can manage roles
  if (!sender.isOrganiser) {
    const errorMsg: WSMessage = {
      type: 'error',
      payload: { message: 'Only the organiser can manage roles' },
      senderId: 'server',
      sessionId: message.sessionId,
      timestamp: Date.now()
    }
    session.sendTo(message.senderId, errorMsg)
    return
  }

  if (message.type === 'role_create') {
    const payload = message.payload as RoleCreatePayload
    session.addRole(payload.role)

    // Broadcast new role to everyone
    const broadcast: WSMessage = {
      type: 'role_create',
      payload,
      senderId: 'server',
      sessionId: message.sessionId,
      timestamp: Date.now()
    }
    session.broadcast(broadcast)
    console.log(`[handleRoleUpdate] Role created: ${payload.role.name}`)
  }

  else if (message.type === 'role_update') {
    const payload = message.payload as RoleUpdatePayload
    session.updateRole(payload.role)

    const broadcast: WSMessage = {
      type: 'role_update',
      payload,
      senderId: 'server',
      sessionId: message.sessionId,
      timestamp: Date.now()
    }
    session.broadcast(broadcast)
    console.log(`[handleRoleUpdate] Role updated: ${payload.role.name}`)
  }

  else if (message.type === 'role_delete') {
    const payload = message.payload as RoleDeletePayload
    session.deleteRole(payload.roleId)

    const broadcast: WSMessage = {
      type: 'role_delete',
      payload,
      senderId: 'server',
      sessionId: message.sessionId,
      timestamp: Date.now()
    }
    session.broadcast(broadcast)
    console.log(`[handleRoleUpdate] Role deleted: ${payload.roleId}`)
  }

  else if (message.type === 'user_role_assign') {
    const payload = message.payload as UserRoleAssignPayload
    const user = session.getUser(payload.userId)
    if (!user) return

    user.roleId = payload.roleId
    session.data.users[payload.userId] = user

    const broadcast: WSMessage = {
      type: 'user_role_assign',
      payload,
      senderId: 'server',
      sessionId: message.sessionId,
      timestamp: Date.now()
    }
    session.broadcast(broadcast)
    console.log(`[handleRoleUpdate] User ${user.name} assigned role ${payload.roleId}`)
  }
}