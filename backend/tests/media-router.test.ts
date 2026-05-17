import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { Readable } from "stream";

// Mock S3 utilities before importing the router
jest.mock("@/utils/s3", () => ({
  generateMediaKey: jest.fn(),
  uploadMediaToS3: jest.fn(),
  streamMediaFromS3: jest.fn(),
}));

// Also mock ioredis to prevent connection attempts from any transitive import
jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    on: jest.fn(),
    ping: jest.fn().mockResolvedValue("PONG"),
  }));
});

import { generateMediaKey, uploadMediaToS3, streamMediaFromS3 } from "@/utils/s3";
import mediaRouter from "@/routers/media";

const mockGenerateMediaKey = generateMediaKey as jest.Mock;
const mockUploadMediaToS3 = uploadMediaToS3 as jest.Mock;
const mockStreamMediaFromS3 = streamMediaFromS3 as jest.Mock;

const JWT_SECRET = "your-secret-key-change-in-production";

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/media", mediaRouter);
  return app;
}

function makeToken(payload: object = { documentId: "doc-123" }): string {
  return jwt.sign(payload, JWT_SECRET);
}

describe("POST /media/upload", () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();
    mockGenerateMediaKey.mockReturnValue("media/doc-123/uuid.jpg");
    mockUploadMediaToS3.mockResolvedValue("media/doc-123/uuid.jpg");
  });

  it("returns 401 when Authorization header is missing", async () => {
    const res = await request(app).post("/media/upload");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Missing token");
  });

  it("returns 401 when token has wrong signature", async () => {
    const badToken = jwt.sign({ documentId: "doc-123" }, "wrong-secret");
    const res = await request(app)
      .post("/media/upload")
      .set("Authorization", `Bearer ${badToken}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid token");
  });

  it("returns 400 when no file is attached", async () => {
    const token = makeToken();
    const res = await request(app)
      .post("/media/upload")
      .set("Authorization", `Bearer ${token}`)
      // send JSON body but no multipart file
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("No image file uploaded");
  });

  it("returns 201 with key and url on valid multipart upload with valid JWT", async () => {
    const token = makeToken({ documentId: "doc-123" });
    const res = await request(app)
      .post("/media/upload")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", Buffer.from("fake-image"), {
        filename: "test.jpg",
        contentType: "image/jpeg",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("key", "media/doc-123/uuid.jpg");
    expect(res.body).toHaveProperty("url");
    expect(res.body.url).toContain("/media/media/");
  });
});

describe("GET /media/*", () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();
  });

  it("returns 404 when streamMediaFromS3 throws with name NoSuchKey", async () => {
    const err = new Error("The specified key does not exist.");
    err.name = "NoSuchKey";
    mockStreamMediaFromS3.mockRejectedValueOnce(err);

    const res = await request(app).get("/media/media/doc-123/missing.jpg");
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Media not found");
  });

  it("returns 200 with correct Content-Type when stream succeeds", async () => {
    mockStreamMediaFromS3.mockResolvedValueOnce({
      body: Readable.from(["test"]),
      contentType: "image/png",
    });

    const res = await request(app).get("/media/media/doc-123/image.png");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("image/png");
  });
});
