import Redis from "ioredis";

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60; // 604800

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  lazyConnect: true,
});

redis.on("error", (err) => {
  // Log but don't crash — Redis is a cache layer, not critical path
  console.error("Redis connection error:", err.message);
});

redis.on("connect", () => {
  console.log("✅ Connected to Redis");
});

/** Cache key for a document's content */
function docKey(documentId: string): string {
  return `doc:content:${documentId}`;
}

/**
 * Read cached document content from Redis.
 * Returns null on cache miss or any Redis error.
 */
export async function getCachedContent(
  documentId: string,
): Promise<string | null> {
  try {
    return await redis.get(docKey(documentId));
  } catch {
    return null;
  }
}

/**
 * Write document content to Redis with a 7-day TTL.
 * Silently swallows errors — cache failure must not break the save flow.
 */
export async function setCachedContent(
  documentId: string,
  content: string,
): Promise<void> {
  try {
    await redis.set(docKey(documentId), content, "EX", SEVEN_DAYS_SECONDS);
  } catch (err: any) {
    console.error("Redis set error:", err.message);
  }
}

/**
 * Delete a cached entry (e.g. on document deletion).
 */
export async function deleteCachedContent(documentId: string): Promise<void> {
  try {
    await redis.del(docKey(documentId));
  } catch {
    // silently ignore
  }
}

// ── Document Token Storage ────────────────────────────────────────────────────

function docTokenKey(documentId: string): string {
  return `doc:token:${documentId}`;
}

/**
 * Store the JWT token for a document in Redis (TTL: 7 days).
 * Allows fast recent-doc lookups without re-issuing tokens.
 */
export async function setDocToken(
  documentId: string,
  token: string,
): Promise<void> {
  try {
    await redis.set(docTokenKey(documentId), token, "EX", SEVEN_DAYS_SECONDS);
  } catch {
    // silently ignore
  }
}

/**
 * Retrieve the stored JWT token for a document.
 */
export async function getDocToken(
  documentId: string,
): Promise<string | null> {
  try {
    return await redis.get(docTokenKey(documentId));
  } catch {
    return null;
  }
}

// ── Document Participant Tracking ─────────────────────────────────────────────

const MAX_PARTICIPANTS = 20;

function participantsKey(documentId: string): string {
  return `doc:participants:${documentId}`;
}

/**
 * Record a participant name for a document (TTL: 7 days).
 * Keeps up to 20 unique names, most recent first.
 */
export async function addDocParticipant(
  documentId: string,
  name: string,
): Promise<void> {
  try {
    const key = participantsKey(documentId);
    const raw = await redis.get(key);
    let names: string[] = raw ? JSON.parse(raw) : [];
    names = names.filter((n) => n !== name);
    names.unshift(name);
    await redis.set(
      key,
      JSON.stringify(names.slice(0, MAX_PARTICIPANTS)),
      "EX",
      SEVEN_DAYS_SECONDS,
    );
  } catch {
    // silently ignore
  }
}

/**
 * Get the list of participant names for a document.
 */
export async function getDocParticipants(
  documentId: string,
): Promise<string[]> {
  try {
    const raw = await redis.get(participantsKey(documentId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default redis;
