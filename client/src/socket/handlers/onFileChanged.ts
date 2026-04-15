import type { WSMessage, FileChangePayload } from '../../../../shared/types'
import type { SessionState } from '../../engine/SessionState'

export const onFileChanged = (message: WSMessage, state: SessionState): void => {
  const payload = message.payload as FileChangePayload
  state.updateFileContent(payload.fileId, payload.content)
  console.log(`[onFileChanged] File ${payload.fileId} updated`)
}