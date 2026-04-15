import {
  WSMessage,
  FileAddPayload,
  FileDeletePayload,
  FolderAddPayload,
  FolderDeletePayload,
} from "../../../shared/types";
import { SessionManager } from "../session/SessionManager";

export const handleFileSystem = (
  message: WSMessage,
  sessionManager: SessionManager,
): void => {
  const session = sessionManager.get(message.sessionId);
  if (!session) return;

  const sender = session.getUser(message.senderId);
  if (!sender) return;

  // Only organiser can add or delete files and folders
  if (!sender.isOrganiser) {
    const errorMsg: WSMessage = {
      type: "error",
      payload: { message: "Only the organiser can manage files and folders" },
      senderId: "server",
      sessionId: message.sessionId,
      timestamp: Date.now(),
    };
    session.sendTo(message.senderId, errorMsg);
    return;
  }

  if (message.type === "file_add") {
    const payload = message.payload as FileAddPayload;
    session.addFile(payload.file);

    const broadcast: WSMessage = {
      type: "file_add",
      payload,
      senderId: "server",
      sessionId: message.sessionId,
      timestamp: Date.now(),
    };
    session.broadcast(broadcast);
    console.log(`[handleFileSystem] File added: ${payload.file.name}`);
  } else if (message.type === "file_delete") {
    const payload = message.payload as FileDeletePayload;
    const file = session.data.files[payload.fileId];
    session.deleteFile(payload.fileId);

    const broadcast: WSMessage = {
      type: "file_delete",
      payload,
      senderId: "server",
      sessionId: message.sessionId,
      timestamp: Date.now(),
    };
    session.broadcast(broadcast);
    console.log(
      `[handleFileSystem] File deleted: ${file?.name ?? payload.fileId}`,
    );
  } else if (message.type === "folder_add") {
    const payload = message.payload as FolderAddPayload;
    session.addFolder(payload.folder);

    const broadcast: WSMessage = {
      type: "folder_add",
      payload,
      senderId: "server",
      sessionId: message.sessionId,
      timestamp: Date.now(),
    };
    session.broadcast(broadcast);
    console.log(`[handleFileSystem] Folder added: ${payload.folder.name}`);
  } else if (message.type === "folder_delete") {
    const payload = message.payload as FolderDeletePayload;
    const folder = session.data.folders[payload.folderId];
    session.deleteFolder(payload.folderId);

    const broadcast: WSMessage = {
      type: "folder_delete",
      payload,
      senderId: "server",
      sessionId: message.sessionId,
      timestamp: Date.now(),
    };
    session.broadcast(broadcast);
    console.log(
      `[handleFileSystem] Folder deleted: ${folder?.name ?? payload.folderId}`,
    );
  }
};
