import express, { Request, Response } from "express";
import multer from "multer";
import jwt from "jsonwebtoken";
import { generateMediaKey, uploadMediaToS3, streamMediaFromS3 } from "@/utils/s3";

const router = express.Router();
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

router.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      (authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null) ?? (req.body as any)?.token;

    if (!token) {
      return res.status(401).json({ message: "Missing token" });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }

    const file = (req as any).file as Express.Multer.File;
    if (!file) {
      return res.status(400).json({ message: "No image file uploaded" });
    }

    const key = generateMediaKey(decoded.documentId, file.originalname);
    await uploadMediaToS3(key, file.buffer, file.mimetype);

    const backendUrl =
      process.env.BACKEND_URL ||
      `http://localhost:${process.env.PORT || 8080}`;
    const url = `${backendUrl}/media/${key}`;

    return res.status(201).json({ key, url });
  } catch (err: any) {
    console.error("Media upload error:", err);
    return res.status(500).json({ message: "Upload failed" });
  }
});

router.get("/*", async (req: Request, res: Response) => {
  const key = (req.params as any)[0];
  if (!key) {
    return res.status(400).json({ message: "Missing media key" });
  }

  try {
    const { body, contentType } = await streamMediaFromS3(key);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    body.pipe(res);
  } catch (err: any) {
    if (
      err.name === "NoSuchKey" ||
      err.$metadata?.httpStatusCode === 404
    ) {
      return res.status(404).json({ message: "Media not found" });
    }
    console.error("Media fetch error:", err);
    return res.status(500).json({ message: "Failed to fetch media" });
  }
});

export default router;
