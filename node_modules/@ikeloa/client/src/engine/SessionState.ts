import type {
  Session,
  User,
  Role,
  FileState,
  FolderState,
  ChangeRequest,
  Notification,
} from "../../../shared/types";
import { RoleEngine } from "./RoleEngine";
import { PermissionResolver } from "./PermissionResolver";

// This is the single source of truth for all client-side state
// Everything the UI reads comes from here
export class SessionState {
  public session: Session | null = null;
  public currentUser: User | null = null;
  public activeFileId: string | null = null;
  public notifications: Notification[] = [];
  public roleEngine: RoleEngine = new RoleEngine();
  public permissionResolver: PermissionResolver = new PermissionResolver(
    this.roleEngine,
  );

  // Called once when join_ack is received from server
  initialize(session: Session, userId: string): void {
    this.session = session;
    this.currentUser = session.users[userId];
    this.roleEngine.setRoles(session.roles);
  }

  // --- User ---

  addUser(user: User): void {
    if (!this.session) return;
    this.session.users[user.id] = user;
  }

  removeUser(userId: string): void {
    if (!this.session) return;
    delete this.session.users[userId];
  }

  updateUserRole(userId: string, roleId: string): void {
    if (!this.session) return;
    const user = this.session.users[userId];
    if (!user) return;
    user.roleId = roleId;
    // if it's the current user update that reference too
    if (this.currentUser?.id === userId) {
      this.currentUser.roleId = roleId;
    }
  }

  // --- Roles ---

  addRole(role: Role): void {
    if (!this.session) return;
    this.session.roles[role.id] = role;
    this.roleEngine.addRole(role);
  }

  updateRole(role: Role): void {
    if (!this.session) return;
    this.session.roles[role.id] = role;
    this.roleEngine.updateRole(role);
  }

  deleteRole(roleId: string): void {
    if (!this.session) return;
    delete this.session.roles[roleId];
    this.roleEngine.deleteRole(roleId);
  }

  // --- Folders ---

  addFolder(folder: FolderState): void {
    if (!this.session) return;
    this.session.folders[folder.id] = folder;
  }

  deleteFolder(folderId: string): void {
    if (!this.session) return;
    delete this.session.folders[folderId];
    Object.values(this.session.files).forEach((file) => {
      if (file.folderId === folderId) file.folderId = null;
    });
  }

  // --- File add/delete ---

  addFile(file: FileState): void {
    if (!this.session) return;
    this.session.files[file.id] = file;
  }

  deleteFile(fileId: string): void {
    if (!this.session) return;
    delete this.session.files[fileId];
  }

  // --- Files ---

  updateFileContent(fileId: string, content: string): void {
    if (!this.session) return;
    const file = this.session.files[fileId];
    if (file) file.content = content;
  }

  lockFile(
    fileId: string,
    lockedBy: string | null,
    lockedByName: string | null,
  ): void {
    if (!this.session) return;
    const file = this.session.files[fileId];
    if (!file) return;
    file.lockedBy = lockedBy;
    // store the name alongside for display purposes
    (file as FileState & { lockedByName?: string | null }).lockedByName =
      lockedByName;
  }

  getActiveFile(): FileState | null {
    if (!this.session || !this.activeFileId) return null;
    return this.session.files[this.activeFileId] ?? null;
  }

  setActiveFile(fileId: string): void {
    this.activeFileId = fileId;
  }

  getVisibleFiles(): FileState[] {
    if (!this.session || !this.currentUser) return [];
    return Object.values(this.session.files).filter((file) => {
      return !this.roleEngine.isHidden(this.currentUser!, file.id);
    });
  }
  getFolders(): FolderState[] {
    if (!this.session) return [];
    return Object.values(this.session.folders);
  }

  // --- Change Requests ---

  addChangeRequest(changeRequest: ChangeRequest): void {
    if (!this.session) return;
    this.session.changeRequests[changeRequest.id] = changeRequest;
  }

  resolveChangeRequest(
    changeRequestId: string,
    status: "approved" | "rejected",
    updatedContent?: string,
    fileId?: string,
  ): void {
    if (!this.session) return;
    const cr = this.session.changeRequests[changeRequestId];
    if (cr) cr.status = status;
    // if approved update the file content
    if (status === "approved" && updatedContent && fileId) {
      this.updateFileContent(fileId, updatedContent);
    }
  }

  getPendingChangeRequests(): ChangeRequest[] {
    if (!this.session) return [];
    return Object.values(this.session.changeRequests).filter(
      (cr) => cr.status === "pending",
    );
  }

  // --- Notifications ---

  addNotification(notification: Notification): void {
    this.notifications = [notification, ...this.notifications];
  }

  markAllRead(): void {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  // --- Helpers ---

  isOrganiser(): boolean {
    return this.currentUser?.isOrganiser ?? false;
  }

  getSessionId(): string {
    return this.session?.id ?? "";
  }

  getUserName(userId: string): string {
    return this.session?.users[userId]?.name ?? "Unknown";
  }

  getRoleName(roleId: string): string {
    return this.session?.roles[roleId]?.name ?? "No Role";
  }
}
