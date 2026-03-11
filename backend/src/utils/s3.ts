import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET!;
const ENV = process.env.ENV || "development";
/**
 * Generates an S3 object key in the format: <title>-<first-5-chars-of-id>-<last-4-chars-of-id>
 * Example: mydoc-dfg6g-a3f1
 * No date — avoids duplicate keys when sessions run across midnight.
 */
export function generateS3Key(title: string, id: string): string {
  const safeTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
  const stripped = id.replace(/-/g, "");
  const first5 = stripped.slice(0, 5);
  const last4 = stripped.slice(-4);
  return `${ENV}/${safeTitle}-${first5}-${last4}`;
}

/**
 * Uploads content JSON to S3. Returns the key used.
 */
export async function uploadToS3(
  key: string,
  content: object,
): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: JSON.stringify(content),
      ContentType: "application/json",
    }),
  );
  return key;
}

/**
 * Downloads and parses JSON content from S3. Returns null on any error.
 */
export async function downloadFromS3(key: string): Promise<object | null> {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
      }),
    );
    const body = await response.Body?.transformToString();
    return body ? JSON.parse(body) : null;
  } catch (error) {
    console.error(`Failed to download from S3 key "${key}":`, error);
    return null;
  }
}
