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

// ── User Session Tracking ─────────────────────────────────────────────────────

const USER_SESSIONS_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
const MAX_USER_SESSIONS = 10;

interface UserSessionMeta {
  title: string;
  docId: number;
  joinedAt: string;
  participants: string[];
}

function userSessionsKey(userToken: string): string {
  return `user_sessions:${userToken}`;
}

export async function addUserSession(
  userToken: string,
  documentId: string,
  meta: { title: string; docId: number; participants: string[] },
): Promise<void> {
  try {
    const key = userSessionsKey(userToken);
    const value: UserSessionMeta = {
      ...meta,
      joinedAt: new Date().toISOString(),
    };
    await redis.hset(key, documentId, JSON.stringify(value));

    const totalSessions = await redis.hlen(key);
    if (totalSessions > MAX_USER_SESSIONS) {
      const rawSessions = await redis.hgetall(key);
      if (Object.keys(rawSessions).length <= MAX_USER_SESSIONS) {
        await redis.expire(key, USER_SESSIONS_TTL);
        return;
      }

      const parseJoinedAt = (value: string): number => {
        try {
          const joinedAt = (JSON.parse(value) as UserSessionMeta).joinedAt;
          const parsed = Date.parse(joinedAt || "");
          return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
        } catch {
          return Number.NEGATIVE_INFINITY;
        }
      };

      const sessionsToRemove = Object.entries(rawSessions)
        .map(([docId, value]) => ({
          docId,
          joinedAt: parseJoinedAt(value),
        }))
        // Sort by newest-first, then remove entries beyond the max cap (oldest ones).
        .sort((a, b) => b.joinedAt - a.joinedAt)
        .slice(MAX_USER_SESSIONS)
        .map(({ docId }) => docId);

      if (sessionsToRemove.length > 0) {
        await redis.hdel(key, ...sessionsToRemove);
      }
    }

    await redis.expire(key, USER_SESSIONS_TTL);
  } catch {
    // silently ignore — session tracking is non-critical
  }
}

export async function getUserSessions(
  userToken: string,
): Promise<Array<{ documentId: string } & UserSessionMeta>> {
  try {
    const key = userSessionsKey(userToken);
    const raw = await redis.hgetall(key);
    if (!raw || Object.keys(raw).length === 0) return [];
    await redis.expire(key, USER_SESSIONS_TTL); // sliding TTL

    return Object.entries(raw)
      .flatMap(([documentId, value]) => {
        try {
          return [
            {
              documentId,
              ...(JSON.parse(value) as UserSessionMeta),
            },
          ];
        } catch {
          return [];
        }
      })
      .sort((a, b) => {
        const aTime = Date.parse(a.joinedAt);
        const bTime = Date.parse(b.joinedAt);
        const safeATime = Number.isNaN(aTime) ? Number.NEGATIVE_INFINITY : aTime;
        const safeBTime = Number.isNaN(bTime) ? Number.NEGATIVE_INFINITY : bTime;
        return safeBTime - safeATime;
      });
  } catch {
    return [];
  }
}

export async function hasUserAccess(
  userToken: string,
  documentId: string,
): Promise<boolean> {
  try {
    const key = userSessionsKey(userToken);
    const exists = await redis.hexists(key, documentId);
    if (exists === 1) await redis.expire(key, USER_SESSIONS_TTL); // sliding TTL
    return exists === 1;
  } catch {
    return false;
  }
}

export async function getUserSessionMeta(
  userToken: string,
  documentId: string,
): Promise<UserSessionMeta | null> {
  try {
    const key = userSessionsKey(userToken);
    const raw = await redis.hget(key, documentId);
    if (!raw) return null;
    await redis.expire(key, USER_SESSIONS_TTL); // sliding TTL
    return JSON.parse(raw) as UserSessionMeta;
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
