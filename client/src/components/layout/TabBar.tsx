import type { FileState, User } from '../../../../shared/types'
import { RoleEngine } from '../../engine/RoleEngine'

interface TabBarProps {
  openFiles: FileState[]
  activeFileId: string | null
  currentUser: User
  roleEngine: RoleEngine
  onTabSelect: (fileId: string) => void
  onTabClose: (fileId: string) => void
}

const getPermissionColor = (
  user: User,
  fileId: string,
  roleEngine: RoleEngine
): string => {
  const permission = roleEngine.resolvePermission(user, fileId)
  if (permission === 'edit') return '#22c55e'
  if (permission === 'read') return '#f59e0b'
  return '#ef4444'
}

const getFileIcon = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    ts: '📘', tsx: '⚛️', js: '📙', jsx: '⚛️',
    py: '🐍', json: '📋', md: '📝', css: '🎨',
    html: '🌐', env: '🔐', yaml: '⚙️', yml: '⚙️',
    sh: '💻', txt: '📄'
  }
  return map[ext ?? ''] ?? '📄'
}

export const TabBar = ({
  openFiles,
  activeFileId,
  currentUser,
  roleEngine,
  onTabSelect,
  onTabClose
}: TabBarProps) => {
  if (openFiles.length === 0) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      background: '#1a1a1a',
      borderBottom: '1px solid #2a2a2a',
      overflowX: 'auto',
      flexShrink: 0,
      height: 40
    }}>
      {openFiles.map(file => {
        const isActive = file.id === activeFileId
        const permColor = getPermissionColor(currentUser, file.id, roleEngine)

        return (
          <div
            key={file.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 12px',
              height: '100%',
              cursor: 'pointer',
              background: isActive ? '#252526' : 'transparent',
              borderBottom: isActive ? `2px solid ${permColor}` : '2px solid transparent',
              borderRight: '1px solid #2a2a2a',
              flexShrink: 0,
              minWidth: 0,
              maxWidth: 180,
              transition: 'background 0.15s'
            }}
            onClick={() => onTabSelect(file.id)}
          >
            {/* File icon */}
            <span style={{ fontSize: 12, flexShrink: 0 }}>
              {getFileIcon(file.name)}
            </span>

            {/* File name */}
            <span style={{
              fontSize: 13,
              color: isActive ? '#fff' : '#888',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1
            }}>
              {file.name}
            </span>

            {/* Close button */}
            <span
              onClick={e => {
                e.stopPropagation()
                onTabClose(file.id)
              }}
              style={{
                fontSize: 14,
                color: '#555',
                flexShrink: 0,
                lineHeight: 1,
                padding: '0 2px',
                borderRadius: 3,
                transition: 'color 0.15s'
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLSpanElement).style.color = '#fff'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLSpanElement).style.color = '#555'
              }}
            >
              ✕
            </span>
          </div>
        )
      })}
    </div>
  )
}