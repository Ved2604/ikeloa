import { useState, useEffect, useCallback } from "react";
import type {
  FileState,
  FolderState,
  ChangeRequest,
  Role,
  PermissionLevel,
} from "../../../shared/types";
import { SessionState } from "../engine/SessionState";
import { socketClient } from "../socket/SocketClient";
import { onUserJoined } from "../socket/handlers/onUserJoined";
import { onFileChanged } from "../socket/handlers/onFileChanged";
import { onRoleUpdated } from "../socket/handlers/onRoleUpdated";
import { onChangeRequest } from "../socket/handlers/onChangeRequest";
import { onNotification } from "../socket/handlers/onNotification";
import { LockManager } from "../monaco/LockManager";
import { EditorInstance } from "../monaco/EditorInstance";
import { ChangeRequestDiff } from "../monaco/ChangeRequestDiff";
import { Sidebar } from "../components/layout/Sidebar";
import { TabBar } from "../components/layout/TabBar";
import { NotificationPanel } from "../components/layout/NotificationPanel";
import { RoleManager } from "../components/roles/RoleManager";
import { UserRoleAssigner } from "../components/roles/UserRoleAssigner";
import { ChangeAlertToast } from "../components/notifications/ChangeAlertToast";
import { ChangeRequestToast } from "../components/notifications/ChangeRequestToast";
import { v4 as uuidv4 } from "uuid";
import type {
  JoinAckPayload,
  FileLockPayload,
  WSMessage,
  FileAddPayload,
  FolderAddPayload,
  FileDeletePayload,
  FolderDeletePayload,
  Notification,
} from "../../../shared/types";

interface SessionPageProps {
  mode: "create" | "join";
  userName: string;
  sessionId?: string;
  initialFiles?: FileState[];
  initialFolders?: FolderState[];
}

type PanelTab = "roles" | "permissions" | "members";

// Add/Create file modal state
interface NewFileModal {
  type: "file" | "folder";
  name: string;
  folderId: string | null;
}

export const SessionPage = ({
  mode,
  userName,
  sessionId,
  initialFiles = [],
  initialFolders = [],
}: SessionPageProps) => {
  const [state] = useState(() => new SessionState());
  const [lockManager] = useState(() => new LockManager());
  const [, forceUpdate] = useState(0);
  const [openFileIds, setOpenFileIds] = useState<string[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>("roles");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [reviewingRequest, setReviewingRequest] =
    useState<ChangeRequest | null>(null);
  const [toasts, setToasts] = useState<
    Array<{
      id: string;
      type: "request" | "alert";
      data: ChangeRequest | { notification: Notification; id: string };
    }>
  >([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [requestingChangeForFile, setRequestingChangeForFile] =
    useState<FileState | null>(null);
  const [proposedContent, setProposedContent] = useState("");
  const [newFileModal, setNewFileModal] = useState<NewFileModal | null>(null);

  const rerender = useCallback(() => forceUpdate((n) => n + 1), []);

  const addToast = useCallback(
    (
      type: "request" | "alert",
      data: ChangeRequest | { notification: Notification; id: string },
    ) => {
      const id = uuidv4();
      setToasts((prev) => [...prev, { id, type, data }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 6000);
    },
    [],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const connect = async () => {
      try {
        await socketClient.connect();
        setIsConnecting(false);

        socketClient.on("join_ack", (message: WSMessage) => {
          const payload = message.payload as JoinAckPayload;
          state.initialize(payload.session, payload.userId);
          socketClient.setSessionId(payload.session.id);
          lockManager.syncFromFiles(payload.session.files);
          rerender();
        });

        socketClient.on("user_joined", (message: WSMessage) => {
          onUserJoined(message, state);
          rerender();
        });

        socketClient.on("user_left", (message: WSMessage) => {
          const payload = message.payload as { userId: string };
          state.removeUser(payload.userId);
          rerender();
        });

        socketClient.on("file_change", (message: WSMessage) => {
          onFileChanged(message, state);
          rerender();
        });

        socketClient.on("file_lock", (message: WSMessage) => {
          const payload = message.payload as FileLockPayload;
          lockManager.setLock(
            payload.fileId,
            payload.lockedBy,
            payload.lockedByName,
          );
          state.lockFile(
            payload.fileId,
            payload.lockedBy,
            payload.lockedByName,
          );
          rerender();
        });

        socketClient.on("file_unlock", (message: WSMessage) => {
          const payload = message.payload as FileLockPayload;
          lockManager.setLock(payload.fileId, null, null);
          state.lockFile(payload.fileId, null, null);
          rerender();
        });

        socketClient.on("role_create", (message: WSMessage) => {
          onRoleUpdated(message, state);
          rerender();
        });

        socketClient.on("role_update", (message: WSMessage) => {
          onRoleUpdated(message, state);
          rerender();
        });

        socketClient.on("role_delete", (message: WSMessage) => {
          onRoleUpdated(message, state);
          rerender();
        });

        socketClient.on("user_role_assign", (message: WSMessage) => {
          onRoleUpdated(message, state);
          rerender();
        });

        socketClient.on("change_request_create", (message: WSMessage) => {
          onChangeRequest(message, state);
          const payload = message.payload as { changeRequest: ChangeRequest };
          if (
            state.currentUser?.isOrganiser ||
            (state.currentUser &&
              state.roleEngine.outranks(
                state.currentUser.roleId,
                state.session?.users[payload.changeRequest.requesterId]
                  ?.roleId ?? "",
              ))
          ) {
            addToast("request", payload.changeRequest);
          }
          rerender();
        });

        socketClient.on("change_request_resolve", (message: WSMessage) => {
          onChangeRequest(message, state);
          rerender();
        });

        socketClient.on("notification", (message: WSMessage) => {
          onNotification(message, state);
          const payload = message.payload as { notification: Notification };
          addToast("alert", {
            notification: payload.notification,
            id: payload.notification.id,
          });
          rerender();
        });

        socketClient.on("file_add", (message: WSMessage) => {
          const payload = message.payload as FileAddPayload;
          state.addFile(payload.file);
          rerender();
        });

        socketClient.on("file_delete", (message: WSMessage) => {
          const payload = message.payload as FileDeletePayload;
          state.deleteFile(payload.fileId);
          setOpenFileIds((prev) => prev.filter((id) => id !== payload.fileId));
          if (activeFileId === payload.fileId) setActiveFileId(null);
          rerender();
        });

        socketClient.on("folder_add", (message: WSMessage) => {
          const payload = message.payload as FolderAddPayload;
          state.addFolder(payload.folder);
          rerender();
        });

        socketClient.on("folder_delete", (message: WSMessage) => {
          const payload = message.payload as FolderDeletePayload;
          state.deleteFolder(payload.folderId);
          rerender();
        });

        socketClient.on("error", (message: WSMessage) => {
          const payload = message.payload as { message: string };
          console.error("[Session] Server error:", payload.message);
        });

        if (mode === "create") {
          socketClient.joinAsOrganiser(userName, initialFiles, initialFolders);
        } else if (sessionId) {
          socketClient.joinAsCollaborator(sessionId, userName);
        }
      } catch (err) {
        console.error("[Session] Connection error:", err);
        setIsConnecting(false);
        setConnectionError(
          "Could not connect to server. Make sure the server is running.",
        );
      }
    };

    connect();
    return () => {
      socketClient.disconnect();
    };
  }, []);

  const handleFileSelect = useCallback(
    (fileId: string) => {
      state.setActiveFile(fileId);
      setActiveFileId(fileId);
      setOpenFileIds((prev) =>
        prev.includes(fileId) ? prev : [...prev, fileId],
      );
    },
    [state],
  );

  const handleTabClose = useCallback(
    (fileId: string) => {
      setOpenFileIds((prev) => {
        const next = prev.filter((id) => id !== fileId);
        if (activeFileId === fileId) {
          const newActive = next[next.length - 1] ?? null;
          setActiveFileId(newActive);
          state.setActiveFile(newActive ?? "");
        }
        return next;
      });
    },
    [activeFileId, state],
  );

  const handleFileChange = useCallback(
    (fileId: string, content: string) => {
      state.updateFileContent(fileId, content);
      socketClient.sendFileChange(fileId, content);
    },
    [state],
  );

  const handleFileFocus = useCallback((fileId: string) => {
    socketClient.sendFileLock(fileId);
  }, []);

  const handleFileBlur = useCallback((fileId: string) => {
    socketClient.sendFileUnlock(fileId);
  }, []);

  const handleRoleCreate = useCallback((role: Role) => {
    socketClient.sendRoleCreate({ role });
  }, []);

  const handleRoleUpdate = useCallback((role: Role) => {
    socketClient.sendRoleUpdate({ role });
  }, []);

  const handleRoleDelete = useCallback((roleId: string) => {
    socketClient.sendRoleDelete({ roleId });
  }, []);

  const handleUserRoleAssign = useCallback((userId: string, roleId: string) => {
    socketClient.sendUserRoleAssign({ userId, roleId });
  }, []);

  const handlePermissionChange = useCallback(
    (roleId: string, fileId: string, permission: PermissionLevel) => {
      if (!state.session) return;
      const role = state.session.roles[roleId];
      if (!role) return;
      const updatedRole: Role = {
        ...role,
        permissions: { ...role.permissions, [fileId]: permission },
      };
      socketClient.sendRoleUpdate({ role: updatedRole });
    },
    [state],
  );

  const handleAddFile = useCallback(() => {
    setNewFileModal({ type: "file", name: "", folderId: null });
  }, []);

  const handleAddFolder = useCallback(() => {
    setNewFileModal({ type: "folder", name: "", folderId: null });
  }, []);

  const handleCreateNewItem = useCallback(() => {
    if (!newFileModal || !newFileModal.name.trim()) return;

    if (newFileModal.type === "folder") {
      const folder: FolderState = {
        id: uuidv4(),
        name: newFileModal.name.trim(),
        parentId: null,
      };
      socketClient.sendFolderAdd(folder);
    } else {
      const file: FileState = {
        id: uuidv4(),
        name: newFileModal.name.trim(),
        content: "",
        language: "plaintext",
        lockedBy: null,
        folderId: newFileModal.folderId,
      };
      socketClient.sendFileAdd(file);
    }

    setNewFileModal(null);
  }, [newFileModal]);

  const handleFileDelete = useCallback((fileId: string) => {
    socketClient.sendFileDelete(fileId);
  }, []);

  const handleFolderDelete = useCallback((folderId: string) => {
    socketClient.sendFolderDelete(folderId);
  }, []);

  const handleChangeRequest = useCallback(() => {
    if (!requestingChangeForFile || !state.currentUser || !state.session)
      return;
    const originalContent =
      state.session.files[requestingChangeForFile.id]?.content ?? "";
    const cr: ChangeRequest = {
      id: uuidv4(),
      requesterId: state.currentUser.id,
      requesterName: state.currentUser.name,
      fileId: requestingChangeForFile.id,
      fileName: requestingChangeForFile.name,
      proposedContent,
      originalContent,
      status: "pending",
      createdAt: Date.now(),
    };
    socketClient.sendChangeRequest({ changeRequest: cr });
    setRequestingChangeForFile(null);
    setProposedContent("");
  }, [requestingChangeForFile, proposedContent, state]);

  const handleApproveRequest = useCallback((changeRequestId: string) => {
    socketClient.sendChangeRequestResolve({
      changeRequestId,
      status: "approved",
    });
  }, []);

  const handleRejectRequest = useCallback(
    (changeRequestId: string, reason: string) => {
      socketClient.sendChangeRequestResolve({
        changeRequestId,
        status: "rejected",
        rejectionReason: reason,
      });
    },
    [],
  );

  // Download all visible files as a zip
  const handleDownload = useCallback(async () => {
    if (!state.session || !state.currentUser) return;
    const visibleFiles = state.getVisibleFiles();

    // Dynamically import JSZip
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    visibleFiles.forEach((file) => {
      const folder = file.folderId
        ? state.session!.folders[file.folderId]
        : null;
      const path = folder ? `${folder.name}/${file.name}` : file.name;
      zip.file(path, file.content);
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ikeloa-session-${state.getSessionId()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  if (isConnecting) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#111",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#555",
          fontSize: 14,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🔬</div>
          <div>Connecting to session...</div>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#111",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
          <div style={{ color: "#fff", marginBottom: 8, fontWeight: 600 }}>
            Connection Failed
          </div>
          <div style={{ color: "#888" }}>{connectionError}</div>
        </div>
      </div>
    );
  }

  if (!state.session || !state.currentUser) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#111",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#555",
          fontSize: 14,
        }}
      >
        Waiting for session data...
      </div>
    );
  }

  const visibleFiles = state.getVisibleFiles();
  const folders = state.getFolders();
  const activeFile = activeFileId
    ? (state.session.files[activeFileId] ?? null)
    : null;
  const openFiles = openFileIds
    .map((id) => state.session!.files[id])
    .filter(Boolean);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#1e1e1e",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          height: 48,
          background: "#1a1a1a",
          borderBottom: "1px solid #2a2a2a",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 16,
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 18 }}>🔬</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
          Ikeloa
        </div>

        {/* Session code with copy button */}
        <div
          onClick={() => navigator.clipboard.writeText(state.getSessionId())}
          title="Click to copy session code"
          style={{
            fontSize: 12,
            color: "#888",
            background: "#252526",
            border: "1px solid #333",
            borderRadius: 6,
            padding: "3px 10px",
            fontFamily: "monospace",
            letterSpacing: "0.08em",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = "#555";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = "#333";
          }}
        >
          {state.getSessionId()}
          <span style={{ fontSize: 10, color: "#555" }}>📋</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Download button */}
        <button
          onClick={handleDownload}
          title="Download all your files as zip"
          style={{
            background: "rgba(34,197,94,0.1)",
            border: "1px solid #22c55e",
            borderRadius: 6,
            color: "#22c55e",
            fontSize: 12,
            fontWeight: 500,
            padding: "5px 12px",
            cursor: "pointer",
          }}
        >
          ⬇️ Download
        </button>

        {/* Panel toggle */}
        <button
          onClick={() => setIsPanelOpen((prev) => !prev)}
          style={{
            background: isPanelOpen ? "rgba(59,130,246,0.15)" : "none",
            border: isPanelOpen ? "1px solid #3b82f6" : "1px solid #333",
            borderRadius: 6,
            color: isPanelOpen ? "#3b82f6" : "#888",
            fontSize: 12,
            fontWeight: 500,
            padding: "5px 12px",
            cursor: "pointer",
          }}
        >
          ⚙️ Manage
        </button>

        {/* Notifications */}
        <NotificationPanel
          notifications={state.notifications}
          changeRequests={Object.values(state.session.changeRequests)}
          currentUser={state.currentUser}
          onMarkAllRead={() => {
            state.markAllRead();
            rerender();
          }}
          onReviewChangeRequest={(cr) => setReviewingRequest(cr)}
        />
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sidebar */}
        <Sidebar
          files={visibleFiles}
          folders={folders}
          activeFileId={activeFileId}
          currentUser={state.currentUser}
          roles={state.session.roles}
          roleEngine={state.roleEngine}
          isOrganiser={state.isOrganiser()}
          onFileSelect={handleFileSelect}
          onFileDelete={handleFileDelete}
          onFolderDelete={handleFolderDelete}
          onPermissionChange={handlePermissionChange}
          onAddFile={handleAddFile}
          onAddFolder={handleAddFolder}
        />

        {/* Editor area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <TabBar
            openFiles={openFiles}
            activeFileId={activeFileId}
            currentUser={state.currentUser}
            roleEngine={state.roleEngine}
            onTabSelect={handleFileSelect}
            onTabClose={handleTabClose}
          />

          {activeFile ? (
            <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
              <EditorInstance
                key={activeFile.id}
                file={activeFile}
                currentUser={state.currentUser}
                roleEngine={state.roleEngine}
                lockManager={lockManager}
                onChange={handleFileChange}
                onFocus={handleFileFocus}
                onBlur={handleFileBlur}
              />
              {state.roleEngine.resolvePermission(
                state.currentUser,
                activeFile.id,
              ) === "read" && (
                <button
                  onClick={() => {
                    setRequestingChangeForFile(activeFile);
                    setProposedContent(activeFile.content);
                  }}
                  style={{
                    position: "absolute",
                    bottom: 24,
                    right: 24,
                    background: "rgba(139,92,246,0.15)",
                    border: "1px solid #8b5cf6",
                    borderRadius: 8,
                    color: "#8b5cf6",
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "10px 20px",
                    cursor: "pointer",
                    zIndex: 10,
                  }}
                >
                  🔔 Request Change
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#333",
                fontSize: 14,
              }}
            >
              Select a file to start editing
            </div>
          )}
        </div>

        {/* Management panel */}
        {isPanelOpen && (
          <div
            style={{
              width: 380,
              background: "#1a1a1a",
              borderLeft: "1px solid #2a2a2a",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid #2a2a2a",
                flexShrink: 0,
              }}
            >
              {(["roles", "members"] as PanelTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPanelTab(tab)}
                  style={{
                    flex: 1,
                    padding: "10px 4px",
                    background: "none",
                    border: "none",
                    borderBottom:
                      panelTab === tab
                        ? "2px solid #3b82f6"
                        : "2px solid transparent",
                    color: panelTab === tab ? "#fff" : "#555",
                    fontSize: 12,
                    fontWeight: panelTab === tab ? 600 : 400,
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              {panelTab === "roles" && (
                <RoleManager
                  roles={state.session.roles}
                  isOrganiser={state.isOrganiser()}
                  onRoleCreate={handleRoleCreate}
                  onRoleUpdate={handleRoleUpdate}
                  onRoleDelete={handleRoleDelete}
                />
              )}
              {panelTab === "members" && (
                <UserRoleAssigner
                  users={state.session.users}
                  roles={state.session.roles}
                  currentUserId={state.currentUser.id}
                  isOrganiser={state.isOrganiser()}
                  onAssign={handleUserRoleAssign}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Change request diff modal */}
      {reviewingRequest && state.session && (
        <ChangeRequestDiff
          changeRequest={reviewingRequest}
          requesterName={state.getUserName(reviewingRequest.requesterId)}
          onApprove={handleApproveRequest}
          onReject={handleRejectRequest}
          onClose={() => setReviewingRequest(null)}
        />
      )}

      {/* Change request composer */}
      {requestingChangeForFile && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#1e1e1e",
              border: "1px solid #333",
              borderRadius: 12,
              width: "70vw",
              maxWidth: 800,
              height: "70vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid #333",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ color: "#fff", fontWeight: 600 }}>
                  Propose Changes — {requestingChangeForFile.name}
                </div>
                <div style={{ color: "#888", fontSize: 12, marginTop: 2 }}>
                  Edit below and submit for review
                </div>
              </div>
              <button
                onClick={() => setRequestingChangeForFile(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#888",
                  fontSize: 20,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <EditorInstance
                file={{ ...requestingChangeForFile, content: proposedContent }}
                currentUser={{ ...state.currentUser, isOrganiser: true }}
                roleEngine={state.roleEngine}
                lockManager={lockManager}
                onChange={(_, content) => setProposedContent(content)}
                onFocus={() => {}}
                onBlur={() => {}}
              />
            </div>
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #333",
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
              }}
            >
              <button
                onClick={() => setRequestingChangeForFile(null)}
                style={{
                  background: "none",
                  border: "1px solid #333",
                  borderRadius: 6,
                  color: "#888",
                  fontSize: 13,
                  padding: "8px 20px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleChangeRequest}
                style={{
                  background: "rgba(139,92,246,0.15)",
                  border: "1px solid #8b5cf6",
                  borderRadius: 6,
                  color: "#8b5cf6",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "8px 20px",
                  cursor: "pointer",
                }}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New file/folder modal */}
      {newFileModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#1e1e1e",
              border: "1px solid #333",
              borderRadius: 12,
              width: 420,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>
              {newFileModal.type === "file" ? "📄 New File" : "📁 New Folder"}
            </div>

            {/* Name input */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#555",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Name
              </div>
              <input
                autoFocus
                value={newFileModal.name}
                onChange={(e) =>
                  setNewFileModal((prev) =>
                    prev ? { ...prev, name: e.target.value } : null,
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateNewItem();
                  if (e.key === "Escape") setNewFileModal(null);
                }}
                placeholder={
                  newFileModal.type === "file"
                    ? "e.g. analysis.py"
                    : "e.g. experiments"
                }
                style={{
                  width: "100%",
                  background: "#1a1a1a",
                  border: "1px solid #444",
                  borderRadius: 8,
                  padding: "10px 14px",
                  color: "#fff",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#3b82f6";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#444";
                }}
              />
            </div>

            {/* Folder picker — only for files */}
            {newFileModal.type === "file" && folders.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#555",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Location
                </div>
                <select
                  value={newFileModal.folderId ?? ""}
                  onChange={(e) =>
                    setNewFileModal((prev) =>
                      prev
                        ? { ...prev, folderId: e.target.value || null }
                        : null,
                    )
                  }
                  style={{
                    width: "100%",
                    background: "#1a1a1a",
                    border: "1px solid #444",
                    borderRadius: 8,
                    padding: "10px 14px",
                    color: "#fff",
                    fontSize: 13,
                    outline: "none",
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="" style={{ background: "#1e1e1e" }}>
                    📁 Root (no folder)
                  </option>
                  {folders.map((folder) => (
                    <option
                      key={folder.id}
                      value={folder.id}
                      style={{ background: "#1e1e1e" }}
                    >
                      📂 {folder.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Upload from disk option */}
            <div
              style={{
                borderTop: "1px solid #2a2a2a",
                paddingTop: 16,
                display: "flex",
                flexDirection: "column",
                gap: 8,
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
                Or upload from disk
              </div>

              {newFileModal.type === "file" ? (
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "8px 16px",
                    background: "rgba(59,130,246,0.08)",
                    border: "1px solid #3b82f630",
                    borderRadius: 8,
                    color: "#3b82f6",
                    fontSize: 13,
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  📄 Choose File
                  <input
                    type="file"
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const fileList = e.target.files;
                      if (!fileList) return;
                      Array.from(fileList).forEach((f) => {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const content = ev.target?.result as string;
                          const file: FileState = {
                            id: uuidv4(),
                            name: f.name,
                            content,
                            language: "plaintext",
                            lockedBy: null,
                            folderId: newFileModal.folderId,
                          };
                          socketClient.sendFileAdd(file);
                        };
                        reader.readAsText(f);
                      });
                      setNewFileModal(null);
                    }}
                  />
                </label>
              ) : (
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "8px 16px",
                    background: "rgba(59,130,246,0.08)",
                    border: "1px solid #3b82f630",
                    borderRadius: 8,
                    color: "#3b82f6",
                    fontSize: 13,
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  📂 Choose Folder
                  <input
                    type="file"
                    multiple
                    // @ts-expect-error webkitdirectory not in types
                    webkitdirectory=""
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const fileList = e.target.files;
                      if (!fileList || fileList.length === 0) return;

                      const folderName =
                        (
                          fileList[0] as File & { webkitRelativePath?: string }
                        ).webkitRelativePath?.split("/")[0] ??
                        "uploaded-folder";

                      const newFolder: FolderState = {
                        id: uuidv4(),
                        name: folderName,
                        parentId: null,
                      };
                      socketClient.sendFolderAdd(newFolder);

                      Array.from(fileList).forEach((f) => {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const content = ev.target?.result as string;
                          const parts = (
                            f as File & { webkitRelativePath?: string }
                          ).webkitRelativePath?.split("/") ?? [f.name];
                          const fileName = parts[parts.length - 1];

                          const file: FileState = {
                            id: uuidv4(),
                            name: fileName,
                            content,
                            language: "plaintext",
                            lockedBy: null,
                            folderId: newFolder.id,
                          };
                          socketClient.sendFileAdd(file);
                        };
                        reader.readAsText(f);
                      });
                      setNewFileModal(null);
                    }}
                  />
                </label>
              )}
            </div>

            {/* Actions */}
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => setNewFileModal(null)}
                style={{
                  background: "none",
                  border: "1px solid #333",
                  borderRadius: 6,
                  color: "#888",
                  fontSize: 13,
                  padding: "8px 16px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewItem}
                disabled={!newFileModal.name.trim()}
                style={{
                  background: newFileModal.name.trim() ? "#3b82f6" : "#1a1a1a",
                  border: "none",
                  borderRadius: 6,
                  color: newFileModal.name.trim() ? "#fff" : "#444",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "8px 16px",
                  cursor: newFileModal.name.trim() ? "pointer" : "default",
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          zIndex: 200,
        }}
      >
        {toasts.map((toast) => {
          if (toast.type === "request") {
            const cr = toast.data as ChangeRequest;
            return (
              <ChangeRequestToast
                key={toast.id}
                changeRequest={cr}
                requesterName={state.getUserName(cr.requesterId)}
                onReview={(cr) => {
                  setReviewingRequest(cr);
                  dismissToast(toast.id);
                }}
                onDismiss={() => dismissToast(toast.id)}
              />
            );
          }
          const alertData = toast.data as {
            notification: Notification;
            id: string;
          };
          return (
            <ChangeAlertToast
              key={toast.id}
              notification={alertData.notification}
              onDismiss={() => dismissToast(toast.id)}
            />
          );
        })}
      </div>
    </div>
  );
};
