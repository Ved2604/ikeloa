import { useState } from 'react'

interface JoinSessionProps {
  onJoin: (sessionId: string, userName: string) => void
}

export const JoinSession = ({ onJoin }: JoinSessionProps) => {
  const [sessionId, setSessionId] = useState('')
  const [userName, setUserName] = useState('')

  const handleJoin = () => {
    if (!sessionId.trim() || !userName.trim()) return
    onJoin(sessionId.trim().toUpperCase(), userName.trim())
  }

  const isValid = sessionId.trim().length > 0 && userName.trim().length > 0

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }}>
      <div>
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#555',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 8
        }}>
          Session Code
        </div>
        <input
          value={sessionId}
          onChange={e => setSessionId(e.target.value.toUpperCase())}
          onKeyDown={e => { if (e.key === 'Enter') handleJoin() }}
          placeholder="e.g. ALPHA-4521"
          style={{
            width: '100%',
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 8,
            padding: '10px 14px',
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: '0.1em',
            outline: 'none',
            boxSizing: 'border-box',
            fontFamily: 'monospace'
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = '#8b5cf6'
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = '#333'
          }}
        />
      </div>

      <div>
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#555',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 8
        }}>
          Your Name
        </div>
        <input
          value={userName}
          onChange={e => setUserName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleJoin() }}
          placeholder="e.g. Alex Kumar"
          style={{
            width: '100%',
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 8,
            padding: '10px 14px',
            color: '#fff',
            fontSize: 14,
            outline: 'none',
            boxSizing: 'border-box'
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = '#8b5cf6'
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = '#333'
          }}
        />
      </div>

      <div style={{
        padding: '12px 16px',
        background: 'rgba(139,92,246,0.08)',
        border: '1px solid rgba(139,92,246,0.2)',
        borderRadius: 8,
        fontSize: 12,
        color: '#888',
        lineHeight: 1.6
      }}>
        💡 Ask the session organiser for the session code. Your role and
        permissions will be assigned by them once you join.
      </div>

      <button
        onClick={handleJoin}
        disabled={!isValid}
        style={{
          background: isValid ? '#8b5cf6' : '#1a1a1a',
          border: 'none',
          borderRadius: 8,
          color: isValid ? '#fff' : '#444',
          fontSize: 14,
          fontWeight: 600,
          padding: '12px',
          cursor: isValid ? 'pointer' : 'default',
          transition: 'all 0.15s'
        }}
      >
        Join Session
      </button>
    </div>
  )
}