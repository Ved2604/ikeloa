import {
  WSMessage,
  FileLockPayload
} from '../../../shared/types'
import { SessionManager } from '../session/SessionManager'

export const handleFileLock = (
  message: WSMessage,
  sessionManager: SessionManager
): void => {
  const session = sessionManager.get(message.sessionId)
  if (!session) return

  const payload = message.payload as FileLockPayload
  const { fileId, lockedBy } = payload

  const sender = session.getUser(message.senderId)
  if (!sender) return

  const file = session.data.files[fileId]
  if (!file) return

  if (lockedBy === null) {
    // User is releasing the lock
    session.unlockFile(fileId, message.senderId)

    const unlockMessage: WSMessage = {
      type: 'file_unlock',
      payload: {
        fileId,
        lockedBy: null,
        lockedByName: null
      } as FileLockPayload,
      senderId: 'server',
      sessionId: message.sessionId,
      timestamp: Date.now()
    }

    session.broadcast(unlockMessage)
    console.log(`[handleFileLock] ${sender.name} released lock on ${file.name}`)
  } else {
    // User is trying to acquire the lock
    const success = session.lockFile(fileId, message.senderId)

    if (!success) {
      // File is locked by someone else — tell the requester
      const currentOwner = file.lockedBy
        ? session.getUser(file.lockedBy)
        : null

      const errorMsg: WSMessage = {
        type: 'error',
        payload: {
          message: `File is currently being edited by ${currentOwner?.name ?? 'another user'}`
        },
        senderId: 'server',
        sessionId: message.sessionId,
        timestamp: Date.now()
      }
      session.sendTo(message.senderId, errorMsg)
      return
    }

    // Broadcast the lock to everyone so all clients know who is editing
    const lockMessage: WSMessage = {
      type: 'file_lock',
      payload: {
        fileId,
        lockedBy: message.senderId,
        lockedByName: sender.name
      } as FileLockPayload,
      senderId: 'server',
      sessionId: message.sessionId,
      timestamp: Date.now()
    }

    session.broadcast(lockMessage)
    console.log(`[handleFileLock] ${sender.name} locked ${file.name}`)
  }
}