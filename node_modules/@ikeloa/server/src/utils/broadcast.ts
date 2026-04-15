import { WebSocket } from 'ws'
import { WSMessage } from '../../../shared/types'

export const sendToSocket = (ws: WebSocket, message: WSMessage): void => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message))
  }
}

export const broadcastToAll = (
  connections: Map<string, WebSocket>,
  message: WSMessage,
  excludeUserId?: string
): void => {
  connections.forEach((ws, userId) => {
    if (userId !== excludeUserId) {
      sendToSocket(ws, message)
    }
  })
}

export const sendToUser = (
  connections: Map<string, WebSocket>,
  userId: string,
  message: WSMessage
): void => {
  const ws = connections.get(userId)
  if (ws) sendToSocket(ws, message)
}