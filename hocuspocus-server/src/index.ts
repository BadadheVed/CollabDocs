import { Server } from "@hocuspocus/server";
import * as Y from "yjs";
import chalk from "chalk";
import dotenv from "dotenv";
import { validateJoinAccess, validateToken } from "./auth";

dotenv.config();

const PORT = Number(process.env.PORT || 1234);

// Track active connections per room
const roomConnections = new Map<string, Set<string>>();
const connectionLogs: Array<{
  timestamp: string;
  event: string;
  user?: string;
  room?: string;
  socketId?: string;
}> = [];

// Keep last 50 connection events for debugging
function logEvent(event: string, details: any = {}) {
  const log = {
    timestamp: new Date().toISOString(),
    event,
    ...details,
  };
  connectionLogs.push(log);
  if (connectionLogs.length > 50) {
    connectionLogs.shift();
  }
}

/**
 * Each document's UUID acts as a WebSocket room name.
 * The backend validates docId + pin, and if valid, users
 * join the UUID-based room for real-time collaboration.
 */
const server = new Server({
  port: PORT,

  async onAuthenticate(data) {
    const roomUUID = data.documentName;
    const token = data.requestParameters.get("token");
    const docId = data.requestParameters.get("docId");
    const pin = data.requestParameters.get("pin");
    const name = data.requestParameters.get("name");

    console.log(chalk.yellow("🔍 Auth attempt:"), {
      hasToken: !!token,
      docId,
      pin,
      name,
      roomUUID,
    });

    logEvent("auth_attempt", { hasToken: !!token, docId, pin, name, roomUUID });

    // If token is provided, validate it first
    if (token) {
      const tokenValidation = await validateToken(token);

      if (tokenValidation && tokenValidation.id === roomUUID) {
        console.log(
          chalk.green("✅ Auth success via token:"),
          chalk.cyan(name || "User"),
          chalk.gray(`room=${roomUUID}`)
        );

        logEvent("auth_success", { method: "token", name, roomUUID });

        data.context.user = { name: name || "User", token };
        return { user: { name: name || "User" } };
      } else {
        console.log(chalk.red("❌ Invalid or mismatched token"));
        logEvent("auth_failed", { reason: "invalid_token" });
        throw new Error("Unauthorized - Invalid token");
      }
    }

    // Fallback to docId/pin authentication
    if (!docId || !pin || !name) {
      console.log(chalk.red("❌ Missing docId, pin, or name"));
      logEvent("auth_failed", { reason: "missing_params", docId, pin, name });
      throw new Error("Unauthorized");
    }

    const document = await validateJoinAccess(Number(docId), Number(pin));

    if (!document) {
      console.log(
        chalk.red(`❌ Invalid access for docId=${docId}, pin=${pin}`)
      );
      logEvent("auth_failed", { reason: "invalid_credentials", docId, pin });
      throw new Error("Unauthorized");
    }

    console.log(
      chalk.green("✅ Auth success via credentials:"),
      chalk.cyan(name),
      chalk.gray(`room=${roomUUID}`)
    );

    logEvent("auth_success", { method: "credentials", name, roomUUID, docId });

    data.context.user = { name, token: document.token };
    return { user: { name } };
  },

  async onConnect({ documentName, context, socketId }) {
    if (!roomConnections.has(documentName)) {
      roomConnections.set(documentName, new Set());
    }
    roomConnections.get(documentName)?.add(socketId);

    const userCount = roomConnections.get(documentName)?.size || 0;

    console.log(
      chalk.green("🟢 Connected:"),
      chalk.cyan(context.user?.name),
      chalk.gray(`room=${documentName}`),
      chalk.gray(`users=${userCount}`)
    );

    logEvent("connected", {
      user: context.user?.name,
      room: documentName,
      socketId,
      userCount,
    });
  },

  async onDisconnect({ documentName, context, socketId }) {
    roomConnections.get(documentName)?.delete(socketId);
    if (roomConnections.get(documentName)?.size === 0) {
      roomConnections.delete(documentName);
    }

    const userCount = roomConnections.get(documentName)?.size || 0;

    console.log(
      chalk.red("🔴 Disconnected:"),
      chalk.cyan(context.user?.name),
      chalk.gray(`room=${documentName}`),
      chalk.gray(`users=${userCount}`)
    );

    logEvent("disconnected", {
      user: context.user?.name,
      room: documentName,
      socketId,
      userCount,
    });
  },

  async onLoadDocument({ documentName }) {
    console.log(chalk.blue("📄 Loading document:"), chalk.gray(documentName));
    logEvent("document_loaded", { room: documentName });
    return new Y.Doc();
  },

  async onRequest({ request, response }) {
    // Enable CORS
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (request.method === "OPTIONS") {
      response.writeHead(200);
      response.end();
      return { status: "handled" };
    }

    // WebSocket connection logs - for debugging WS connections
    if (request.url === "/ws-logs" && request.method === "GET") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify(
          {
            success: true,
            totalEvents: connectionLogs.length,
            logs: connectionLogs,
            currentState: {
              activeRooms: roomConnections.size,
              totalConnections: Array.from(roomConnections.values()).reduce(
                (sum, set) => sum + set.size,
                0
              ),
            },
          },
          null,
          2
        )
      );
      return { status: "handled" };
    }

    // Get room user count: /room/{uuid}
    if (request.url?.startsWith("/room/") && request.method === "GET") {
      const roomId = request.url.split("/room/")[1]?.split("?")[0];

      if (!roomId) {
        response.writeHead(400, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: "Room ID required" }));
        return { status: "handled" };
      }

      try {
        const userCount = roomConnections.get(roomId)?.size || 0;

        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(
          JSON.stringify({
            roomId,
            userCount,
            timestamp: Date.now(),
          })
        );
        console.log(
          chalk.blue(`📊 Room count query: ${roomId} = ${userCount} users`)
        );
      } catch (error) {
        console.error("Error getting user count:", error);
        response.writeHead(500, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: "Internal server error" }));
      }
      return { status: "handled" };
    }

    // Get all active rooms
    if (request.url === "/rooms" && request.method === "GET") {
      const rooms = Array.from(roomConnections.entries()).map(
        ([roomId, connections]) => ({
          roomId,
          userCount: connections.size,
        })
      );

      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({
          totalRooms: rooms.length,
          rooms,
          timestamp: Date.now(),
        })
      );
      return { status: "handled" };
    }

    // If it's not one of our endpoints, let Hocuspocus handle it (WebSocket upgrade)
    // Don't send 404 here, just return undefined to pass control to Hocuspocus
    return;
  },
});

server.listen().then(() => {
  console.log(chalk.green(`✅ WebSocket server running on port ${PORT}`));
  console.log(chalk.cyan(`   ws://localhost:${PORT}`));
  console.log(
    chalk.gray(`   
Debug endpoint:
   - GET /ws-logs (view connection logs)`)
  );
});
