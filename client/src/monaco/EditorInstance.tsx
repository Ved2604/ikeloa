import { useEffect, useRef, useCallback } from 'react'
import Editor, { useMonaco } from '@monaco-editor/react'
import type * as Monaco from 'monaco-editor'
import type { FileState, User } from '../../../shared/types'
import { DecorationManager } from './DecorationManager'
import { LockManager } from './LockManager'
import { RoleEngine } from '../engine/RoleEngine'

interface EditorInstanceProps {
  file: FileState
  currentUser: User
  roleEngine: RoleEngine
  lockManager: LockManager
  onChange: (fileId: string, content: string) => void
  onFocus: (fileId: string) => void
  onBlur: (fileId: string) => void
}

export const EditorInstance = ({
  file,
  currentUser,
  roleEngine,
  lockManager,
  onChange,
  onFocus,
  onBlur
}: EditorInstanceProps) => {
  const monaco = useMonaco()
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
  const decorationManager = useRef(new DecorationManager())
  const changeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const canEdit = roleEngine.canEdit(currentUser, file.id)
  const isLockedByOther = lockManager.isLockedByOther(file.id, currentUser.id)
  const isReadOnly = !canEdit || isLockedByOther

  // Inject decoration styles once
  useEffect(() => {
    DecorationManager.injectStyles()
  }, [])

  // Update decorations when permission or lock state changes
  useEffect(() => {
    if (!editorRef.current) return

    if (isLockedByOther) {
      const lockedByName = lockManager.getLockedByName(file.id)
      decorationManager.current.applyFileDecoration('lockedByOther', lockedByName ?? undefined)
      return
    }

    if (!canEdit) {
      const permission = roleEngine.resolvePermission(currentUser, file.id)
      decorationManager.current.applyFileDecoration(
        permission === 'hidden' ? 'locked' : 'readable'
      )
      return
    }

    decorationManager.current.applyFileDecoration('owned')
  }, [canEdit, isLockedByOther, file.id, currentUser, roleEngine, lockManager])

  // Update editor content when file content changes externally
  useEffect(() => {
    if (!editorRef.current) return
    const model = editorRef.current.getModel()
    if (!model) return
    const currentValue = model.getValue()
    if (currentValue !== file.content) {
      model.setValue(file.content)
    }
  }, [file.content])

  const handleEditorDidMount = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor) => {
      editorRef.current = editor
      decorationManager.current.setEditor(editor)

      editor.onDidFocusEditorText(() => {
        onFocus(file.id)
      })

      editor.onDidBlurEditorText(() => {
        onBlur(file.id)
      })
    },
    [file.id, onFocus, onBlur]
  )

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (!value || isReadOnly) return

      // Debounce — only send after 300ms of no typing
      if (changeTimeout.current) clearTimeout(changeTimeout.current)
      changeTimeout.current = setTimeout(() => {
        onChange(file.id, value)
      }, 300)
    },
    [file.id, isReadOnly, onChange]
  )

  // Determine language from file name
  const getLanguage = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    const map: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      json: 'json',
      md: 'markdown',
      css: 'css',
      html: 'html',
      yaml: 'yaml',
      yml: 'yaml',
      sh: 'shell',
      env: 'plaintext',
      txt: 'plaintext'
    }
    return map[ext ?? ''] ?? 'plaintext'
  }

  // Suppress monaco warnings about unused imports
  useEffect(() => {
    if (!monaco) return
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false
    })
  }, [monaco])

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {isLockedByOther && (
        <div style={{
          position: 'absolute',
          top: 8,
          right: 16,
          zIndex: 10,
          background: 'rgba(139, 92, 246, 0.15)',
          border: '1px solid #8b5cf6',
          borderRadius: 6,
          padding: '4px 12px',
          fontSize: 12,
          color: '#8b5cf6',
          pointerEvents: 'none'
        }}>
          ✏️ {lockManager.getLockedByName(file.id)} is editing
        </div>
      )}

      {!canEdit && !isLockedByOther && (
        <div style={{
          position: 'absolute',
          top: 8,
          right: 16,
          zIndex: 10,
          background: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid #f59e0b',
          borderRadius: 6,
          padding: '4px 12px',
          fontSize: 12,
          color: '#f59e0b',
          pointerEvents: 'none'
        }}>
          🔒 Read only
        </div>
      )}

      <Editor
        height="100%"
        language={getLanguage(file.name)}
        defaultValue={file.content}
        theme="vs-dark"
        options={{
          readOnly: isReadOnly,
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Fira Code, monospace',
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          glyphMargin: true,
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          cursorStyle: isReadOnly ? 'underline' : 'line',
          wordWrap: 'on'
        }}
        onMount={handleEditorDidMount}
        onChange={handleChange}
      />
    </div>
  )
}