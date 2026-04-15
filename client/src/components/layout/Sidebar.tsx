import { useState, useRef, useEffect } from "react";
import type {
  FileState,
  FolderState,
  User,
  Role,
  PermissionLevel,
} from "../../../../shared/types";
import { RoleEngine } from "../../engine/RoleEngine";

interface SidebarProps {
  files: FileState[];
  folders: FolderState[];
  activeFileId: string | null;
  currentUser: User;
  roles: Record<string, Role>;
  roleEngine: RoleEngine;
  isOrganiser: boolean;
  onFileSelect: (fileId: string) => void;
  onFileDelete: (fileId: string) => void;
  onFolderDelete: (folderId: string) => void;
  onPermissionChange: (
    roleId: string,
    fileId: string,
    permission: PermissionLevel,
  ) => void;
  onAddFile: () => void;
  onAddFolder: () => void;
}

interface ContextMenu {
  x: number;
  y: number;
  fileId: string;
}

const getFileIcon = (fileName: string): string => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: "📘",
    tsx: "⚛️",
    js: "📙",
    jsx: "⚛️",
    py: "🐍",
    json: "📋",
    md: "📝",
    css: "🎨",
    html: "🌐",
    env: "🔐",
    yaml: "⚙️",
    yml: "⚙️",
    sh: "💻",
    txt: "📄",
  };
  return map[ext ?? ""] ?? "📄";
};

const getPermissionColor = (
  user: User,
  fileId: string,
  roleEngine: RoleEngine,
): string => {
  const permission = roleEngine.resolvePermission(user, fileId);
  if (permission === "edit") return "#22c55e";
  if (permission === "read") return "#f59e0b";
  return "#ef4444";
};

const getPermissionLabel = (
  user: User,
  fileId: string,
  roleEngine: RoleEngine,
): string => {
  const permission = roleEngine.resolvePermission(user, fileId);
  if (permission === "edit") return "edit";
  if (permission === "read") return "read";
  return "hidden";
};

export const Sidebar = ({
  files,
  folders,
  activeFileId,
  currentUser,
  roles,
  roleEngine,
  isOrganiser,
  onFileSelect,
  onFileDelete,
  onFolderDelete,
  onPermissionChange,
  onAddFile,
  onAddFolder,
}: SidebarProps) => {
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [expandedPermissions, setExpandedPermissions] = useState<string | null>(
    null,
  );
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const sortedRoles = Object.values(roles).sort(
    (a, b) => a.hierarchyLevel - b.hierarchyLevel,
  );

  // Close context menu on outside click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu]);

  const handleRightClick = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, fileId });
    setExpandedPermissions(null);
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const renderFile = (file: FileState) => {
    const isActive = file.id === activeFileId;
    const permColor = getPermissionColor(currentUser, file.id, roleEngine);
    const permLabel = getPermissionLabel(currentUser, file.id, roleEngine);
    const isLocked = file.lockedBy && file.lockedBy !== currentUser.id;

    return (
      <div
        key={file.id}
        onClick={() => onFileSelect(file.id)}
        onContextMenu={(e) => handleRightClick(e, file.id)}
        style={{
          padding: "7px 16px",
          cursor: "pointer",
          background: isActive ? "#2a2a2a" : "transparent",
          borderLeft: isActive
            ? `2px solid ${permColor}`
            : "2px solid transparent",
          display: "flex",
          alignItems: "center",
          gap: 8,
          transition: "background 0.15s",
          userSelect: "none",
        }}
        onMouseEnter={(e) => {
          if (!isActive)
            (e.currentTarget as HTMLDivElement).style.background = "#222";
        }}
        onMouseLeave={(e) => {
          if (!isActive)
            (e.currentTarget as HTMLDivElement).style.background =
              "transparent";
        }}
      >
        <span style={{ fontSize: 13, flexShrink: 0 }}>
          {getFileIcon(file.name)}
        </span>
        <span
          style={{
            flex: 1,
            fontSize: 13,
            color: isActive ? "#fff" : "#aaa",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {file.name}
        </span>
        {isLocked && <span style={{ fontSize: 10, color: "#8b5cf6" }}>✏️</span>}
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: permColor,
            background: `${permColor}18`,
            border: `1px solid ${permColor}40`,
            borderRadius: 4,
            padding: "1px 5px",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            flexShrink: 0,
          }}
        >
          {permLabel}
        </span>
      </div>
    );
  };

  const rootFiles = files.filter((f) => !f.folderId);
  const rootFolders = folders;

  return (
    <div
      style={{
        width: 240,
        minWidth: 240,
        background: "#1a1a1a",
        borderRight: "1px solid #2a2a2a",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px 8px",
          borderBottom: "1px solid #2a2a2a",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#555",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Files
        </div>
        {isOrganiser && (
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={onAddFolder}
              title="New folder"
              style={{
                background: "none",
                border: "none",
                color: "#555",
                cursor: "pointer",
                fontSize: 14,
                padding: "2px 4px",
                borderRadius: 4,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#555";
              }}
            >
              📁+
            </button>
            <button
              onClick={onAddFile}
              title="New file"
              style={{
                background: "none",
                border: "none",
                color: "#555",
                cursor: "pointer",
                fontSize: 14,
                padding: "2px 4px",
                borderRadius: 4,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#555";
              }}
            >
              📄+
            </button>
          </div>
        )}
      </div>

      {/* File tree */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {files.length === 0 && folders.length === 0 && (
          <div
            style={{
              padding: "24px 16px",
              color: "#444",
              fontSize: 13,
              textAlign: "center",
            }}
          >
            No files yet
          </div>
        )}

        {/* Folders */}
        {rootFolders.map((folder) => {
          const isExpanded = expandedFolders.has(folder.id);
          const folderFiles = files.filter((f) => f.folderId === folder.id);

          return (
            <div key={folder.id}>
              {/* Folder row */}
              <div
                onClick={() => toggleFolder(folder.id)}
                style={{
                  padding: "7px 16px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  userSelect: "none",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = "#222";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background =
                    "transparent";
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: "#555",
                    transition: "transform 0.15s",
                    display: "inline-block",
                    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                  }}
                >
                  ▶
                </span>
                <span style={{ fontSize: 14 }}>{isExpanded ? "📂" : "📁"}</span>
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: "#aaa",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {folder.name}
                </span>
                {isOrganiser && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFolderDelete(folder.id);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#444",
                      cursor: "pointer",
                      fontSize: 12,
                      padding: "0 2px",
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "#ef4444";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "#444";
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Folder contents */}
              {isExpanded && (
                <div style={{ paddingLeft: 16 }}>
                  {folderFiles.map((file) => renderFile(file))}
                  {folderFiles.length === 0 && (
                    <div
                      style={{
                        padding: "6px 16px",
                        fontSize: 12,
                        color: "#444",
                        fontStyle: "italic",
                      }}
                    >
                      Empty folder
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Root files */}
        {rootFiles.map((file) => renderFile(file))}
      </div>

      {/* Current user info */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid #2a2a2a",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "#333",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            color: "#fff",
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {currentUser.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ overflow: "hidden" }}>
          <div
            style={{
              fontSize: 12,
              color: "#ccc",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {currentUser.name}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "#555",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {currentUser.isOrganiser ? "⭐ Organiser" : "Collaborator"}
          </div>
        </div>
      </div>

      {/* Right-click context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            background: "#1e1e1e",
            border: "1px solid #333",
            borderRadius: 8,
            zIndex: 1000,
            minWidth: 200,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            overflow: "hidden",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Open file */}
          <div
            onClick={() => {
              onFileSelect(contextMenu.fileId);
              setContextMenu(null);
            }}
            style={{
              padding: "9px 16px",
              fontSize: 13,
              color: "#ddd",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = "#2a2a2a";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background =
                "transparent";
            }}
          >
            📂 Open
          </div>

          {/* Permissions submenu — organiser only */}
          {isOrganiser && sortedRoles.length > 0 && (
            <>
              <div
                style={{ height: 1, background: "#2a2a2a", margin: "2px 0" }}
              />
              <div
                onClick={() =>
                  setExpandedPermissions(
                    expandedPermissions === contextMenu.fileId
                      ? null
                      : contextMenu.fileId,
                  )
                }
                style={{
                  padding: "9px 16px",
                  fontSize: 13,
                  color: "#ddd",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background =
                    "#2a2a2a";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background =
                    "transparent";
                }}
              >
                <span>🔐 Set Permissions</span>
                <span style={{ color: "#555", fontSize: 11 }}>▶</span>
              </div>

              {/* Role permission rows */}
              {expandedPermissions === contextMenu.fileId &&
                sortedRoles.map((role) => {
                  const currentPerm =
                    role.permissions[contextMenu.fileId] ?? "read";
                  return (
                    <div
                      key={role.id}
                      style={{
                        padding: "8px 16px 8px 24px",
                        background: "#252526",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: role.color,
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontSize: 12, color: "#ccc" }}>
                          {role.name}
                        </span>
                      </div>
                      <select
                        value={currentPerm}
                        onChange={(e) => {
                          onPermissionChange(
                            role.id,
                            contextMenu.fileId,
                            e.target.value as PermissionLevel,
                          );
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          background: "#1a1a1a",
                          border: "1px solid #444",
                          borderRadius: 4,
                          color:
                            currentPerm === "edit"
                              ? "#22c55e"
                              : currentPerm === "read"
                                ? "#f59e0b"
                                : "#ef4444",
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "3px 6px",
                          cursor: "pointer",
                          outline: "none",
                        }}
                      >
                        <option
                          value="edit"
                          style={{ background: "#1e1e1e", color: "#fff" }}
                        >
                          edit
                        </option>
                        <option
                          value="read"
                          style={{ background: "#1e1e1e", color: "#fff" }}
                        >
                          read
                        </option>
                        <option
                          value="hidden"
                          style={{ background: "#1e1e1e", color: "#fff" }}
                        >
                          hidden
                        </option>
                      </select>
                    </div>
                  );
                })}
            </>
          )}

          {/* Delete file — organiser only */}
          {isOrganiser && (
            <>
              <div
                style={{ height: 1, background: "#2a2a2a", margin: "2px 0" }}
              />
              <div
                onClick={() => {
                  onFileDelete(contextMenu.fileId);
                  setContextMenu(null);
                }}
                style={{
                  padding: "9px 16px",
                  fontSize: 13,
                  color: "#ef4444",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background =
                    "#2a2a2a";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background =
                    "transparent";
                }}
              >
                🗑️ Delete File
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
