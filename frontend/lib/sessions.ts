// Session management via backend-set HttpOnly cookie.
// The user identity cookie (collabdocs_user_token) is written by the backend on
// first join/create — not accessible from JS. Sessions are stored in Redis keyed
// by that token. These helpers call the backend API to read session data.

import axios from "@/axios/axios";

export interface SessionEntry {
  documentId: string;
  title: string;
  docId: number;
  joinedAt: string;
  participants: string[];
}

// No-op: session cookie is now set server-side as HttpOnly via Set-Cookie header.
export function trackSessionFromJoin(_entry: {
  documentId: string;
  token: string;
  title: string;
  docId: number;
}): void {}

export async function getUserSessions(): Promise<SessionEntry[]> {
  try {
    const res = await axios.get("/docs/sessions");
    return res.data.sessions ?? [];
  } catch {
    return [];
  }
}

export async function getSessionToken(
  documentId: string,
): Promise<string | null> {
  try {
    const res = await axios.get(`/docs/sessions/${documentId}/token`);
    return res.data.token ?? null;
  } catch {
    return null;
  }
}
