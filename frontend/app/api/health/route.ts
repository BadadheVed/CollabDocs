import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
const WS_API_URL = process.env.NEXT_PUBLIC_WS_API_URL || "http://localhost:1235";

export async function GET() {
  const [backendRes, wsRes] = await Promise.allSettled([
    fetch(`${BACKEND_URL}/health`, { cache: "no-store" }),
    fetch(`${WS_API_URL}/health`, { cache: "no-store" }),
  ]);

  const backend = backendRes.status === "fulfilled" && backendRes.value.ok ? "up" : "down";
  const ws = wsRes.status === "fulfilled" && wsRes.value.ok ? "up" : "down";

  return NextResponse.json({ backend, ws });
}
