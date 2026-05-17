// Mock ioredis before importing anything that uses it
const mockGet = jest.fn();
const mockSet = jest.fn();

jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => ({
    get: mockGet,
    set: mockSet,
    del: jest.fn().mockResolvedValue(1),
    on: jest.fn(),
    ping: jest.fn().mockResolvedValue("PONG"),
  }));
});

import { setCachedContent, getCachedContent } from "@/utils/redis";

describe("setCachedContent", () => {
  beforeEach(() => {
    mockSet.mockResolvedValue("OK");
  });

  it("calls redis.set with the correct key, JSON value, EX flag, and TTL", async () => {
    const content = { ops: [{ insert: "Hello" }] };
    await setCachedContent("doc-1", content);

    expect(mockSet).toHaveBeenCalledWith(
      "doc:content:doc-1",
      JSON.stringify(content),
      "EX",
      604800
    );
  });

  it("does not throw when redis.set throws (swallows errors)", async () => {
    mockSet.mockRejectedValueOnce(new Error("Redis is down"));
    await expect(setCachedContent("doc-2", { ops: [] })).resolves.toBeUndefined();
  });
});

describe("getCachedContent", () => {
  it("returns parsed object when redis.get returns valid JSON", async () => {
    const content = { ops: [{ insert: "World" }] };
    mockGet.mockResolvedValueOnce(JSON.stringify(content));

    const result = await getCachedContent("doc-1");
    expect(result).toEqual(content);
  });

  it("returns null on cache miss (redis.get returns null)", async () => {
    mockGet.mockResolvedValueOnce(null);

    const result = await getCachedContent("doc-miss");
    expect(result).toBeNull();
  });

  it("returns null when redis.get returns invalid JSON", async () => {
    mockGet.mockResolvedValueOnce("not-valid-json{{{");

    const result = await getCachedContent("doc-bad");
    expect(result).toBeNull();
  });

  it("returns null when redis.get throws", async () => {
    mockGet.mockRejectedValueOnce(new Error("Connection refused"));

    const result = await getCachedContent("doc-err");
    expect(result).toBeNull();
  });
});
