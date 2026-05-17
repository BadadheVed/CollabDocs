// Session management via backend-set HttpOnly cookie.
// The user identity cookie (collabdocs_user_token) is written by the backend on
// first join/create — not accessible from JS. Sessions are stored in Redis keyed
// by that token. These helpers call the backend API to read session data.

import axios from "@/axios/axios";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export interface SessionEntry {
  documentId: string;
  title: string;
  docId: number;
  joinedAt: string;
  participants: string[];
}

// No-op: session cookie is now set server-side as HttpOnly via Set-Cookie header.
export function addSessionToCookie(_entry: {
  documentId: string;
  token: string;
  title: string;
  docId: number;
}): void {}

export async function getSessionsFromCookie(): Promise<SessionEntry[]> {
  try {
    const res = await axios.get(`${BACKEND_URL}/docs/sessions`);
    return res.data.sessions ?? [];
  } catch {
    return [];
  }
}

export async function getTokenFromCookie(
  documentId: string,
): Promise<string | null> {
  try {
    const res = await axios.get(
      `${BACKEND_URL}/docs/sessions/${documentId}/token`,
    );
    return res.data.token ?? null;
  } catch {
    return null;
  }
}
