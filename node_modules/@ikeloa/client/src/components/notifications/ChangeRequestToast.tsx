import type { ChangeRequest } from '../../../../shared/types'

interface ChangeRequestToastProps {
  changeRequest: ChangeRequest
  requesterName: string
  onReview: (changeRequest: ChangeRequest) => void
  onDismiss: (changeRequestId: string) => void
}

export const ChangeRequestToast = ({
  changeRequest,
  requesterName,
  onReview,
  onDismiss
}: ChangeRequestToastProps) => {
  return (
    <div style={{
      background: '#1e1e1e',
      border: '1px solid #8b5cf6',
      borderLeft: '4px solid #8b5cf6',
      borderRadius: 8,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      minWidth: 320,
      maxWidth: 400
    }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>🔔</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#fff',
          marginBottom: 2
        }}>
          Change Request
        </div>
        <div style={{
          fontSize: 12,
          color: '#888',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {requesterName} wants to edit{' '}
          <span style={{ color: '#8b5cf6' }}>
            {changeRequest.fileName}
          </span>
        </div>
      </div>

      <button
        onClick={() => onReview(changeRequest)}
        style={{
          background: 'rgba(139,92,246,0.15)',
          border: '1px solid #8b5cf6',
          borderRadius: 6,
          color: '#8b5cf6',
          fontSize: 12,
          fontWeight: 600,
          padding: '5px 12px',
          cursor: 'pointer',
          flexShrink: 0,
          whiteSpace: 'nowrap'
        }}
      >
        Review
      </button>

      <button
        onClick={() => onDismiss(changeRequest.id)}
        style={{
          background: 'none',
          border: 'none',
          color: '#444',
          cursor: 'pointer',
          fontSize: 16,
          padding: '0 2px',
          flexShrink: 0,
          transition: 'color 0.15s'
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.color = '#fff'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.color = '#444'
        }}
      >
        ✕
      </button>
    </div>
  )
}