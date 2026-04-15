import type { Role, FileState, PermissionLevel } from '../../../../shared/types'

interface PermissionMatrixProps {
  roles: Record<string, Role>
  files: Record<string, FileState>
  isOrganiser: boolean
  onPermissionChange: (roleId: string, fileId: string, permission: PermissionLevel) => void
}

const PERMISSION_OPTIONS: PermissionLevel[] = ['edit', 'read', 'hidden']

const getPermissionColor = (permission: PermissionLevel): string => {
  if (permission === 'edit') return '#22c55e'
  if (permission === 'read') return '#f59e0b'
  return '#ef4444'
}

const getPermissionIcon = (permission: PermissionLevel): string => {
  if (permission === 'edit') return '✏️'
  if (permission === 'read') return '👁️'
  return '🚫'
}

export const PermissionMatrix = ({
  roles,
  files,
  isOrganiser,
  onPermissionChange
}: PermissionMatrixProps) => {
  const sortedRoles = Object.values(roles).sort(
    (a, b) => a.hierarchyLevel - b.hierarchyLevel
  )
  const fileList = Object.values(files)

  if (sortedRoles.length === 0 || fileList.length === 0) {
    return (
      <div style={{
        padding: '32px',
        textAlign: 'center',
        color: '#444',
        fontSize: 13,
        background: '#252526',
        borderRadius: 8,
        border: '1px dashed #333'
      }}>
        {sortedRoles.length === 0
          ? 'Add roles first to configure permissions'
          : 'No files in session'}
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{
        color: '#fff',
        fontWeight: 600,
        fontSize: 15,
        marginBottom: 4
      }}>
        Permission Matrix
      </div>
      <div style={{
        color: '#555',
        fontSize: 12,
        marginBottom: 16
      }}>
        Set what each role can do with each file
      </div>

      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: 13
      }}>
        {/* Header row — file names */}
        <thead>
          <tr>
            <th style={{
              textAlign: 'left',
              padding: '8px 12px',
              color: '#555',
              fontWeight: 600,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              borderBottom: '1px solid #2a2a2a',
              whiteSpace: 'nowrap'
            }}>
              Role
            </th>
            {fileList.map(file => (
              <th
                key={file.id}
                style={{
                  textAlign: 'center',
                  padding: '8px 12px',
                  color: '#888',
                  fontWeight: 500,
                  fontSize: 12,
                  borderBottom: '1px solid #2a2a2a',
                  whiteSpace: 'nowrap',
                  maxWidth: 120,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={file.name}
              >
                {file.name}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body rows — one per role */}
        <tbody>
          {sortedRoles.map((role, index) => (
            <tr
              key={role.id}
              style={{
                background: index % 2 === 0 ? '#1e1e1e' : '#252526'
              }}
            >
              {/* Role name cell */}
              <td style={{
                padding: '10px 12px',
                borderBottom: '1px solid #2a2a2a',
                whiteSpace: 'nowrap'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: role.color,
                    flexShrink: 0
                  }} />
                  <span style={{ color: '#ddd', fontWeight: 500 }}>
                    {role.name}
                  </span>
                  <span style={{
                    fontSize: 10,
                    color: '#444',
                    background: '#2a2a2a',
                    borderRadius: 4,
                    padding: '1px 5px'
                  }}>
                    L{role.hierarchyLevel}
                  </span>
                </div>
              </td>

              {/* Permission cells — one per file */}
              {fileList.map(file => {
                const currentPermission: PermissionLevel =
                  role.permissions[file.id] ?? 'read'
                const color = getPermissionColor(currentPermission)
                const icon = getPermissionIcon(currentPermission)

                return (
                  <td
                    key={file.id}
                    style={{
                      textAlign: 'center',
                      padding: '10px 12px',
                      borderBottom: '1px solid #2a2a2a'
                    }}
                  >
                    {isOrganiser ? (
                      <select
                        value={currentPermission}
                        onChange={e =>
                          onPermissionChange(
                            role.id,
                            file.id,
                            e.target.value as PermissionLevel
                          )
                        }
                        style={{
                          background: `${color}18`,
                          border: `1px solid ${color}50`,
                          borderRadius: 6,
                          color: color,
                          fontSize: 12,
                          fontWeight: 500,
                          padding: '4px 8px',
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        {PERMISSION_OPTIONS.map(opt => (
                          <option
                            key={opt}
                            value={opt}
                            style={{ background: '#1e1e1e', color: '#fff' }}
                          >
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: `${color}18`,
                        border: `1px solid ${color}50`,
                        borderRadius: 6,
                        color: color,
                        fontSize: 12,
                        fontWeight: 500,
                        padding: '4px 8px'
                      }}>
                        {icon} {currentPermission}
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}