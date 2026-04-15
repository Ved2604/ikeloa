import { SessionInstance } from "./Session";
import { FileState, FolderState } from "../../../shared/types";
import { generateSessionCode } from "../utils/idGenerator";

export class SessionManager {
  private sessions: Map<string, SessionInstance> = new Map();

  create(
    organiserId: string,
    initialFiles: FileState[],
    initialFolders: FolderState[] = [],
  ): SessionInstance {
    const sessionId = generateSessionCode();
    const session = new SessionInstance(
      sessionId,
      organiserId,
      initialFiles,
      initialFolders,
    );
    this.sessions.set(sessionId, session);
    console.log(`[SessionManager] Created session: ${sessionId}`);
    return session;
  }

  get(sessionId: string): SessionInstance | undefined {
    return this.sessions.get(sessionId);
  }

  destroy(sessionId: string): void {
    this.sessions.delete(sessionId);
    console.log(`[SessionManager] Destroyed session: ${sessionId}`);
  }

  // Clean up empty sessions
  cleanup(sessionId: string): void {
    const session = this.get(sessionId);
    if (!session) return;
    if (session.getConnectionCount() === 0) {
      this.destroy(sessionId);
    }
  }

  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }
}
