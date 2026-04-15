import { v4 as uuidv4 } from "uuid";
import type {
  WSMessage,
  MessageType,
  JoinPayload,
  FileChangePayload,
  FileLockPayload,
  RoleCreatePayload,
  RoleUpdatePayload,
  RoleDeletePayload,
  UserRoleAssignPayload,
  ChangeRequestCreatePayload,
  ChangeRequestResolvePayload,
  FileState,
  FolderState,
  FileAddPayload,
  FileDeletePayload,
  FolderAddPayload,
  FolderDeletePayload,
} from "../../../shared/types";

type MessageHandler = (message: WSMessage) => void;

export class SocketClient {
  private ws: WebSocket | null = null;
  private userId: string;
  private sessionId: string = "";
  private handlers: Map<MessageType, MessageHandler[]> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private url: string;

  constructor() {
    this.userId = uuidv4();
    this.url = "ws://localhost:8080";
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
      } catch (err) {
        reject(err);
        return;
      }

      let resolved = false;

      this.ws.onopen = () => {
        console.log("[SocketClient] Connected");
        this.reconnectAttempts = 0;
        resolved = true;
        resolve();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data as string) as WSMessage;
          this.dispatch(message);
        } catch (e) {
          console.error("[SocketClient] Failed to parse message:", e);
        }
      };

      this.ws.onclose = () => {
        console.log("[SocketClient] Disconnected");
      };

      this.ws.onerror = (err) => {
        console.error("[SocketClient] WebSocket error:", err);
        if (!resolved) {
          reject(err);
        }
      };
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[SocketClient] Max reconnect attempts reached");
      return;
    }
    this.reconnectAttempts++;
    const delay = 1000 * this.reconnectAttempts;
    console.log(
      `[SocketClient] Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`,
    );
    setTimeout(() => this.connect(), delay);
  }

  private dispatch(message: WSMessage): void {
    const handlers = this.handlers.get(message.type) ?? [];
    handlers.forEach((handler) => handler(message));
  }

  on(type: MessageType, handler: MessageHandler): void {
    const existing = this.handlers.get(type) ?? [];
    this.handlers.set(type, [...existing, handler]);
  }

  off(type: MessageType, handler: MessageHandler): void {
    const existing = this.handlers.get(type) ?? [];
    this.handlers.set(
      type,
      existing.filter((h) => h !== handler),
    );
  }

  private send(type: MessageType, payload: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("[SocketClient] Cannot send — not connected");
      return;
    }

    const message: WSMessage = {
      type,
      payload,
      senderId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
    };

    this.ws.send(JSON.stringify(message));
  }

  // --- Public send methods — one per action ---

  joinAsOrganiser(
    userName: string,
    initialFiles: JoinPayload["initialFiles"],
    initialFolders?: FolderState[],
  ): void {
    const payload: JoinPayload = {
      sessionId: "",
      userName,
      asOrganiser: true,
      initialFiles,
      initialFolders,
    };
    this.send("join", payload);
  }

  joinAsCollaborator(sessionId: string, userName: string): void {
    this.sessionId = sessionId;
    const payload: JoinPayload = {
      sessionId,
      userName,
      asOrganiser: false,
    };
    this.send("join", payload);
  }

  sendFileChange(fileId: string, content: string): void {
    const payload: FileChangePayload = { fileId, content };
    this.send("file_change", payload);
  }

  sendFileLock(fileId: string): void {
    const payload: FileLockPayload = {
      fileId,
      lockedBy: this.userId,
      lockedByName: null,
    };
    this.send("file_lock", payload);
  }

  sendFileUnlock(fileId: string): void {
    const payload: FileLockPayload = {
      fileId,
      lockedBy: null,
      lockedByName: null,
    };
    this.send("file_unlock", payload);
  }

  sendRoleCreate(payload: RoleCreatePayload): void {
    this.send("role_create", payload);
  }

  sendRoleUpdate(payload: RoleUpdatePayload): void {
    this.send("role_update", payload);
  }

  sendRoleDelete(payload: RoleDeletePayload): void {
    this.send("role_delete", payload);
  }

  sendUserRoleAssign(payload: UserRoleAssignPayload): void {
    this.send("user_role_assign", payload);
  }

  sendChangeRequest(payload: ChangeRequestCreatePayload): void {
    this.send("change_request_create", payload);
  }

  sendChangeRequestResolve(payload: ChangeRequestResolvePayload): void {
    this.send("change_request_resolve", payload);
  }

  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  getUserId(): string {
    return this.userId;
  }
  sendFileAdd(file: FileState): void {
    const payload: FileAddPayload = { file };
    this.send("file_add", payload);
  }

  sendFileDelete(fileId: string): void {
    const payload: FileDeletePayload = { fileId };
    this.send("file_delete", payload);
  }

  sendFolderAdd(folder: FolderState): void {
    const payload: FolderAddPayload = { folder };
    this.send("folder_add", payload);
  }

  sendFolderDelete(folderId: string): void {
    const payload: FolderDeletePayload = { folderId };
    this.send("folder_delete", payload);
  }

  disconnect(): void {
    this.ws?.close();
  }
}

// Singleton — one socket client for the entire app
export const socketClient = new SocketClient();
