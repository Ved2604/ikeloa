# Ikeloa Hiring Assignment

A Monaco-based collaborative code editor built for research teams — where access control matters as much as collaboration.

---

## What is this

This Assignment is a browser-based collaborative code editor that lets research teams work on shared codebases with role-based access control. Unlike general-purpose collaborative editors, it is built around a core idea: **not everyone on a research team should have the same level of access to every file.**

A PI should own the experiment configuration. A postdoc should own their analysis scripts. A grad student should be able to propose changes to files above their permission level, but not edit them directly. Ikeloa enforces this — visually, in the editor, in real time.

---

## The Problem

Research teams collaborate on code differently from software teams. Scientists are not software engineers. They do not think in branches and pull requests. They think in experiments, configurations, and results.

Existing tools fail them in specific ways:

- **Git** is built around features and fixes. Its mental model does not map to experiment runs and parameter configurations. Most researchers end up on main with commit messages like "changes."
- **Google Docs / Notion** have no concept of code, syntax, or file ownership.
- **VS Code Live Share** gives everyone equal access. There is no hierarchy enforcement.
- **Jupyter Notebooks** are collaborative in theory but chaotic in practice — no structure, no ownership, version control is a nightmare.

This project is a focused solution to one specific slice of this problem: **give research teams a structured collaborative editor where roles define what you can see, edit, and propose.**

---

## Features

### Dynamic Role Engine

Roles are not hardcoded. The session organiser creates any roles they need — PI, Postdoc, Grad Student, Domain Expert, whatever fits the team. Roles have a hierarchy level (lower number = higher authority) that can be reordered at any time during a live session. Each role gets per-file permissions: edit, read, or hidden.

This is the core of the system. Everything else is built on top of it.

### File-Level Permissions via Right-Click

Right-click any file in the sidebar to set permissions per role inline. No separate settings panel. The permission is applied live — other users see their editor update in real time.

### Monaco Editor with Permission Enforcement

Files open as read-only or editable based on your role. Locked files show a visual decoration — amber border for readable, red for hidden. If another user is actively editing a file, you see a purple "X is editing" indicator and the file soft-locks until they are done.

### Change Request Flow

If your role can only read a file, you can propose changes. A Monaco diff editor opens showing original vs proposed. The file owner gets a real-time notification and can approve or reject with an optional reason. Approved changes apply immediately to everyone in the session.

### Real-Time Collaboration

Built on WebSockets. Changes sync as you type (debounced 300ms). File locks broadcast to all clients when someone starts editing. Role and permission changes propagate live — if the organiser changes your role mid-session, your editor updates without a refresh.

### Folder Support

Upload an entire folder from disk when creating a session. The folder structure is preserved in the sidebar. Mid-session, the organiser can create new folders, add files to specific folders, or upload additional files from disk. Folders are purely organisational — permissions are always set at the file level.

### Session Management

Sessions are created with a human-readable code (e.g. GAMMA-4521). Share the code, others join instantly. No accounts, no authentication, no setup required on the joining side.

### Download as Zip

Any user can download all files they have access to as a zip at any time, preserving folder structure. The zip reflects the current live state of the files.

---

## Architecture

The project is a TypeScript monorepo with three packages:

```
ikeloa/
├── shared/          # Shared types — the contract between client and server
├── server/          # Node.js WebSocket server
└── client/          # React + Monaco frontend
```

### Shared Types

Everything starts here. `shared/types.ts` defines the complete data model and WebSocket message protocol. Both the client and server import from this file. If a message type is not defined here, it does not exist in the system. This was a deliberate architectural decision — having a single source of truth for the protocol means type errors catch integration bugs at compile time, not at runtime.

### Server

A thin Node.js WebSocket server. Its only responsibilities are:

- Maintaining session state in memory
- Validating permissions on destructive operations (only the organiser can manage roles and files)
- Relaying the right messages to the right clients

The server is intentionally thin. It does not know what Monaco is. It knows sessions, users, roles, files, and messages. The `SessionInstance` class owns all state for a single session and handles broadcasting, file locking, and change request resolution.

### Client

A React application with four distinct layers:

```
client/src/
├── engine/        # Pure logic — RoleEngine, PermissionResolver, SessionState
├── socket/        # WebSocket client and message handlers
├── monaco/        # Editor integration — decorations, locks, diff view
└── components/    # UI layer — sidebar, panels, notifications, toasts
```

The engine layer has no React dependencies. `RoleEngine` and `PermissionResolver` are plain TypeScript classes that can be tested in isolation. The Monaco layer talks to the engine to decide how to render each file. The UI layer talks to both.

This separation was intentional. The role resolution logic is the most important and most testable part of the system — keeping it free of React and Monaco concerns means it can be reasoned about independently.

---

## The Role Engine

The role engine is the heart of Ikeloa. Here is how it works:

Every role has a `hierarchyLevel` — a number where lower means higher authority. When the organiser reorders roles using the ▲ ▼ buttons, the hierarchy levels swap. The engine exposes one core method:

```typescript
resolvePermission(user: User, fileId: string): PermissionLevel
// returns 'edit' | 'read' | 'hidden'
```

Everything else — Monaco read-only mode, sidebar visibility, the "Request Change" button, notification routing — is derived from this single call. Adding a new permission-gated feature anywhere in the app requires only asking `roleEngine.resolvePermission()`. Nothing else changes.

The hierarchy is also used to determine who gets notified when a file changes. When a user edits a file, the server calls `notifySeniors()` — sending a change alert to every user whose role outranks the editor's role. This means seniors are always aware of changes to files in their domain without needing to watch them manually.

---

## Design Decisions

### Why dynamic roles instead of fixed ones

The obvious design is to hardcode three roles — Admin, Editor, Viewer. I did not do this because every research team is structured differently. A genomics lab has a completely different hierarchy than a physics simulation team. Hardcoded roles would be wrong for at least half of the teams that use this. Dynamic roles means the tool adapts to the team, not the other way around.

### Why file locking instead of CRDTs

True real-time collaborative editing requires Conflict-free Replicated Data Types (CRDTs) or Operational Transforms — the algorithms that power Google Docs. Implementing this correctly is a significant distributed systems problem. I made a deliberate tradeoff: when a user starts editing a file, it soft-locks for others at the same or lower permission level. Others can see changes streaming in but cannot edit simultaneously.

This is actually a reasonable product decision for the target use case. Scientists working on shared experiment configs do not need two people editing the same file simultaneously. The locking model maps well to how research teams actually divide work.

### Why no database

Sessions are ephemeral by design. A research team opens a session, collaborates for a few hours, downloads the results, and closes it. Persisting session state to a database adds infrastructure complexity without adding a feature the user actually experiences. The tradeoff is that if the server restarts, sessions are lost — which is an acceptable limitation for this use case and stage of the product.

### Why folders are visual only

Folder-level permissions would require resolving permission inheritance — does a file inside a locked folder inherit the lock? What happens when a file-level permission conflicts with a folder-level one? These are solvable problems but they add significant complexity to the role engine. For this version, folders are purely organisational. Permissions are always set at the file level. This keeps the mental model simple for the user and the code simple to reason about.

### Why the permission context menu lives on right-click

The original design had a separate Permissions tab in the management panel showing a full role × file matrix. I moved permissions to a right-click context menu on each file because it maps to how you actually think about permissions — you think "what can each role do with this file" not "show me a spreadsheet of all files and all roles." The context menu is more discoverable, faster to use, and keeps the UI clean.

---

## Where I Hit Walls

### Monaco documentation

Monaco's documentation is sparse and not always up to date with the current API. The gap between "use this library" and "understand the document model" is significant. I had to read the TypeScript source directly several times to understand how `deltaDecorations` works, how the editor and model relate to each other, and how to correctly apply decorations across the full file without conflicting with Monaco's own internal decorations. The key insight was that Monaco owns its model state — you do not set content directly, you work with `ITextModel` and let Monaco re-render.

### React 19 and Monaco compatibility

`@monaco-editor/react` had not fully stabilised its React 19 support at the time of building. The library was exporting `memo` from React, which changed in React 19. After investigating the issue and checking the library's release notes, the fix was clearing Vite's dependency cache (`node_modules/.vite`) after installing the release candidate version. This is the kind of issue that is invisible until runtime and non-obvious to debug.

### React StrictMode and WebSockets

React StrictMode mounts components twice in development to detect side effects. This caused the WebSocket connection to fire twice — the first connection would error before the second one succeeded, and our error handler was rejecting the entire connection promise based on the first error. The fix was tracking a `resolved` flag in the connection promise — once `onopen` fires, subsequent `onerror` events are ignored.

### TypeScript monorepo setup

Sharing types between the server and client in a TypeScript monorepo requires careful `tsconfig` configuration. The `rootDir` setting conflicts with importing from a parent directory. The solution was setting `rootDir` to `..` (the monorepo root) so TypeScript treats the entire project as one source tree, while keeping `outDir` pointed at the server's own dist folder.

---

## Setup and Running

### Requirements

- Node.js 18 or higher
- npm 9 or higher

Check your versions:

```bash
node --version
npm --version
```

### 1. Clone and install

```bash
git clone <repository-url>
cd ikeloa
npm install
```

This installs dependencies for all three packages (shared, server, client) via npm workspaces.

### 2. Start the server

Open a terminal and run:

```bash
cd server
npx ts-node-dev --respawn --transpile-only src/index.ts
```

You should see:

```
[Server] Ikeloa server running on ws://localhost:8080
[Server] Health check: http://localhost:8080/health
```

Leave this terminal running.

### 3. Start the client

Open a second terminal and run:

```bash
cd client
npm run dev
```

You should see Vite start and print a local URL, typically:

```
http://localhost:5173
```

### 4. Open in browser

Navigate to `http://localhost:5173` in your browser.

To test collaboration, open the same URL in a second browser tab or window.

---

## How to Use It

### Creating a session

1. Enter your name
2. Optionally upload files or an entire folder from your machine
3. Click **Create Session**
4. You land in the editor as the Organiser — you have full access to everything

The session code appears in the top bar (e.g. `DELTA-7823`). Click it to copy it to your clipboard.

### Inviting collaborators

Share the session code with your team. They go to `http://localhost:5173`, click **Join Session**, enter the code and their name.

### Setting up roles

1. Click **⚙️ Manage** in the top bar
2. Click **+ Add Role** — give it a name like "PI" or "Grad Student"
3. Add as many roles as you need
4. Use the ▲ ▼ buttons to set the hierarchy — roles higher in the list have more authority

### Assigning roles to members

1. In the Manage panel, click the **Members** tab
2. Use the dropdown next to each user to assign them a role

### Setting file permissions

1. Right-click any file in the sidebar
2. Hover over **🔐 Set Permissions**
3. Use the dropdown next to each role to set edit, read, or hidden

Changes apply immediately. Users with hidden permission will see the file disappear from their sidebar. Users with read permission will see a 🔒 badge and a read-only editor.

### Proposing a change (as a read-only user)

1. Open a file you have read access to
2. Click the **🔔 Request Change** button in the bottom right
3. Edit the file in the composer that opens
4. Click **Submit Request**

The file owner receives a notification. They can open the diff view to see exactly what changed and approve or reject with an optional reason.

### Adding files mid-session (Organiser only)

Click the **📄+** or **📁+** buttons at the top of the sidebar to add a new file or folder. You can also upload files from disk directly into the session.

### Downloading files

Click the **⬇️ Download** button in the top bar at any time. You will receive a zip file containing all files you have access to, preserving the folder structure.

---

## What I Would Build Next

Given more time, here is what I would tackle in order:

**CRDT-based collaboration** — replace the file locking model with proper Conflict-free Replicated Data Types using a library like Yjs. This would allow multiple users to edit the same file simultaneously without conflicts, which is the correct long-term solution.

**Authentication and persistence** — add a proper auth system and a database (PostgreSQL) to persist sessions, role configurations, and file history across server restarts. Role configurations in particular are worth persisting — a PI should not have to recreate their team's role setup every session.

**Role templates** — let organisers save and export their role configuration as a reusable template. A research lab could have a standard template that gets loaded at the start of every session.

**Inline scientific output** — since this is built for Ikeloa's scientific IDE vision, the natural next step is rendering scientific output inline. Run a Python file, show the matplotlib plot directly in the editor pane next to the code that produced it.

**Conflict resolution UI** — when a senior overrides a junior's in-progress edit, instead of silently overwriting, capture the junior's unsaved changes and automatically convert them into a pending change request. No work is ever lost.

---

## Project Structure Reference

```
ikeloa/
├── shared/
│   └── types.ts                    # All shared types and WS message protocol
│
├── server/
│   └── src/
│       ├── index.ts                # HTTP + WebSocket server entry point
│       ├── session/
│       │   ├── Session.ts          # SessionInstance class — owns all session state
│       │   └── SessionManager.ts  # Creates and looks up sessions
│       ├── handlers/
│       │   ├── handleJoin.ts       # Join/create session
│       │   ├── handleFileChange.ts # File content sync
│       │   ├── handleFileLock.ts   # File lock/unlock
│       │   ├── handleRoleUpdate.ts # Role CRUD and user assignment
│       │   ├── handleChangeRequest.ts # Change request flow
│       │   └── handleFileSystem.ts # File/folder add and delete
│       └── utils/
│           ├── broadcast.ts        # WebSocket send helpers
│           └── idGenerator.ts      # UUID and session code generation
│
└── client/
    └── src/
        ├── engine/
        │   ├── RoleEngine.ts       # Role hierarchy and permission resolution
        │   ├── PermissionResolver.ts # Maps permissions to editor behaviour
        │   └── SessionState.ts     # Client-side session state manager
        ├── socket/
        │   ├── SocketClient.ts     # WebSocket connection and send methods
        │   └── handlers/           # One handler per incoming message type
        ├── monaco/
        │   ├── EditorInstance.tsx  # Monaco editor component
        │   ├── DecorationManager.ts # File decoration based on permission
        │   ├── LockManager.ts      # Tracks who is editing what
        │   └── ChangeRequestDiff.tsx # Diff view for change request review
        ├── components/
        │   ├── layout/             # Sidebar, TabBar, NotificationPanel
        │   ├── roles/              # RoleManager, RoleCard, UserRoleAssigner
        │   ├── session/            # CreateSession, JoinSession
        │   └── notifications/      # Toast components
        └── pages/
            ├── Landing.tsx         # Create or join screen
            └── Session.tsx         # Main editor experience
```
