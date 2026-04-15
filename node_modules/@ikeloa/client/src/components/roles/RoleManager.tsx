import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Role } from '../../../../shared/types'
import { RoleCard } from './RoleCard'

interface RoleManagerProps {
  roles: Record<string, Role>
  isOrganiser: boolean
  onRoleCreate: (role: Role) => void
  onRoleUpdate: (role: Role) => void
  onRoleDelete: (roleId: string) => void
}

export const RoleManager = ({
  roles,
  isOrganiser,
  onRoleCreate,
  onRoleUpdate,
  onRoleDelete
}: RoleManagerProps) => {
  const [isAdding, setIsAdding] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')

  const sortedRoles = Object.values(roles).sort(
    (a, b) => a.hierarchyLevel - b.hierarchyLevel
  )

  const handleAddRole = () => {
    if (!newRoleName.trim()) return

    const maxLevel = sortedRoles.length > 0
      ? Math.max(...sortedRoles.map(r => r.hierarchyLevel))
      : 0

    const newRole: Role = {
      id: uuidv4(),
      name: newRoleName.trim(),
      color: '#3b82f6',
      hierarchyLevel: maxLevel + 1,
      permissions: {}
    }

    onRoleCreate(newRole)
    setNewRoleName('')
    setIsAdding(false)
  }

  const handleMoveUp = (roleId: string) => {
    const index = sortedRoles.findIndex(r => r.id === roleId)
    if (index <= 0) return

    const current = sortedRoles[index]
    const above = sortedRoles[index - 1]

    // Swap hierarchy levels
    onRoleUpdate({ ...current, hierarchyLevel: above.hierarchyLevel })
    onRoleUpdate({ ...above, hierarchyLevel: current.hierarchyLevel })
  }

  const handleMoveDown = (roleId: string) => {
    const index = sortedRoles.findIndex(r => r.id === roleId)
    if (index >= sortedRoles.length - 1) return

    const current = sortedRoles[index]
    const below = sortedRoles[index + 1]

    onRoleUpdate({ ...current, hierarchyLevel: below.hierarchyLevel })
    onRoleUpdate({ ...below, hierarchyLevel: current.hierarchyLevel })
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>
            Roles
          </div>
          <div style={{ color: '#555', fontSize: 12, marginTop: 2 }}>
            Higher position = higher authority
          </div>
        </div>
        {isOrganiser && (
          <button
            onClick={() => setIsAdding(true)}
            style={{
              background: 'rgba(59,130,246,0.15)',
              border: '1px solid #3b82f6',
              borderRadius: 6,
              color: '#3b82f6',
              fontSize: 13,
              fontWeight: 500,
              padding: '6px 14px',
              cursor: 'pointer'
            }}
          >
            + Add Role
          </button>
        )}
      </div>

      {/* Add role input */}
      {isAdding && (
        <div style={{
          display: 'flex',
          gap: 8,
          padding: '12px',
          background: '#252526',
          borderRadius: 8,
          border: '1px solid #3b82f6'
        }}>
          <input
            autoFocus
            value={newRoleName}
            onChange={e => setNewRoleName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAddRole()
              if (e.key === 'Escape') {
                setIsAdding(false)
                setNewRoleName('')
              }
            }}
            placeholder="Role name e.g. PI, Grad Student..."
            style={{
              flex: 1,
              background: '#1a1a1a',
              border: '1px solid #444',
              borderRadius: 6,
              padding: '8px 12px',
              color: '#fff',
              fontSize: 13,
              outline: 'none'
            }}
          />
          <button
            onClick={handleAddRole}
            style={{
              background: '#3b82f6',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            Add
          </button>
          <button
            onClick={() => {
              setIsAdding(false)
              setNewRoleName('')
            }}
            style={{
              background: 'none',
              border: '1px solid #333',
              borderRadius: 6,
              color: '#888',
              fontSize: 13,
              padding: '8px 12px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Role list */}
      {sortedRoles.length === 0 ? (
        <div style={{
          padding: '32px',
          textAlign: 'center',
          color: '#444',
          fontSize: 13,
          background: '#252526',
          borderRadius: 8,
          border: '1px dashed #333'
        }}>
          No roles yet. Add a role to get started.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sortedRoles.map((role, index) => (
            <RoleCard
              key={role.id}
              role={role}
              isOrganiser={isOrganiser}
              onUpdate={onRoleUpdate}
              onDelete={onRoleDelete}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              isFirst={index === 0}
              isLast={index === sortedRoles.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}