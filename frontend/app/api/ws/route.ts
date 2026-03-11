import { NextRequest } from "next/server";

const WS_URL = process.env.WS_API_URL || "ws://collabdocs-ws:1234";

export async function GET(request: NextRequest) {
  const upgradeHeader = request.headers.get("upgrade");

  if (upgradeHeader !== "websocket") {
    return new Response("Expected Upgrade: websocket", { status: 426 });
  }

  // For Next.js, we need to handle WebSocket upgrade differently
  // This is a simplified approach - in production, you might need a custom server
  try {
    // Next.js doesn't support WebSocket upgrades in Edge Runtime
    // We need to return instructions for the client to connect differently
    return new Response(
      JSON.stringify({
        error: "WebSocket proxy not supported in Next.js API routes",
        message:
          "Please use a dedicated WebSocket server or custom Next.js server",
      }),
      {
        status: 501,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response("WebSocket proxy error", { status: 500 });
  }
}
