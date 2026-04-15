import { useRef, useEffect } from 'react'
import { DiffEditor } from '@monaco-editor/react'
import type * as Monaco from 'monaco-editor'
import type { ChangeRequest } from '../../../shared/types'

interface ChangeRequestDiffProps {
  changeRequest: ChangeRequest
  onApprove: (changeRequestId: string) => void
  onReject: (changeRequestId: string, reason: string) => void
  onClose: () => void
  requesterName: string
}

export const ChangeRequestDiff = ({
  changeRequest,
  onApprove,
  onReject,
  onClose,
  requesterName
}: ChangeRequestDiffProps) => {
  const diffEditorRef = useRef<Monaco.editor.IStandaloneDiffEditor | null>(null)
  const rejectReasonRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    return () => {
      diffEditorRef.current?.dispose()
    }
  }, [])

  const handleApprove = () => {
    onApprove(changeRequest.id)
    onClose()
  }

  const handleReject = () => {
    const reason = rejectReasonRef.current?.value ?? ''
    onReject(changeRequest.id, reason)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: '#1e1e1e',
        borderRadius: 12,
        border: '1px solid #333',
        width: '85vw',
        maxWidth: 1100,
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>

        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>
              Change Request — {changeRequest.fileName}
            </div>
            <div style={{ color: '#888', fontSize: 13, marginTop: 2 }}>
              Proposed by {requesterName}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              fontSize: 20,
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Diff labels */}
        <div style={{
          display: 'flex',
          padding: '8px 24px',
          background: '#252526',
          borderBottom: '1px solid #333',
          gap: 8
        }}>
          <div style={{
            flex: 1,
            fontSize: 12,
            color: '#ef4444',
            fontWeight: 500
          }}>
            ← Original
          </div>
          <div style={{
            flex: 1,
            fontSize: 12,
            color: '#22c55e',
            fontWeight: 500,
            textAlign: 'right'
          }}>
            Proposed →
          </div>
        </div>

        {/* Diff Editor */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <DiffEditor
            height="100%"
            original={changeRequest.originalContent}
            modified={changeRequest.proposedContent}
            theme="vs-dark"
            options={{
              readOnly: true,
              fontSize: 13,
              fontFamily: 'JetBrains Mono, Fira Code, monospace',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              renderSideBySide: true
            }}
            onMount={(editor:Monaco.editor.IStandaloneDiffEditor) => {
              diffEditorRef.current = editor
            }}
          />
        </div>

        {/* Footer — reject reason + actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <input
            ref={rejectReasonRef}
            placeholder="Rejection reason (optional)"
            style={{
              flex: 1,
              background: '#2d2d2d',
              border: '1px solid #444',
              borderRadius: 6,
              padding: '8px 12px',
              color: '#fff',
              fontSize: 13,
              outline: 'none'
            }}
          />
          <button
            onClick={handleReject}
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid #ef4444',
              borderRadius: 6,
              color: '#ef4444',
              padding: '8px 20px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500
            }}
          >
            Reject
          </button>
          <button
            onClick={handleApprove}
            style={{
              background: 'rgba(34,197,94,0.15)',
              border: '1px solid #22c55e',
              borderRadius: 6,
              color: '#22c55e',
              padding: '8px 20px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500
            }}
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  )
}