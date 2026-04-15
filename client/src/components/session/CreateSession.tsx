import { useState, useRef } from "react";
import type { FileState, FolderState } from "../../../../shared/types";
import { v4 as uuidv4 } from "uuid";

interface CreateSessionProps {
  onCreate: (
    userName: string,
    files: FileState[],
    folders: FolderState[],
  ) => void;
}

const detectLanguage = (fileName: string): string => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    json: "json",
    md: "markdown",
    css: "css",
    html: "html",
    yaml: "yaml",
    yml: "yaml",
    sh: "shell",
    env: "plaintext",
    txt: "plaintext",
  };
  return map[ext ?? ""] ?? "plaintext";
};

export const CreateSession = ({ onCreate }: CreateSessionProps) => {
  const [userName, setUserName] = useState("");
  const [files, setFiles] = useState<FileState[]>([]);
  const [folders, setFolders] = useState<FolderState[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const processFileList = (fileList: FileList) => {
    const newFolders: FolderState[] = [];
    const newFiles: FileState[] = [];
    const folderMap = new Map<string, string>(); // path -> folderId

    Array.from(fileList).forEach((file) => {
      const relativePath =
        (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
        file.name;
      const parts = relativePath.split("/");

      if (parts.length > 1) {
        // File is inside a folder
        const folderName = parts[0];
        if (!folderMap.has(folderName)) {
          const folderId = uuidv4();
          folderMap.set(folderName, folderId);
          newFolders.push({
            id: folderId,
            name: folderName,
            parentId: null,
          });
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          newFiles.push({
            id: uuidv4(),
            name: parts[parts.length - 1],
            content,
            language: detectLanguage(file.name),
            lockedBy: null,
            folderId: folderMap.get(folderName) ?? null,
          });
          if (
            newFiles.length === fileList.length ||
            newFiles.length + files.length === fileList.length
          ) {
            setFolders((prev) => [
              ...prev,
              ...newFolders.filter(
                (nf) => !prev.find((f) => f.name === nf.name),
              ),
            ]);
            setFiles((prev) => [...prev, ...newFiles]);
          }
        };
        reader.readAsText(file);
      } else {
        // Root level file
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setFiles((prev) => [
            ...prev,
            {
              id: uuidv4(),
              name: file.name,
              content,
              language: detectLanguage(file.name),
              lockedBy: null,
              folderId: null,
            },
          ]);
        };
        reader.readAsText(file);
      }
    });
  };

  const handleFileUpload = (uploadedFiles: FileList | null) => {
    if (!uploadedFiles) return;
    processFileList(uploadedFiles);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleRemoveFolder = (folderId: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setFiles((prev) => prev.filter((f) => f.folderId !== folderId));
  };

  const handleCreate = () => {
    if (!userName.trim()) return;
    onCreate(userName.trim(), files, folders);
  };

  const folderFiles = (folderId: string) =>
    files.filter((f) => f.folderId === folderId);

  const rootFiles = files.filter((f) => !f.folderId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#555",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Your Name
        </div>
        <input
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="e.g. Dr. Sarah Chen"
          style={{
            width: "100%",
            background: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: 8,
            padding: "10px 14px",
            color: "#fff",
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#3b82f6";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#333";
          }}
        />
      </div>

      {/* Upload area */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#555",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Upload Files or Folder
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? "#3b82f6" : "#333"}`,
            borderRadius: 8,
            padding: "24px",
            textAlign: "center",
            cursor: "pointer",
            background: isDragging ? "rgba(59,130,246,0.05)" : "transparent",
            transition: "all 0.15s",
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
          <div style={{ color: "#888", fontSize: 13 }}>
            Drop files here or click to browse
          </div>
          <div style={{ color: "#555", fontSize: 11, marginTop: 4 }}>
            Supports individual files or entire folders
          </div>
        </div>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleFileUpload(e.target.files)}
        />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          // @ts-expect-error webkitdirectory is not in types
          webkitdirectory=""
          style={{ display: "none" }}
          onChange={(e) => handleFileUpload(e.target.files)}
        />

        {/* Folder upload button */}
        <button
          onClick={() => folderInputRef.current?.click()}
          style={{
            marginTop: 8,
            width: "100%",
            background: "none",
            border: "1px solid #333",
            borderRadius: 8,
            color: "#666",
            fontSize: 13,
            padding: "8px",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#555";
            (e.currentTarget as HTMLButtonElement).style.color = "#999";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#333";
            (e.currentTarget as HTMLButtonElement).style.color = "#666";
          }}
        >
          📂 Upload Folder
        </button>
      </div>

      {/* Preview */}
      {(folders.length > 0 || rootFiles.length > 0) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {/* Folders */}
          {folders.map((folder) => (
            <div key={folder.id}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  background: "#252526",
                  borderRadius: 6,
                  border: "1px solid #2a2a2a",
                }}
              >
                <span style={{ fontSize: 14 }}>📁</span>
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: "#ddd",
                    fontWeight: 500,
                  }}
                >
                  {folder.name}
                </span>
                <span style={{ fontSize: 11, color: "#555" }}>
                  {folderFiles(folder.id).length} files
                </span>
                <button
                  onClick={() => handleRemoveFolder(folder.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#444",
                    cursor: "pointer",
                    fontSize: 14,
                    padding: "0 4px",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "#444";
                  }}
                >
                  ✕
                </button>
              </div>
              {folderFiles(folder.id).map((file) => (
                <div
                  key={file.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 12px 6px 28px",
                    background: "#1e1e1e",
                    borderLeft: "1px solid #2a2a2a",
                    borderRight: "1px solid #2a2a2a",
                    borderBottom: "1px solid #2a2a2a",
                  }}
                >
                  <span style={{ fontSize: 12 }}>📄</span>
                  <span style={{ flex: 1, fontSize: 12, color: "#888" }}>
                    {file.name}
                  </span>
                  <button
                    onClick={() => handleRemoveFile(file.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#444",
                      cursor: "pointer",
                      fontSize: 12,
                      padding: "0 4px",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "#ef4444";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "#444";
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ))}

          {/* Root files */}
          {rootFiles.map((file) => (
            <div
              key={file.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                background: "#252526",
                borderRadius: 6,
                border: "1px solid #2a2a2a",
              }}
            >
              <span style={{ fontSize: 14 }}>📄</span>
              <span style={{ flex: 1, fontSize: 13, color: "#ddd" }}>
                {file.name}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "#555",
                  background: "#1a1a1a",
                  borderRadius: 4,
                  padding: "2px 6px",
                }}
              >
                {file.language}
              </span>
              <button
                onClick={() => handleRemoveFile(file.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#444",
                  cursor: "pointer",
                  fontSize: 14,
                  padding: "0 4px",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#ef4444";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#444";
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create button */}
      <button
        onClick={handleCreate}
        disabled={!userName.trim()}
        style={{
          background: userName.trim() ? "#3b82f6" : "#1a1a1a",
          border: "none",
          borderRadius: 8,
          color: userName.trim() ? "#fff" : "#444",
          fontSize: 14,
          fontWeight: 600,
          padding: "12px",
          cursor: userName.trim() ? "pointer" : "default",
          transition: "all 0.15s",
        }}
      >
        Create Session
      </button>
    </div>
  );
};
