import type * as Monaco from 'monaco-editor'

export type DecorationType = 'owned' | 'readable' | 'locked' | 'lockedByOther'

export class DecorationManager {
  private editor: Monaco.editor.IStandaloneCodeEditor | null = null
  private decorationIds: string[] = []

  setEditor(editor: Monaco.editor.IStandaloneCodeEditor): void {
    this.editor = editor
  }

  // Apply a full-file decoration based on permission type
  applyFileDecoration(type: DecorationType, lockedByName?: string): void {
    if (!this.editor) return

    const model = this.editor.getModel()
    if (!model) return

    const lineCount = model.getLineCount()

    const range: Monaco.IRange = {
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: lineCount,
      endColumn: model.getLineMaxColumn(lineCount)
    }

    const options = this.getDecorationOptions(type, lockedByName)

    this.decorationIds = this.editor.deltaDecorations(
      this.decorationIds,
      [{ range, options }]
    )
  }

  private getDecorationOptions(
    type: DecorationType,
    lockedByName?: string
  ): Monaco.editor.IModelDecorationOptions {
    switch (type) {
      case 'owned':
        return {
          className: 'decoration-owned',
          isWholeLine: true,
          overviewRuler: {
            color: '#22c55e',
            position: 1
          }
        }

      case 'readable':
        return {
          className: 'decoration-readable',
          isWholeLine: true,
          overviewRuler: {
            color: '#f59e0b',
            position: 1
          },
          glyphMarginHoverMessage: {
            value: '🔒 Read only — you can request changes'
          }
        }

      case 'locked':
        return {
          className: 'decoration-locked',
          isWholeLine: true,
          overviewRuler: {
            color: '#ef4444',
            position: 1
          },
          glyphMarginHoverMessage: {
            value: '⛔ You do not have access to this file'
          }
        }

      case 'lockedByOther':
        return {
          className: 'decoration-locked-by-other',
          isWholeLine: true,
          overviewRuler: {
            color: '#8b5cf6',
            position: 1
          },
          glyphMarginHoverMessage: {
            value: `✏️ ${lockedByName ?? 'Someone'} is editing this file`
          }
        }
    }
  }

  clearDecorations(): void {
    if (!this.editor) return
    this.decorationIds = this.editor.deltaDecorations(this.decorationIds, [])
  }

  // Inject CSS for decoration classes into the document
  static injectStyles(): void {
    const styleId = 'ikeloa-decorations'
    if (document.getElementById(styleId)) return

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .decoration-owned {
        background: rgba(34, 197, 94, 0.04);
        border-left: 2px solid #22c55e;
      }
      .decoration-readable {
        background: rgba(245, 158, 11, 0.06);
        border-left: 2px solid #f59e0b;
      }
      .decoration-locked {
        background: rgba(239, 68, 68, 0.06);
        border-left: 2px solid #ef4444;
      }
      .decoration-locked-by-other {
        background: rgba(139, 92, 246, 0.06);
        border-left: 2px solid #8b5cf6;
      }
    `
    document.head.appendChild(style)
  }
}