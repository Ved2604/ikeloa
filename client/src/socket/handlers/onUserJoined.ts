import type { WSMessage } from '../../../../shared/types'
import type { SessionState } from '../../engine/SessionState'

export const onUserJoined = (message: WSMessage, state: SessionState): void => {
  const payload = message.payload as { user: { id: string; name: string; roleId: string; isOrganiser: boolean } }
  state.addUser(payload.user)
  console.log(`[onUserJoined] ${payload.user.name} joined the session`)
}