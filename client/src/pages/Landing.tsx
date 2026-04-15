import { useState } from "react";
import { CreateSession } from "../components/session/CreateSession";
import { JoinSession } from "../components/session/JoinSession";
import type { FileState, FolderState } from "../../../shared/types";

interface LandingProps {
  onCreateSession: (
    userName: string,
    files: FileState[],
    folders: FolderState[],
  ) => void;
  onJoinSession: (sessionId: string, userName: string) => void;
}

type Tab = "create" | "join";

export const Landing = ({ onCreateSession, onJoinSession }: LandingProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("create");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
        }}
      >
        {/* Logo and title */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              fontSize: 48,
              marginBottom: 12,
            }}
          >
            🔬
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.02em",
            }}
          >
            Ikeloa
          </div>
          <div
            style={{
              fontSize: 14,
              color: "#555",
              marginTop: 6,
            }}
          >
            Role-based collaborative code editing for research teams
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #2a2a2a",
            }}
          >
            {(["create", "join"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: "14px",
                  background: "none",
                  border: "none",
                  borderBottom:
                    activeTab === tab
                      ? "2px solid #3b82f6"
                      : "2px solid transparent",
                  color: activeTab === tab ? "#fff" : "#555",
                  fontSize: 14,
                  fontWeight: activeTab === tab ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textTransform: "capitalize",
                }}
              >
                {tab === "create" ? "+ Create Session" : "→ Join Session"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: 24 }}>
            {activeTab === "create" ? (
              <CreateSession onCreate={onCreateSession} />
            ) : (
              <JoinSession onJoin={onJoinSession} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: 24,
            fontSize: 12,
            color: "#333",
          }}
        >
          Built for scientific research teams
        </div>
      </div>
    </div>
  );
};
