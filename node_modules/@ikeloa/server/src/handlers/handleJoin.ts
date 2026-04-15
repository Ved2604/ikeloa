import { WebSocket } from "ws";
import { SessionManager } from "../session/SessionManager";
import { SessionInstance } from "../session/Session";
import { generateId } from "../utils/idGenerator";
import {
  WSMessage,
  JoinPayload,
  JoinAckPayload,
  User,
} from "../../../shared/types";

export const handleJoin = (
  ws: WebSocket,
  message: WSMessage,
  sessionManager: SessionManager,
): void => {
  const payload = message.payload as JoinPayload;
  const { sessionId, userName, asOrganiser, initialFiles, initialFolders } =
    payload;

  let session: SessionInstance | undefined;

  if (asOrganiser) {
    // Organiser creates a new session
    const files = initialFiles ?? [];
    const folders = payload.initialFolders ?? [];
    session = sessionManager.create(message.senderId, files, folders);
  } else {
    // Collaborator joins existing session
    session = sessionManager.get(sessionId);
    if (!session) {
      const errorMsg: WSMessage = {
        type: "error",
        payload: { message: `Session ${sessionId} not found` },
        senderId: "server",
        sessionId: "",
        timestamp: Date.now(),
      };
      ws.send(JSON.stringify(errorMsg));
      return;
    }
  }

  const userId = message.senderId;

  const user: User = {
    id: userId,
    name: userName,
    roleId: "",
    isOrganiser: asOrganiser,
  };

  session.addUser(user);
  session.addConnection(userId, ws);

  // Send full session state back to the joining user
  const ackPayload: JoinAckPayload = {
    userId,
    session: session.data,
  };

  const ackMessage: WSMessage = {
    type: "join_ack",
    payload: ackPayload,
    senderId: "server",
    sessionId: session.data.id,
    timestamp: Date.now(),
  };

  ws.send(JSON.stringify(ackMessage));

  // Notify everyone else that a new user joined
  const userJoinedMessage: WSMessage = {
    type: "user_joined",
    payload: { user },
    senderId: "server",
    sessionId: session.data.id,
    timestamp: Date.now(),
  };

  session.broadcast(userJoinedMessage, userId);

  console.log(`[handleJoin] ${userName} joined session ${session.data.id}`);
};
