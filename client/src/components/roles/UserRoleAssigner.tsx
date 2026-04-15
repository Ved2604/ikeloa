import type { User, Role } from '../../../../shared/types'

interface UserRoleAssignerProps {
  users: Record<string, User>
  roles: Record<string, Role>
  currentUserId: string
  isOrganiser: boolean
  onAssign: (userId: string, roleId: string) => void
}

export const UserRoleAssigner = ({
  users,
  roles,
  currentUserId,
  isOrganiser,
  onAssign
}: UserRoleAssignerProps) => {
  const sortedRoles = Object.values(roles).sort(
    (a, b) => a.hierarchyLevel - b.hierarchyLevel
  )

  const userList = Object.values(users)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>
          Members
        </div>
        <div style={{ color: '#555', fontSize: 12, marginTop: 2 }}>
          Assign roles to session members
        </div>
      </div>

      {userList.length === 0 ? (
        <div style={{
          padding: '32px',
          textAlign: 'center',
          color: '#444',
          fontSize: 13,
          background: '#252526',
          borderRadius: 8,
          border: '1px dashed #333'
        }}>
          No members yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {userList.map(user => {
            const isCurrentUser = user.id === currentUserId
            const assignedRole = user.roleId ? roles[user.roleId] : null

            return (
              <div
                key={user.id}
                style={{
                  background: '#252526',
                  border: '1px solid #2a2a2a',
                  borderRadius: 8,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: assignedRole ? `${assignedRole.color}30` : '#333',
                  border: `2px solid ${assignedRole ? assignedRole.color : '#444'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  color: assignedRole ? assignedRole.color : '#888',
                  flexShrink: 0
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>

                {/* User info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#ddd',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {user.name}
                    </span>
                    {isCurrentUser && (
                      <span style={{
                        fontSize: 10,
                        color: '#3b82f6',
                        background: 'rgba(59,130,246,0.15)',
                        border: '1px solid rgba(59,130,246,0.3)',
                        borderRadius: 4,
                        padding: '1px 6px',
                        fontWeight: 600
                      }}>
                        You
                      </span>
                    )}
                    {user.isOrganiser && (
                      <span style={{
                        fontSize: 10,
                        color: '#f59e0b',
                        background: 'rgba(245,158,11,0.15)',
                        border: '1px solid rgba(245,158,11,0.3)',
                        borderRadius: 4,
                        padding: '1px 6px',
                        fontWeight: 600
                      }}>
                        ⭐ Organiser
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: '#555',
                    marginTop: 2
                  }}>
                    {assignedRole
                      ? `Level ${assignedRole.hierarchyLevel} — ${assignedRole.name}`
                      : 'No role assigned'}
                  </div>
                </div>

                {/* Role selector */}
                {isOrganiser && !user.isOrganiser && (
                  <select
                    value={user.roleId ?? ''}
                    onChange={e => onAssign(user.id, e.target.value)}
                    style={{
                      background: '#1a1a1a',
                      border: `1px solid ${assignedRole ? assignedRole.color + '50' : '#333'}`,
                      borderRadius: 6,
                      color: assignedRole ? assignedRole.color : '#888',
                      fontSize: 12,
                      fontWeight: 500,
                      padding: '6px 10px',
                      cursor: 'pointer',
                      outline: 'none',
                      flexShrink: 0
                    }}
                  >
                    <option value="" style={{ background: '#1e1e1e', color: '#888' }}>
                      No role
                    </option>
                    {sortedRoles.map(role => (
                      <option
                        key={role.id}
                        value={role.id}
                        style={{ background: '#1e1e1e', color: '#fff' }}
                      >
                        L{role.hierarchyLevel} — {role.name}
                      </option>
                    ))}
                  </select>
                )}

                {/* Non-organiser view — just show the role */}
                {!isOrganiser && (
                  <div style={{
                    fontSize: 12,
                    color: assignedRole ? assignedRole.color : '#555',
                    background: assignedRole ? `${assignedRole.color}15` : '#2a2a2a',
                    border: `1px solid ${assignedRole ? assignedRole.color + '40' : '#333'}`,
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontWeight: 500,
                    flexShrink: 0
                  }}>
                    {assignedRole ? assignedRole.name : 'No role'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}