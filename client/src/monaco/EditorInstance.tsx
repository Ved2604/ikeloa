import { useEffect, useRef, useCallback } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import type { FileState, User } from "../../../shared/types";
import { DecorationManager } from "./DecorationManager";
import { LockManager } from "./LockManager";
import { RoleEngine } from "../engine/RoleEngine";
import { registerAllLanguages, detectLanguage } from "./languages/index";
import { registerHoverProvider } from "./hover/index";

interface EditorInstanceProps {
  file: FileState;
  currentUser: User;
  roleEngine: RoleEngine;
  lockManager: LockManager;
  onChange: (fileId: string, content: string) => void;
  onFocus: (fileId: string) => void;
  onBlur: (fileId: string) => void;
}

export const EditorInstance = ({
  file,
  currentUser,
  roleEngine,
  lockManager,
  onChange,
  onFocus,
  onBlur,
}: EditorInstanceProps) => {
  const monaco = useMonaco();
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const decorationManager = useRef(new DecorationManager());
  const changeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canEdit = roleEngine.canEdit(currentUser, file.id);
  const isLockedByOther = lockManager.isLockedByOther(file.id, currentUser.id);
  const isReadOnly = !canEdit || isLockedByOther;

  // Inject decoration styles once
  useEffect(() => {
    DecorationManager.injectStyles();
  }, []);

  // Update decorations when permission or lock state changes
  useEffect(() => {
    if (!editorRef.current) return;

    if (isLockedByOther) {
      const lockedByName = lockManager.getLockedByName(file.id);
      decorationManager.current.applyFileDecoration(
        "lockedByOther",
        lockedByName ?? undefined,
      );
      return;
    }

    if (!canEdit) {
      const permission = roleEngine.resolvePermission(currentUser, file.id);
      decorationManager.current.applyFileDecoration(
        permission === "hidden" ? "locked" : "readable",
      );
      return;
    }

    decorationManager.current.applyFileDecoration("owned");
  }, [canEdit, isLockedByOther, file.id, currentUser, roleEngine, lockManager]);

  // Update editor content when file content changes externally
  useEffect(() => {
    if (!editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;
    const currentValue = model.getValue();
    if (currentValue === file.content) return;

    // Preserve cursor position when applying external changes
    const position = editorRef.current.getPosition();
    model.pushEditOperations(
      [],
      [
        {
          range: model.getFullModelRange(),
          text: file.content,
        },
      ],
      () => null,
    );
    if (position) editorRef.current.setPosition(position);
  }, [file.content]);

  const handleEditorDidMount = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor) => {
      editorRef.current = editor;
      decorationManager.current.setEditor(editor);

      editor.onDidFocusEditorText(() => {
        onFocus(file.id);
      });

      editor.onDidBlurEditorText(() => {
        onBlur(file.id);
      });
    },
    [file.id, onFocus, onBlur],
  );

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (!value || isReadOnly) return;

      // Debounce — only send after 300ms of no typing
      if (changeTimeout.current) clearTimeout(changeTimeout.current);
      changeTimeout.current = setTimeout(() => {
        onChange(file.id, value);
      }, 300);
    },
    [file.id, isReadOnly, onChange],
  );

  // Determine language from file name
  const getLanguage = (fileName: string): string => {
    return detectLanguage(fileName);
  };

  // Suppress monaco warnings about unused imports
  useEffect(() => {
    if (!monaco) return;
    registerAllLanguages(monaco);
    registerHoverProvider(monaco);
    // Define Ikeloa's custom dark theme
    monaco.editor.defineTheme("ikeloa-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        // Keywords — blue
        { token: "keyword", foreground: "6ba3d6", fontStyle: "bold" },
        // Strings — soft green
        { token: "string", foreground: "8fbf7f" },
        // Comments — muted, italicised
        { token: "comment", foreground: "5a5a6a", fontStyle: "italic" },
        // Numbers — warm amber
        { token: "number", foreground: "d4a96a" },
        // Functions — light lavender
        { token: "entity.name.function", foreground: "b09fdf" },
        // Types — cyan
        { token: "entity.name.type", foreground: "4ec9b0" },
        { token: "support.type", foreground: "4ec9b0" },
        // Variables — off white
        { token: "variable", foreground: "d4d4d4" },
        // Operators
        { token: "operator", foreground: "c8c8c8" },
        // Python decorators
        { token: "meta.decorator", foreground: "b09fdf" },
        // Type annotations
        { token: "storage.type", foreground: "6ba3d6" },
      ],
      colors: {
        // Editor background — slightly warm dark
        "editor.background": "#141418",
        // Current line highlight — subtle
        "editor.lineHighlightBackground": "#1c1c24",
        // Selection — muted blue
        "editor.selectionBackground": "#2a3a52",
        "editor.inactiveSelectionBackground": "#1e2d40",
        // Cursor — bright white
        "editorCursor.foreground": "#ffffff",
        // Line numbers
        "editorLineNumber.foreground": "#3a3a4a",
        "editorLineNumber.activeForeground": "#6a6a8a",
        // Gutter — matches background
        "editorGutter.background": "#141418",
        // Scrollbar
        "scrollbarSlider.background": "#2a2a3a80",
        "scrollbarSlider.hoverBackground": "#3a3a5a80",
        // Minimap
        "minimap.background": "#111116",
        // Bracket match
        "editorBracketMatch.background": "#2a3a5280",
        "editorBracketMatch.border": "#4a6a9a",
        // Find match
        "editor.findMatchBackground": "#d4a96a40",
        "editor.findMatchHighlightBackground": "#d4a96a20",
        // Indent guides
        "editorIndentGuide.background1": "#1e1e28",
        "editorIndentGuide.activeBackground1": "#3a3a52",
        // Overview ruler
        "editorOverviewRuler.border": "#1a1a24",
      },
    });

    // Set as default theme
    monaco.editor.setTheme("ikeloa-dark");

    // TypeScript diagnostics
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    });
  }, [monaco]);

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      {isLockedByOther && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 16,
            zIndex: 10,
            background: "rgba(139, 92, 246, 0.15)",
            border: "1px solid #8b5cf6",
            borderRadius: 6,
            padding: "4px 12px",
            fontSize: 12,
            color: "#8b5cf6",
            pointerEvents: "none",
          }}
        >
          ✏️ {lockManager.getLockedByName(file.id)} is editing
        </div>
      )}

      {!canEdit && !isLockedByOther && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 16,
            zIndex: 10,
            background: "rgba(245, 158, 11, 0.15)",
            border: "1px solid #f59e0b",
            borderRadius: 6,
            padding: "4px 12px",
            fontSize: 12,
            color: "#f59e0b",
            pointerEvents: "none",
          }}
        >
          🔒 Read only
        </div>
      )}

      <Editor
        height="100%"
        language={getLanguage(file.name)}
        defaultValue={file.content}
        theme="ikeloa-dark"
        options={{
          readOnly: isReadOnly,
          fontSize: 14,
          fontFamily: "JetBrains Mono, Fira Code, monospace",
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          glyphMargin: true,
          lineNumbers: "on",
          renderLineHighlight: "all",
          cursorStyle: isReadOnly ? "underline" : "line",
          wordWrap: "on",
        }}
        onMount={handleEditorDidMount}
        onChange={handleChange}
      />
    </div>
  );
};
