import {
  WSMessage,
  FileChangePayload,
  NotificationPayload,
  Notification
} from '../../../shared/types'
import { SessionManager } from '../session/SessionManager'
import { generateId } from '../utils/idGenerator'

export const handleFileChange = (
  message: WSMessage,
  sessionManager: SessionManager
): void => {
  const session = sessionManager.get(message.sessionId)
  if (!session) return

  const payload = message.payload as FileChangePayload
  const { fileId, content } = payload

  const sender = session.getUser(message.senderId)
  if (!sender) return

  const file = session.data.files[fileId]
  if (!file) return

  // Check if file is locked by someone else
  if (file.lockedBy && file.lockedBy !== message.senderId) {
    const errorMsg: WSMessage = {
      type: 'error',
      payload: { message: 'File is locked by another user' },
      senderId: 'server',
      sessionId: message.sessionId,
      timestamp: Date.now()
    }
    session.sendTo(message.senderId, errorMsg)
    return
  }

  // Apply the change
  session.updateFileContent(fileId, content)

  // Broadcast the change to everyone else
  const changeMessage: WSMessage = {
    type: 'file_change',
    payload: { fileId, content },
    senderId: message.senderId,
    sessionId: message.sessionId,
    timestamp: Date.now()
  }

  session.broadcast(changeMessage, message.senderId)

  // Notify file owners that a change was made
  // so seniors are always aware of what changed in their files
  const senderRole = sender.isOrganiser
    ? null
    : session.data.roles[sender.roleId]

  const senderLevel = senderRole ? senderRole.hierarchyLevel : 0

  const notification: Notification = {
    id: generateId(),
    type: 'change_alert',
    title: 'File Changed',
    message: `${sender.name} made changes to ${file.name}`,
    fileId,
    timestamp: Date.now(),
    read: false
  }

  const notificationMessage: WSMessage = {
    type: 'notification',
    payload: { notification } as NotificationPayload,
    senderId: 'server',
    sessionId: message.sessionId,
    timestamp: Date.now()
  }

  // Only notify seniors about the change, not the sender themselves
  session.notifySeniors(senderLevel, notificationMessage, message.senderId)

  console.log(`[handleFileChange] ${sender.name} changed file ${file.name}`)
}