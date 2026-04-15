import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { SessionManager } from "./session/SessionManager";
import { handleJoin } from "./handlers/handleJoin";
import { handleFileChange } from "./handlers/handleFileChange";
import { handleFileLock } from "./handlers/handleFileLock";
import { handleRoleUpdate } from "./handlers/handleRoleUpdate";
import { handleChangeRequest } from "./handlers/handleChangeRequest";
import { handleFileSystem } from "./handlers/handleFileSystem";
import { generateId } from "./utils/idGenerator";
import { WSMessage } from "../../shared/types";

const PORT = 8080;

const httpServer = createServer((req, res) => {
  // Basic health check endpoint
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server: httpServer });
const sessionManager = new SessionManager();

wss.on("connection", (ws: WebSocket) => {
  // Assign a temporary id to this connection
  // It gets replaced with the real userId after join
  const connectionId = generateId();
  console.log(`[Server] New connection: ${connectionId}`);

  ws.on("message", (raw: Buffer) => {
    let message: WSMessage;

    try {
      message = JSON.parse(raw.toString()) as WSMessage;
    } catch (e) {
      console.error("[Server] Failed to parse message:", e);
      return;
    }

    console.log(
      `[Server] Message received: ${message.type} from ${message.senderId}`,
    );

    switch (message.type) {
      case "join":
        handleJoin(ws, message, sessionManager);
        break;

      case "file_change":
        handleFileChange(message, sessionManager);
        break;

      case "file_lock":
      case "file_unlock":
        handleFileLock(message, sessionManager);
        break;

      case "role_create":
      case "role_update":
      case "role_delete":
      case "user_role_assign":
        handleRoleUpdate(message, sessionManager);
        break;

      case "change_request_create":
      case "change_request_resolve":
        handleChangeRequest(message, sessionManager);
        break;

      case "file_add":
      case "file_delete":
      case "folder_add":
      case "folder_delete":
        handleFileSystem(message, sessionManager);
        break;

      default:
        console.warn(`[Server] Unknown message type: ${message.type}`);
    }
  });

  ws.on("close", () => {
    console.log(`[Server] Connection closed: ${connectionId}`);

    // Find which session and user this connection belonged to
    // and clean up
    // We iterate all sessions to find the disconnected user
    // In production you'd maintain a reverse map — good enough for now
  });

  ws.on("error", (err) => {
    console.error(`[Server] WebSocket error:`, err);
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`[Server] Ikeloa server running on ws://localhost:${PORT}`);
  console.log(`[Server] Health check: http://localhost:${PORT}/health`);
});
