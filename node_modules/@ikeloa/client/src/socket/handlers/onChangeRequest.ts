import type { WSMessage, ChangeRequestCreatePayload } from '../../../../shared/types'
import type { SessionState } from '../../engine/SessionState'

export const onChangeRequest = (message: WSMessage, state: SessionState): void => {
  if (message.type === 'change_request_create') {
    const payload = message.payload as ChangeRequestCreatePayload
    state.addChangeRequest(payload.changeRequest)
    console.log(`[onChangeRequest] Change request received for file ${payload.changeRequest.fileId}`)
  }

  else if (message.type === 'change_request_resolve') {
    const payload = message.payload as {
      changeRequestId: string
      status: 'approved' | 'rejected'
      rejectionReason?: string
      updatedContent?: string
      fileId?: string
    }
    state.resolveChangeRequest(
      payload.changeRequestId,
      payload.status,
      payload.updatedContent,
      payload.fileId
    )
    console.log(`[onChangeRequest] Change request ${payload.changeRequestId} ${payload.status}`)
  }
}