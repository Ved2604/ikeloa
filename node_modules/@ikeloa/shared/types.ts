export type PermissionLevel = "edit" | "read" | "hidden";

export interface Role {
  id: string;
  name: string;
  color: string;
  hierarchyLevel: number; // lower = higher authority. 1 = top dog, 10 = intern
  permissions: Record<string, PermissionLevel>; // fileId → permission
}

export interface User {
  id: string;
  name: string;
  roleId: string;
  isOrganiser: boolean;
}

export interface FileState {
  id: string;
  name: string;
  content: string;
  language: string;
  lockedBy: string | null;
  folderId: string | null;
}

export interface ChangeRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  fileId: string;
  fileName: string;
  proposedContent: string;
  originalContent: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: number;
}

export interface Session {
  id: string;
  organiserId: string;
  users: Record<string, User>;
  roles: Record<string, Role>;
  files: Record<string, FileState>;
  folders: Record<string, FolderState>;
  changeRequests: Record<string, ChangeRequest>;
}

export interface Notification {
  id: string;
  type:
    | "change_alert"
    | "change_request"
    | "request_resolved"
    | "lock_override"
    | "info";
  title: string;
  message: string;
  fileId?: string;
  changeRequestId?: string;
  timestamp: number;
  read: boolean;
}

export interface FolderState {
  id: string;
  name: string;
  parentId: string | null;
}

// WebSocket message protocol
export type MessageType =
  | "join"
  | "join_ack"
  | "user_joined"
  | "user_left"
  | "file_change"
  | "file_lock"
  | "file_unlock"
  | "role_create"
  | "role_update"
  | "role_delete"
  | "user_role_assign"
  | "change_request_create"
  | "change_request_resolve"
  | "notification"
  | "error"
  | "file_add"
  | "file_delete"
  | "folder_add"
  | "folder_delete";

export interface WSMessage {
  type: MessageType;
  payload: unknown;
  senderId: string;
  sessionId: string;
  timestamp: number;
}

// Payload types for each message
export interface JoinPayload {
  sessionId: string;
  userName: string;
  asOrganiser: boolean;
  // if organiser, they send initial files
  initialFiles?: FileState[];
  initialFolders?: FolderState[];
}

export interface JoinAckPayload {
  userId: string;
  session: Session;
}

export interface FileChangePayload {
  fileId: string;
  content: string;
}

export interface FileLockPayload {
  fileId: string;
  lockedBy: string | null;
  lockedByName: string | null;
}

export interface RoleCreatePayload {
  role: Role;
}

export interface RoleUpdatePayload {
  role: Role;
}

export interface RoleDeletePayload {
  roleId: string;
}

export interface UserRoleAssignPayload {
  userId: string;
  roleId: string;
}

export interface ChangeRequestCreatePayload {
  changeRequest: ChangeRequest;
}

export interface ChangeRequestResolvePayload {
  changeRequestId: string;
  status: "approved" | "rejected";
  rejectionReason?: string;
}

export interface NotificationPayload {
  notification: Notification;
}

export interface ErrorPayload {
  message: string;
}

export interface FileAddPayload {
  file: FileState;
}

export interface FileDeletePayload {
  fileId: string;
}

export interface FolderAddPayload {
  folder: FolderState;
}

export interface FolderDeletePayload {
  folderId: string;
}
