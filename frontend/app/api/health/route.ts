import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
const rawWsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:1234";
const WS_API_URL = rawWsUrl.replace(/^wss:\/\//, "https://").replace(/^ws:\/\//, "http://");

export async function GET() {
  const [backendRes, wsRes] = await Promise.allSettled([
    fetch(`${BACKEND_URL}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    }),
    fetch(`${WS_API_URL}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    }),
  ]);

  const backend = backendRes.status === "fulfilled" && backendRes.value.ok ? "up" : "down";
  const ws = wsRes.status === "fulfilled" && wsRes.value.ok ? "up" : "down";

  return NextResponse.json({ backend, ws });
}
