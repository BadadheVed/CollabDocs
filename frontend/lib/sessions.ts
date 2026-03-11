// Cookie-based storage for document JWT tokens (recent docs)

const COOKIE_NAME = "collabdocs_sessions";
const MAX_SESSIONS = 10;
const TTL_DAYS = 7;

export interface SessionEntry {
  documentId: string;
  token: string;
  title: string;
  docId: number;
}

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(^| )" + name + "=([^;]+)"),
  );
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookieValue(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function getSessionsFromCookie(): SessionEntry[] {
  try {
    const raw = getCookieValue(COOKIE_NAME);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addSessionToCookie(entry: SessionEntry) {
  const sessions = getSessionsFromCookie().filter(
    (s) => s.documentId !== entry.documentId,
  );
  sessions.unshift(entry); // most recent first
  setCookieValue(
    COOKIE_NAME,
    JSON.stringify(sessions.slice(0, MAX_SESSIONS)),
    TTL_DAYS,
  );
}

export function getTokenFromCookie(documentId: string): string | null {
  return (
    getSessionsFromCookie().find((s) => s.documentId === documentId)?.token ??
    null
  );
}
