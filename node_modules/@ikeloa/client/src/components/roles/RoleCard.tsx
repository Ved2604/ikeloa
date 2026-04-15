import { useState } from 'react'
import type { Role } from '../../../../shared/types'

interface RoleCardProps {
  role: Role
  isOrganiser: boolean
  onUpdate: (role: Role) => void
  onDelete: (roleId: string) => void
  onMoveUp: (roleId: string) => void
  onMoveDown: (roleId: string) => void
  isFirst: boolean
  isLast: boolean
}

const COLORS = [
  '#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b',
  '#ef4444', '#ec4899', '#14b8a6', '#f97316'
]

export const RoleCard = ({
  role,
  isOrganiser,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast
}: RoleCardProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(role.name)

  const handleSaveName = () => {
    if (editName.trim() && editName !== role.name) {
      onUpdate({ ...role, name: editName.trim() })
    }
    setIsEditing(false)
  }

  const handleColorChange = (color: string) => {
    onUpdate({ ...role, color })
  }

  return (
    <div style={{
      background: '#252526',
      border: `1px solid ${role.color}30`,
      borderLeft: `3px solid ${role.color}`,
      borderRadius: 8,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }}>
      {/* Hierarchy controls */}
      {isOrganiser && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          flexShrink: 0
        }}>
          <button
            onClick={() => onMoveUp(role.id)}
            disabled={isFirst}
            style={{
              background: 'none',
              border: 'none',
              color: isFirst ? '#333' : '#666',
              cursor: isFirst ? 'default' : 'pointer',
              fontSize: 12,
              padding: '1px 4px',
              lineHeight: 1
            }}
          >
            ▲
          </button>
          <button
            onClick={() => onMoveDown(role.id)}
            disabled={isLast}
            style={{
              background: 'none',
              border: 'none',
              color: isLast ? '#333' : '#666',
              cursor: isLast ? 'default' : 'pointer',
              fontSize: 12,
              padding: '1px 4px',
              lineHeight: 1
            }}
          >
            ▼
          </button>
        </div>
      )}

      {/* Hierarchy level badge */}
      <div style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: `${role.color}20`,
        border: `1px solid ${role.color}50`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 700,
        color: role.color,
        flexShrink: 0
      }}>
        {role.hierarchyLevel}
      </div>

      {/* Role name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {isEditing ? (
          <input
            autoFocus
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSaveName()
              if (e.key === 'Escape') {
                setEditName(role.name)
                setIsEditing(false)
              }
            }}
            style={{
              background: '#1a1a1a',
              border: '1px solid #444',
              borderRadius: 4,
              padding: '4px 8px',
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              outline: 'none',
              width: '100%'
            }}
          />
        ) : (
          <div
            onClick={() => isOrganiser && setIsEditing(true)}
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: '#ddd',
              cursor: isOrganiser ? 'text' : 'default',
              padding: '4px 0'
            }}
            title={isOrganiser ? 'Click to rename' : ''}
          >
            {role.name}
          </div>
        )}
      </div>

      {/* Color picker */}
      {isOrganiser && (
        <div style={{
          display: 'flex',
          gap: 4,
          flexShrink: 0
        }}>
          {COLORS.map(color => (
            <div
              key={color}
              onClick={() => handleColorChange(color)}
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: color,
                cursor: 'pointer',
                border: role.color === color ? '2px solid #fff' : '2px solid transparent',
                transition: 'transform 0.1s'
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.2)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'
              }}
            />
          ))}
        </div>
      )}

      {/* Delete button */}
      {isOrganiser && (
        <button
          onClick={() => onDelete(role.id)}
          style={{
            background: 'none',
            border: 'none',
            color: '#444',
            cursor: 'pointer',
            fontSize: 16,
            padding: '2px 4px',
            borderRadius: 4,
            flexShrink: 0,
            transition: 'color 0.15s'
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = '#444'
          }}
          title="Delete role"
        >
          ✕
        </button>
      )}
    </div>
  )
}