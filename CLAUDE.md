## Stack
Language/Runtime: TypeScript (Node.js backend), Next.js 14 (frontend)
Framework: Express.js (backend), Next.js (frontend), Hocuspocus (WebSocket server)

## Databases
Type: PostgreSQL
Mode: Standalone
Client: Prisma ORM (@prisma/client 5.20.0)
Config location: /Users/ved/collabdocs/backend/.env (DATABASE_URL)
Current schema: Document model with id (UUID), title, docId (9-digit), pin (4-digit), Content (JSON), timestamps

## Caching
None currently configured in codebase

## Object Storage
None currently configured. Document content stored in PostgreSQL as JSON.

## Message Queues
None currently configured. Synchronization via WebSocket real-time collaboration only.

## Auth & Secrets
Auth method: JWT tokens (7-day expiration)
Secret manager: Environment variables (.env files)
JWT_SECRET in /Users/ved/collabdocs/backend/.env
Token issued on document creation and join operations
Token validated in both backend and WebSocket server

## Service Wiring
Frontend (Next.js 3000) → Backend API (Express 8080) via HTTP
Frontend → WebSocket Server (Hocuspocus 1234) via WebSocket for real-time collaboration
Backend → PostgreSQL (via Prisma)
WebSocket Server → Backend (for join validation and token verification via axios)
All services health-checked via periodic cron jobs

## External Services
Hocuspocus (@hocuspocus/provider 3.4.0): Real-time collaboration framework
Tiptap (2.6.6): Rich text editor with extensions (links, images, tables, colors, etc.)
Yjs (13.6.19): CRDT library for conflict-free collaboration
PDF handling: pdfjs-dist, mammoth (Word imports), html2pdf.js, docx (exports)

## Module Map
`backend/` — Express API server with document CRUD, auth, metrics
`backend/src/controllers/` — Document controller (create, join, verify, save)
`backend/src/routers/` — Express route definitions (/docs endpoints)
`backend/src/client/` — Database client (Prisma singleton)
`backend/src/utils/` — Utility functions (room code, PIN generation)
`backend/src/cron/` — 5-minute monitoring job (health checks via HTTP and WebSocket)
`backend/src/prom/` — Prometheus metrics collection and middleware
`backend/prisma/` — Prisma schema and migrations
`hocuspocus-server/` — WebSocket server for real-time document sync
`hocuspocus-server/src/auth.ts` — Token and credential validation (calls backend /docs endpoints)
`frontend/` — Next.js application with pages, components, and styling
`frontend/app/` — Next.js App Router pages (home, join, docs)
`frontend/components/` — React components (CollaborativeEditor, dialogs, UI buttons)
`frontend/lib/` — Utilities (API calls, PDF/Word conversion, keep-alive pings)
`frontend/axios/` — Axios instance for backend communication
`frontend/types/` — TypeScript interfaces (User, EditorProps)

## API Routes
POST /docs/create — Create new document (req: title, res: id, docId, pin, joinLink, token)
POST /docs/join — Join document with credentials (req: docId, pin, res: id, title, token)
POST /docs/verify-token — Verify JWT token validity (req: token, res: id, title, docId)
POST /docs/save — Save document content (req: token, content, res: saved metadata)
GET /health — Health check endpoint
GET /metrics — Prometheus metrics in text format
GET /ws-logs — WebSocket connection logs (debug)
GET /health — WebSocket server health
GET /room/{uuid} — Get active user count for document
GET /rooms — List all active rooms and user counts

## Database Schema
Document:
  - id (UUID, primary key)
  - title (VARCHAR 255)
  - docId (integer, 9-digit code)
  - pin (integer, 4-digit code)
  - Content (JSON)
  - createdAt (timestamp)
  - updatedAt (timestamp)

Migration files:
  - 20251026173253_init: Initial schema with User and Document models (later simplified)
  - 20251114094939_test1: Document model schema update

## Document Flow
1. User creates document on frontend with title
2. POST /docs/create generates 9-digit docId, 4-digit PIN, UUID document ID
3. Backend stores in PostgreSQL, returns JWT token
4. Frontend displays share link with docId and PIN
5. Other users join via docId + PIN on /join page
6. Backend validates and issues JWT token
7. Frontend stores token in localStorage by document ID
8. Users connect to WebSocket (Hocuspocus) with token
9. WebSocket server validates token with backend /docs/verify-token
10. Real-time edits via Yjs CRDT synced through WebSocket
11. Content stored in Document.Content (JSON) on backend

## Save/Update Workflows
Automatic save on WebSocket disconnect or periodic intervals via frontend
Manual save via POST /docs/save with token and content
Document.Content field updated in PostgreSQL
No explicit save button in current UI (auto-save driven)

## Environment Configuration
Backend (.env keys):
  - PORT: Server port (default 8080)
  - DATABASE_URL: PostgreSQL connection string
  - JWT_SECRET: Secret for JWT signing
  - FRONTEND_URL: Frontend origin for CORS
  - CRON_HTTP_URL: Backend URL for health checks
  - CRON_WS_URL: WebSocket server URL for health checks

Frontend (.env keys):
  - NEXT_PUBLIC_BACKEND_URL: Backend API endpoint (default http://localhost:8080)
  - NEXT_PUBLIC_WS_URL: WebSocket server endpoint (default ws://localhost:1234)
  - NEXT_PUBLIC_WS_API_URL: WebSocket HTTP API endpoint for room info (default http://localhost:1235)
  - NEXT_PUBLIC_BASE_URL: Site base URL for SEO (default https://collabdocs.in)

WebSocket Server (.env keys):
  - PORT: WebSocket server port (default 1234)
  - BACKEND_URL: Backend API URL for validation

## Key Files for Core Features
- Document creation/join: /Users/ved/collabdocs/backend/src/controllers/document.controller.ts
- WebSocket authentication: /Users/ved/collabdocs/hocuspocus-server/src/auth.ts
- Real-time editor: /Users/ved/collabdocs/frontend/components/CollaborativeEditor.tsx
- Home page (create/join): /Users/ved/collabdocs/frontend/app/page.tsx
- Document page (editor): /Users/ved/collabdocs/frontend/app/docs/[id]/page.tsx
- Prisma schema: /Users/ved/collabdocs/backend/prisma/schema.prisma
- Backend routes: /Users/ved/collabdocs/backend/src/routers/docs.ts
- API client: /Users/ved/collabdocs/frontend/lib/api.ts

## Metrics & Monitoring
Prometheus metrics endpoints at /metrics on backend and WebSocket server
Counters: http_requests_total, http_errors_total
Histogram: http_request_duration_ms (buckets: 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000ms)
Cron job runs every 5 minutes for self-health checks (HTTP and WebSocket)
WebSocket connection logs stored in memory (last 50 events)

## File Upload/Import Features
PDF import: extractTextFromPDF with pdfjs-dist, converts to editable HTML
Word import: extractTextFromWord with mammoth library
PDF export: exportEditorToPDF with html2pdf.js
Word export: exportEditorToWord with docx library
Images: Insert via URL or base64 data URI (stored inline in Yjs doc)

## Port Configuration
Frontend: 3000 (Next.js dev server)
Backend: 8080 (Express API)
WebSocket Server: 1234 (Hocuspocus)
PostgreSQL: Default 5432 (via DATABASE_URL connection string)

## Keep-Alive Service
Frontend runs keep-alive pings every 5 minutes
Pings backend /health endpoint
Pings WebSocket server health endpoint
Used to prevent long-running connections from timing out in serverless/cloud environments
