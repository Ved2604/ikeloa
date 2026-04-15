import { useState } from 'react'
import type { Notification, ChangeRequest, User } from '../../../../shared/types'

interface NotificationPanelProps {
  notifications: Notification[]
  changeRequests: ChangeRequest[]
  currentUser: User
  onMarkAllRead: () => void
  onReviewChangeRequest: (changeRequest: ChangeRequest) => void
}

const getNotificationIcon = (type: Notification['type']): string => {
  switch (type) {
    case 'change_alert': return '📝'
    case 'change_request': return '🔔'
    case 'request_resolved': return '✅'
    case 'lock_override': return '⚡'
    case 'info': return 'ℹ️'
  }
}

const getNotificationColor = (type: Notification['type']): string => {
  switch (type) {
    case 'change_alert': return '#f59e0b'
    case 'change_request': return '#8b5cf6'
    case 'request_resolved': return '#22c55e'
    case 'lock_override': return '#ef4444'
    case 'info': return '#3b82f6'
  }
}

const timeAgo = (timestamp: number): string => {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export const NotificationPanel = ({
  notifications,
  changeRequests,
  currentUser,
  onMarkAllRead,
  onReviewChangeRequest
}: NotificationPanelProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const unreadCount = notifications.filter(n => !n.read).length
  const pendingRequests = changeRequests.filter(
    cr => cr.status === 'pending' && cr.requesterId !== currentUser.id
  )

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '6px 10px',
          borderRadius: 6,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#888',
          fontSize: 18,
          transition: 'color 0.15s'
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.color = '#fff'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.color = '#888'
        }}
      >
        🔔
        {(unreadCount > 0 || pendingRequests.length > 0) && (
          <span style={{
            position: 'absolute',
            top: 2,
            right: 2,
            background: '#ef4444',
            color: '#fff',
            borderRadius: '50%',
            width: 16,
            height: 16,
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {unreadCount + pendingRequests.length}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 44,
          right: 0,
          width: 360,
          maxHeight: 480,
          background: '#1e1e1e',
          border: '1px solid #333',
          borderRadius: 10,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
        }}>
          {/* Panel header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #2a2a2a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  fontSize: 12,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Pending change requests section */}
          {pendingRequests.length > 0 && (
            <div style={{ borderBottom: '1px solid #2a2a2a' }}>
              <div style={{
                padding: '8px 16px 4px',
                fontSize: 11,
                color: '#555',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}>
                Pending Review
              </div>
              {pendingRequests.map(cr => (
                <div
                  key={cr.id}
                  style={{
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    borderBottom: '1px solid #252525'
                  }}
                >
                  <span style={{ fontSize: 16 }}>🔔</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: '#ddd' }}>
                      {cr.requesterName} wants to edit{' '}
                      <span style={{ color: '#8b5cf6' }}>{cr.fileName}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onReviewChangeRequest(cr)
                      setIsOpen(false)
                    }}
                    style={{
                      background: 'rgba(139,92,246,0.15)',
                      border: '1px solid #8b5cf6',
                      borderRadius: 5,
                      color: '#8b5cf6',
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '4px 10px',
                      cursor: 'pointer'
                    }}
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Notifications list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {notifications.length === 0 && pendingRequests.length === 0 && (
              <div style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: '#444',
                fontSize: 13
              }}>
                No notifications yet
              </div>
            )}
            {notifications.map(notification => {
              const color = getNotificationColor(notification.type)
              const icon = getNotificationIcon(notification.type)
              return (
                <div
                  key={notification.id}
                  style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid #252525',
                    display: 'flex',
                    gap: 10,
                    background: notification.read ? 'transparent' : 'rgba(255,255,255,0.02)',
                    alignItems: 'flex-start'
                  }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13,
                      color: notification.read ? '#888' : '#ddd',
                      fontWeight: notification.read ? 400 : 500
                    }}>
                      {notification.title}
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: '#555',
                      marginTop: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {notification.message}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: '#444',
                    flexShrink: 0,
                    marginTop: 2
                  }}>
                    {timeAgo(notification.timestamp)}
                  </div>
                  {!notification.read && (
                    <div style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: color,
                      flexShrink: 0,
                      marginTop: 6
                    }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}