import type { Notification } from '../../../../shared/types'

interface ChangeAlertToastProps {
  notification: Notification
  onDismiss: (notificationId: string) => void
}

const getAlertColor = (type: Notification['type']): string => {
  switch (type) {
    case 'change_alert': return '#f59e0b'
    case 'request_resolved': return '#22c55e'
    case 'lock_override': return '#ef4444'
    default: return '#3b82f6'
  }
}

const getAlertIcon = (type: Notification['type']): string => {
  switch (type) {
    case 'change_alert': return '📝'
    case 'request_resolved': return '✅'
    case 'lock_override': return '⚡'
    default: return 'ℹ️'
  }
}

export const ChangeAlertToast = ({
  notification,
  onDismiss
}: ChangeAlertToastProps) => {
  const color = getAlertColor(notification.type)
  const icon = getAlertIcon(notification.type)

  return (
    <div style={{
      background: '#1e1e1e',
      border: `1px solid ${color}`,
      borderLeft: `4px solid ${color}`,
      borderRadius: 8,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      minWidth: 320,
      maxWidth: 400
    }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#fff',
          marginBottom: 2
        }}>
          {notification.title}
        </div>
        <div style={{
          fontSize: 12,
          color: '#888',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {notification.message}
        </div>
      </div>

      <button
        onClick={() => onDismiss(notification.id)}
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