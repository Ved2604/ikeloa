import {
  WSMessage,
  ChangeRequestCreatePayload,
  ChangeRequestResolvePayload,
  NotificationPayload,
  Notification
} from '../../../shared/types'
import { SessionManager } from '../session/SessionManager'
import { generateId } from '../utils/idGenerator'

export const handleChangeRequest = (
  message: WSMessage,
  sessionManager: SessionManager
): void => {
  const session = sessionManager.get(message.sessionId)
  if (!session) return

  const sender = session.getUser(message.senderId)
  if (!sender) return

  if (message.type === 'change_request_create') {
    const payload = message.payload as ChangeRequestCreatePayload
    const { changeRequest } = payload

    const file = session.data.files[changeRequest.fileId]
    if (!file) return

    // Save the change request
    session.addChangeRequest(changeRequest)

    // Broadcast the change request to everyone
    const broadcast: WSMessage = {
      type: 'change_request_create',
      payload,
      senderId: 'server',
      sessionId: message.sessionId,
      timestamp: Date.now()
    }
    session.broadcast(broadcast)

    // Send a notification specifically to file owners
    const notification: Notification = {
      id: generateId(),
      type: 'change_request',
      title: 'Change Request',
      message: `${sender.name} is requesting changes to ${file.name}`,
      fileId: changeRequest.fileId,
      changeRequestId: changeRequest.id,
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

    session.notifyFileOwners(changeRequest.fileId, notificationMessage, message.senderId)
    console.log(`[handleChangeRequest] ${sender.name} requested changes to ${file.name}`)
  }

  else if (message.type === 'change_request_resolve') {
    const payload = message.payload as ChangeRequestResolvePayload
    const { changeRequestId, status, rejectionReason } = payload

    const changeRequest = session.data.changeRequests[changeRequestId]
    if (!changeRequest) return

    // Only file owners or organiser can resolve
    const file = session.data.files[changeRequest.fileId]
    if (!file) return

    if (!sender.isOrganiser) {
      const senderRole = session.data.roles[sender.roleId]
      const requesterRole = session.data.roles[
        session.data.users[changeRequest.requesterId]?.roleId
      ]

      if (!senderRole || !requesterRole) return

      // Sender must outrank the requester to resolve
      if (senderRole.hierarchyLevel >= requesterRole.hierarchyLevel) {
        const errorMsg: WSMessage = {
          type: 'error',
          payload: { message: 'You do not have permission to resolve this request' },
          senderId: 'server',
          sessionId: message.sessionId,
          timestamp: Date.now()
        }
        session.sendTo(message.senderId, errorMsg)
        return
      }
    }

    const resolved = session.resolveChangeRequest(changeRequestId, status, rejectionReason)
    if (!resolved) return

    // Broadcast the resolution to everyone
    const broadcast: WSMessage = {
      type: 'change_request_resolve',
      payload: {
        changeRequestId,
        status,
        rejectionReason,
        // if approved send updated file content too
        updatedContent: status === 'approved' ? resolved.proposedContent : undefined,
        fileId: resolved.fileId
      },
      senderId: 'server',
      sessionId: message.sessionId,
      timestamp: Date.now()
    }
    session.broadcast(broadcast)

    // Notify the requester of the outcome
    const notification: Notification = {
      id: generateId(),
      type: 'request_resolved',
      title: status === 'approved' ? 'Change Request Approved' : 'Change Request Rejected',
      message: status === 'approved'
        ? `Your changes to ${file.name} were approved`
        : `Your changes to ${file.name} were rejected${rejectionReason ? `: ${rejectionReason}` : ''}`,
      fileId: resolved.fileId,
      changeRequestId,
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

    session.sendTo(changeRequest.requesterId, notificationMessage)
    console.log(`[handleChangeRequest] Change request ${changeRequestId} ${status}`)
  }
}