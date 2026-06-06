interface RedisCommands {
  sadd(key: string, ...members: string[]): Promise<number>;
  srem(key: string, ...members: string[]): Promise<number>;
  scard(key: string): Promise<number>;
  smembers(key: string): Promise<string[]>;
  del(key: string): Promise<number>;
  disconnect(): void | Promise<void>;
}

const ROOM_PREFIX = "ws:room:";
const ACTIVE_ROOMS_KEY = "ws:active-rooms";

export class RoomTracker {
  constructor(private redis: RedisCommands) {}

  async trackConnection(roomId: string, socketId: string): Promise<void> {
    try {
      await this.redis.sadd(`${ROOM_PREFIX}${roomId}`, socketId);
      await this.redis.sadd(ACTIVE_ROOMS_KEY, roomId);
    } catch (err: any) {
      console.error("[RoomTracker] trackConnection error:", err.message);
    }
  }

  async untrackConnection(roomId: string, socketId: string): Promise<void> {
    try {
      const roomKey = `${ROOM_PREFIX}${roomId}`;
      await this.redis.srem(roomKey, socketId);
      const remaining = await this.redis.scard(roomKey);
      if (remaining === 0) {
        await this.redis.del(roomKey);
        await this.redis.srem(ACTIVE_ROOMS_KEY, roomId);
      }
    } catch (err: any) {
      console.error("[RoomTracker] untrackConnection error:", err.message);
    }
  }

  async getRoomCount(roomId: string): Promise<number> {
    try {
      return await this.redis.scard(`${ROOM_PREFIX}${roomId}`);
    } catch {
      return 0;
    }
  }

  async getAllRooms(): Promise<Array<{ roomId: string; userCount: number }>> {
    try {
      const roomIds = await this.redis.smembers(ACTIVE_ROOMS_KEY);
      if (roomIds.length === 0) return [];
      return Promise.all(
        roomIds.map(async (roomId) => ({
          roomId,
          userCount: await this.redis.scard(`${ROOM_PREFIX}${roomId}`),
        }))
      );
    } catch {
      return [];
    }
  }

  async disconnect(): Promise<void> {
    await this.redis.disconnect();
  }
}
