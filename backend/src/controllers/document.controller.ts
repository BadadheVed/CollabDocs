import { Request, Response } from "express";
import prisma from "@/client/db";
import { generateRoomCode, generatePin } from "@/utils/codes";
import jwt from "jsonwebtoken";
import { generateS3Key, uploadToS3, downloadFromS3 } from "@/utils/s3";
import {
  getCachedContent,
  setCachedContent,
  addDocParticipant,
  getDocParticipants,
  setDocToken,
} from "@/utils/redis";
import { checkPrime } from "crypto";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export const createDocument = async (req: Request, res: Response) => {
  try {
    const { title, name } = req.body as { title: string; name?: string };

    if (!title) {
      return res.status(400).json({ message: "Missing title" });
    }

    const docId = parseInt(generateRoomCode());
    const pin = parseInt(generatePin());
    const baseURL = process.env.FRONTEND_URL || "http://localhost:3000";

    const document = await prisma.document.create({
      data: {
        title,
        docId,
        pin,
        Content: "",
      },
      select: {
        id: true, // UUID (used for WebSocket room)
        title: true,
        docId: true, // 9-digit numeric code
        pin: true, // 4-digit access code
        createdAt: true,
      },
    });

    const joinLink = `${baseURL}/join?docId=${document.docId}`;

    // Generate JWT token for document access
    const token = jwt.sign(
      {
        documentId: document.id,
        docId: document.docId,
        pin: document.pin,
        title: document.title,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    await setDocToken(document.id, token);
    if (name) await addDocParticipant(document.id, name);

    return res.status(201).json({
      message: "Document created successfully",
      id: document.id,
      docId: document.docId,
      pin: document.pin,
      joinLink,
      token,
    });
  } catch (err) {
    console.error("Error creating document:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const joinDocument = async (req: Request, res: Response) => {
  try {
    const { docId, pin, name } = req.body as {
      docId: number;
      pin: number;
      name?: string;
    };

    if (!docId || !pin) {
      return res.status(400).json({ message: "Missing document ID or pin" });
    }

    const document = await prisma.document.findFirst({
      where: { docId, pin },
      select: { id: true, title: true, s3Path: true },
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Generate JWT token for document access
    const token = jwt.sign(
      {
        documentId: document.id,
        docId: docId,
        pin: pin,
        title: document.title,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    await setDocToken(document.id, token);
    if (name) await addDocParticipant(document.id, name);

    return res.status(200).json({
      message: "Document ready to join",
      id: document.id,
      title: document.title,
      token,
      s3Path: document.s3Path, // null for new docs, key string for saved docs
    });
  } catch (error) {
    console.error("Error joining document:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body as { token: string };

    if (!token) {
      return res.status(400).json({ message: "Missing token" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      // Verify document still exists
      const document = await prisma.document.findUnique({
        where: { id: decoded.documentId },
        select: { id: true, title: true, docId: true },
      });

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      return res.status(200).json({
        message: "Token valid",
        id: document.id,
        title: document.title,
        docId: document.docId,
      });
    } catch (jwtError) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const saveDocument = async (req: Request, res: Response) => {
  try {
    const { token, content } = req.body as { token: string; content: string };

    if (!token) {
      return res.status(400).json({ message: "Missing token" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      // Generate S3 key: <title>-<first-5-chars-of-id>-<ddmm>
      const s3Key = generateS3Key(decoded.title, decoded.documentId);

      // Upload content JSON to S3
      await uploadToS3(s3Key, { content });

      // Update DB with content and s3Path
      const document = await prisma.document.update({
        where: { id: decoded.documentId },
        data: { Content: content, s3Path: s3Key },
        select: { id: true, title: true, updatedAt: true, s3Path: true },
      });

      // Populate Redis cache so next load is a cache hit (TTL: 7 days)
      await setCachedContent(decoded.documentId, content);

      return res.status(200).json({
        message: "Document saved successfully",
        id: document.id,
        title: document.title,
        savedAt: document.updatedAt,
        s3Path: document.s3Path,
      });
    } catch (jwtError) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  } catch (error) {
    console.error("Error saving document:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const loadDocument = async (req: Request, res: Response) => {
  try {
    const { token } = req.body as { token: string };

    if (!token) {
      return res.status(400).json({ message: "Missing token" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      // 1. Redis cache hit — fastest path
      const cached = await getCachedContent(decoded.documentId);
      if (cached && cached.length > 0) {
        return res.status(200).json({ source: "redis", content: cached });
      }

      // 2. Cache miss — check DB for s3Path
      const document = await prisma.document.findUnique({
        where: { id: decoded.documentId },
        select: { id: true, title: true, s3Path: true, Content: true },
      });

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      if (document.s3Path) {
        // 3. Fetch from S3, then backfill Redis (TTL: 7 days)
        const s3Data = await downloadFromS3(document.s3Path);
        if (s3Data) {
          const content = (s3Data as any).content ?? null;
          if (content) await setCachedContent(decoded.documentId, content);
          return res.status(200).json({ source: "s3", content });
        }
      }

      // 4. Fallback: DB content (document never saved to S3 yet)
      return res.status(200).json({ source: "db", content: document.Content });
    } catch (jwtError) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  } catch (error) {
    console.error("Error loading document:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getRecentDocs = async (req: Request, res: Response) => {
  try {
    const { tokens } = req.body as { tokens: string[] };

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(200).json({ docs: [] });
    }

    const docs = [];
    for (const token of tokens) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const participants = await getDocParticipants(decoded.documentId);
        docs.push({
          documentId: decoded.documentId,
          title: decoded.title,
          docId: decoded.docId,
          participants,
        });
      } catch {
        // Invalid / expired token — skip
      }
    }

    return res.status(200).json({ docs });
  } catch (error) {
    console.error("Error fetching recent docs:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
