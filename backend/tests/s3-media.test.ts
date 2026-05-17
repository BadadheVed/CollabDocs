import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";

// The mockSend function is created in the factory and shared across tests
const mockSend = jest.fn();

// Mock the AWS SDK at module level — s3Client is created at import time
jest.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
    PutObjectCommand: jest.fn().mockImplementation((input: any) => ({ input, _type: 'PutObjectCommand' })),
    GetObjectCommand: jest.fn().mockImplementation((input: any) => ({ input, _type: 'GetObjectCommand' })),
  };
});

// Import after mocking so the module uses the mocked S3Client
import { generateMediaKey, uploadMediaToS3, streamMediaFromS3 } from "@/utils/s3";

describe("generateMediaKey", () => {
  it("returns a string starting with media/{docId}/", () => {
    const key = generateMediaKey("doc-123", "photo.jpg");
    expect(key).toMatch(/^media\/doc-123\//);
  });

  it("has the correct extension from the filename", () => {
    const key = generateMediaKey("doc-abc", "photo.jpg");
    expect(key.endsWith(".jpg")).toBe(true);
  });

  it("uses .png extension for .png files", () => {
    const key = generateMediaKey("doc-abc", "image.PNG");
    expect(key.endsWith(".png")).toBe(true);
  });

  it("falls back to .bin for filenames with no extension", () => {
    const key = generateMediaKey("doc-abc", "noextension");
    expect(key.endsWith(".bin")).toBe(true);
  });

  it("returns different keys on two calls (UUID uniqueness)", () => {
    const key1 = generateMediaKey("doc-abc", "photo.jpg");
    const key2 = generateMediaKey("doc-abc", "photo.jpg");
    expect(key1).not.toBe(key2);
  });
});

describe("uploadMediaToS3", () => {
  beforeEach(() => {
    mockSend.mockResolvedValue({});
  });

  it("calls PutObjectCommand with correct params and returns the key", async () => {
    const MockPutObjectCommand = PutObjectCommand as jest.MockedClass<typeof PutObjectCommand>;
    const key = "media/doc-1/uuid.jpg";
    const buffer = Buffer.from("fake-image-data");
    const mimeType = "image/jpeg";

    const result = await uploadMediaToS3(key, buffer, mimeType);

    expect(MockPutObjectCommand).toHaveBeenCalledWith({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    });
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(result).toBe(key);
  });

  it("propagates errors from S3", async () => {
    mockSend.mockRejectedValueOnce(new Error("S3 failure"));
    await expect(
      uploadMediaToS3("some/key.jpg", Buffer.from("x"), "image/jpeg")
    ).rejects.toThrow("S3 failure");
  });
});

describe("streamMediaFromS3", () => {
  it("calls GetObjectCommand and returns body and contentType", async () => {
    const MockGetObjectCommand = GetObjectCommand as jest.MockedClass<typeof GetObjectCommand>;
    const mockReadable = Readable.from(["test-data"]);
    mockSend.mockResolvedValueOnce({
      Body: mockReadable,
      ContentType: "image/jpeg",
    });

    const key = "media/doc-1/uuid.jpg";
    const result = await streamMediaFromS3(key);

    expect(MockGetObjectCommand).toHaveBeenCalledWith({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    });
    expect(result.body).toBe(mockReadable);
    expect(result.contentType).toBe("image/jpeg");
  });

  it("uses application/octet-stream when ContentType is missing", async () => {
    const mockReadable = Readable.from(["data"]);
    mockSend.mockResolvedValueOnce({
      Body: mockReadable,
      ContentType: undefined,
    });

    const result = await streamMediaFromS3("some/key.bin");
    expect(result.contentType).toBe("application/octet-stream");
  });

  it("propagates errors when S3 throws", async () => {
    const err = new Error("NoSuchKey");
    err.name = "NoSuchKey";
    mockSend.mockRejectedValueOnce(err);

    await expect(streamMediaFromS3("missing/key.jpg")).rejects.toThrow("NoSuchKey");
  });
});
