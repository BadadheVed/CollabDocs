"use client";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:1234";
const PING_INTERVAL = 2 * 60 * 1000; // 2 minutes

let pingIntervalId: NodeJS.Timeout | null = null;

/**
 * Ping backend health endpoint
 */
async function pingBackend(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      console.log("✅ Backend ping successful");
      return true;
    } else {
      console.warn("⚠️ Backend ping failed with status:", response.status);
      return false;
    }
  } catch (error) {
    console.error("❌ Backend ping error:", error);
    return false;
  }
}

/**
 * Test WebSocket connection
 */
function pingWebSocket(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(WS_URL);
      const timeout = setTimeout(() => {
        ws.close();
        console.warn("⚠️ WebSocket ping timeout");
        resolve(false);
      }, 5000);

      ws.onopen = () => {
        clearTimeout(timeout);
        console.log("✅ WebSocket ping successful");
        ws.close();
        resolve(true);
      };

      ws.onerror = (error) => {
        clearTimeout(timeout);
        console.error("❌ WebSocket ping error:", error);
        resolve(false);
      };
    } catch (error) {
      console.error("❌ WebSocket ping failed:", error);
      resolve(false);
    }
  });
}

/**
 * Execute all pings
 */
async function executePings() {
  console.log(`\n--- Keep-Alive Ping (${new Date().toLocaleTimeString()}) ---`);

  const [backendSuccess, wsSuccess] = await Promise.all([
    pingBackend(),
    pingWebSocket(),
  ]);

  if (backendSuccess && wsSuccess) {
    console.log("✅ All services are alive");
  } else {
    console.log("❌ Some services are down");
  }
}

/**
 * Start keep-alive pings
 */
export function startKeepAlive() {
  if (pingIntervalId) {
    console.log("Keep-alive already running");
    return;
  }

  console.log("🚀 Starting keep-alive service (5-minute interval)");

  // Execute immediately on start
  executePings();

  // Then execute every 5 minutes
  pingIntervalId = setInterval(executePings, PING_INTERVAL);
}

/**
 * Stop keep-alive pings
 */
export function stopKeepAlive() {
  if (pingIntervalId) {
    clearInterval(pingIntervalId);
    pingIntervalId = null;
    console.log("Keep-alive service stopped");
  }
}
