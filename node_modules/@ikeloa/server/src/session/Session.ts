import { WebSocket } from "ws";
import {
  Session,
  User,
  Role,
  FileState,
  FolderState,
  ChangeRequest,
  WSMessage,
  Notification,
} from "../../../shared/types";

export class SessionInstance {
  public data: Session;
  private connections: Map<string, WebSocket> = new Map();

  constructor(
    sessionId: string,
    organiserId: string,
    initialFiles: FileState[],
    initialFolders: FolderState[] = [],
  ) {
    this.data = {
      id: sessionId,
      organiserId,
      users: {},
      roles: {},
      files: Object.fromEntries(initialFiles.map((f) => [f.id, f])),
      folders: Object.fromEntries(initialFolders.map((f) => [f.id, f])), // start with no folders
      changeRequests: {},
    };
  }

  // --- Connection management ---

  addConnection(userId: string, ws: WebSocket): void {
    this.connections.set(userId, ws);
  }

  removeConnection(userId: string): void {
    this.connections.delete(userId);
  }

  isConnected(userId: string): boolean {
    return this.connections.has(userId);
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  // --- User management ---

  addUser(user: User): void {
    this.data.users[user.id] = user;
  }

  removeUser(userId: string): void {
    delete this.data.users[userId];
    // unlock any files this user had locked
    Object.values(this.data.files).forEach((file) => {
      if (file.lockedBy === userId) {
        file.lockedBy = null;
      }
    });
  }

  getUser(userId: string): User | undefined {
    return this.data.users[userId];
  }

  // --- Role management ---

  addRole(role: Role): void {
    this.data.roles[role.id] = role;
  }

  updateRole(role: Role): void {
    this.data.roles[role.id] = role;
  }

  deleteRole(roleId: string): void {
    delete this.data.roles[roleId];
    // unassign any users who had this role
    Object.values(this.data.users).forEach((user) => {
      if (user.roleId === roleId) {
        user.roleId = "";
      }
    });
  }

  // --- File management ---

  updateFileContent(fileId: string, content: string): void {
    if (this.data.files[fileId]) {
      this.data.files[fileId].content = content;
    }
  }
  // --- Folder management ---

  addFolder(folder: FolderState): void {
    this.data.folders[folder.id] = folder;
  }

  deleteFolder(folderId: string): void {
    delete this.data.folders[folderId];
    // Move files in this folder to root
    Object.values(this.data.files).forEach((file) => {
      if (file.folderId === folderId) {
        file.folderId = null;
      }
    });
  }

  // --- File add/delete ---

  addFile(file: FileState): void {
    this.data.files[file.id] = file;
  }

  deleteFile(fileId: string): void {
    delete this.data.files[fileId];
  }

  lockFile(fileId: string, userId: string): boolean {
    const file = this.data.files[fileId];
    if (!file) return false;
    if (file.lockedBy && file.lockedBy !== userId) return false; // already locked by someone else
    file.lockedBy = userId;
    return true;
  }

  unlockFile(fileId: string, userId: string): void {
    const file = this.data.files[fileId];
    if (file && file.lockedBy === userId) {
      file.lockedBy = null;
    }
  }

  // --- Change requests ---

  addChangeRequest(changeRequest: ChangeRequest): void {
    this.data.changeRequests[changeRequest.id] = changeRequest;
  }

  resolveChangeRequest(
    changeRequestId: string,
    status: "approved" | "rejected",
    rejectionReason?: string,
  ): ChangeRequest | null {
    const cr = this.data.changeRequests[changeRequestId];
    if (!cr) return null;
    cr.status = status;
    if (rejectionReason) cr.rejectionReason = rejectionReason;
    // if approved, apply the proposed content to the file
    if (status === "approved") {
      this.updateFileContent(cr.fileId, cr.proposedContent);
    }
    return cr;
  }

  // --- Broadcasting ---

  broadcast(message: WSMessage, excludeUserId?: string): void {
    this.connections.forEach((ws, userId) => {
      if (userId !== excludeUserId && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  sendTo(userId: string, message: WSMessage): void {
    const ws = this.connections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Send to all users whose role has edit permission on a file
  // Used to notify file owners when a junior makes a change
  notifyFileOwners(
    fileId: string,
    message: WSMessage,
    excludeUserId: string,
  ): void {
    Object.values(this.data.users).forEach((user) => {
      if (user.id === excludeUserId) return;
      if (user.isOrganiser) {
        this.sendTo(user.id, message);
        return;
      }
      const role = this.data.roles[user.roleId];
      if (!role) return;
      const permission = role.permissions[fileId];
      if (permission === "edit") {
        this.sendTo(user.id, message);
      }
    });
  }

  // Send notification to all users who outrank the given role
  notifySeniors(
    senderRoleLevel: number,
    message: WSMessage,
    excludeUserId: string,
  ): void {
    Object.values(this.data.users).forEach((user) => {
      if (user.id === excludeUserId) return;
      if (user.isOrganiser) {
        this.sendTo(user.id, message);
        return;
      }
      const role = this.data.roles[user.roleId];
      if (!role) return;
      // lower hierarchyLevel = higher authority
      if (role.hierarchyLevel < senderRoleLevel) {
        this.sendTo(user.id, message);
      }
    });
  }
}
