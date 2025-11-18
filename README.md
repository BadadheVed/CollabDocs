# Collaborative Document Editor

A real-time collaborative document editor built with Next.js, Express.js, and WebSockets using Hocuspocus.

## Architecture

- **Frontend**: Next.js with TipTap editor for rich text editing
- **Backend**: Express.js API server for document management
- **WebSocket Server**: Hocuspocus server for real-time collaboration
- **Database**: PostgreSQL with Prisma ORM

## Flow

1. User creates a document → Gets 9-digit `docId` and 4-digit `pin`
2. Creator or other users join using `docId` and `pin`
3. Backend validates credentials and returns document UUID
4. Users join WebSocket room using the document UUID for real-time collaboration

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- PostgreSQL database
- npm or yarn

### 1. Database Setup

```bash
# Start PostgreSQL and create a database named 'collabdocs'
createdb collabdocs
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database URL
npm run db:push  # If you have a db:push script
# OR run prisma commands directly:
npx prisma db push
npx prisma generate
npm run dev
```

### 3. WebSocket Server Setup

```bash
cd hocuspocus-server
npm install
cp .env.example .env
npm run dev
```

### 4. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Usage

1. **Create Document**:

   - Visit `http://localhost:3000`
   - Enter a document title and click "Create Document"
   - You'll get a 9-digit Document ID and 4-digit PIN

2. **Join Document**:
   - Click "Join with Document ID & Pin" or visit `/join`
   - Enter your name, Document ID, and PIN
   - Start collaborating in real-time!

## API Endpoints

### POST /docs/create

Creates a new document

```json
{
  "title": "My Document"
}
```

### POST /docs/join

Validates document access

```json
{
  "docId": 123456789,
  "pin": 1234
}
```

## Environment Variables

### Backend (.env)

```
DATABASE_URL="postgresql://username:password@localhost:5432/collabdocs"
PORT=3001
FRONTEND_URL="http://localhost:3000"
BASE_URL="http://localhost:3000"
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:1234
```

### WebSocket Server (.env)

```
PORT=1234
```

## Database Schema

```prisma
model Document {
  id        String   @id @default(uuid()) @db.Uuid
  title     String   @db.VarChar(255)
  docId     Int      // 9-digit numeric code
  pin       Int?     // 4-digit access code
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  Content   Json?
}
```

## Ports

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- WebSocket Server: ws://localhost:1234
