import { useState } from "react";
import { Landing } from "./pages/Landing";
import { SessionPage } from "./pages/Session";
import type { FileState, FolderState } from "../../shared/types";

type AppState =
  | { screen: "landing" }
  | {
      screen: "session";
      mode: "create";
      userName: string;
      initialFiles: FileState[];
      initialFolders: FolderState[];
    }
  | { screen: "session"; mode: "join"; userName: string; sessionId: string };

export default function App() {
  const [appState, setAppState] = useState<AppState>({ screen: "landing" });

  const handleCreateSession = (
    userName: string,
    files: FileState[],
    folders: FolderState[],
  ) => {
    setAppState({
      screen: "session",
      mode: "create",
      userName,
      initialFiles: files,
      initialFolders: folders,
    });
  };

  const handleJoinSession = (sessionId: string, userName: string) => {
    setAppState({
      screen: "session",
      mode: "join",
      userName,
      sessionId,
    });
  };

  if (appState.screen === "landing") {
    return (
      <Landing
        onCreateSession={handleCreateSession}
        onJoinSession={handleJoinSession}
      />
    );
  }

  if (appState.mode === "create") {
    return (
      <SessionPage
        mode="create"
        userName={appState.userName}
        initialFiles={appState.initialFiles}
        initialFolders={appState.initialFolders}
      />
    );
  }

  return (
    <SessionPage
      mode="join"
      userName={appState.userName}
      sessionId={appState.sessionId}
    />
  );
}
