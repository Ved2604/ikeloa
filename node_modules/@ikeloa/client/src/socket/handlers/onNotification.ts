import type { WSMessage, NotificationPayload } from '../../../../shared/types'
import type { SessionState } from '../../engine/SessionState'

export const onNotification = (message: WSMessage, state: SessionState): void => {
  const payload = message.payload as NotificationPayload
  state.addNotification(payload.notification)
  console.log(`[onNotification] ${payload.notification.title}: ${payload.notification.message}`)
}