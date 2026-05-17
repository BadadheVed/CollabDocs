import { Request, Response } from "express";
import { randomUUID } from "crypto";
import MongoDBClient, { MongoDocument } from "@/client/db";
import { generateRoomCode, generatePin } from "@/utils/codes";
import jwt from "jsonwebtoken";
import { generateS3Key, uploadToS3, downloadFromS3 } from "@/utils/s3";
import {
  getCachedContent,
  setCachedContent,
  addDocParticipant,
  getDocParticipants,
  addUserSession,
  getUserSessions,
  hasUserAccess,
  getUserSessionMeta,
} from "@/utils/redis";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

const isProduction = process.env.NODE_ENV === "production";

function ensureUserToken(req: Request, res: Response): string {
  const existing = (req as any).cookies?.collabdocs_user_token;
  if (existing) return existing;
  const token = randomUUID();
  res.cookie("collabdocs_user_token", token, {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: 10 * 365 * 24 * 60 * 60 * 1000,
    path: "/",
  });
  return token;
}

export const createDocument = async (req: Request, res: Response) => {
  try {
    const { title, name } = req.body as { title: string; name?: string };

    if (!title) {
      return res.status(400).json({ message: "Missing title" });
    }

    const userToken = ensureUserToken(req, res);
    const id = randomUUID();
    const docId = parseInt(generateRoomCode());
    const pin = parseInt(generatePin());
    const baseURL = process.env.FRONTEND_URL || "http://localhost:3000";
    const now = new Date();

    const db = await MongoDBClient.getInstance();
    await db.updateOne(
      "documents",
      { _id: id },
      {
        $set: {
          _id: id,
          title,
          docId,
          pin,
          s3Path: null,
          createdAt: now,
          updatedAt: now,
        },
      },
      true,
    );

    const joinLink = `${baseURL}/join?docId=${docId}`;

    const token = jwt.sign(
      { documentId: id, docId, pin, title },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    if (name) await addDocParticipant(id, name);
    const participants = await getDocParticipants(id);
    await addUserSession(userToken, id, { title, docId, participants });

    return res.status(201).json({
      message: "Document created successfully",
      id,
      docId,
      pin,
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

    const userToken = ensureUserToken(req, res);

    const db = await MongoDBClient.getInstance();
    const document = await db.getOne<MongoDocument>("documents", {
      docId,
      pin,
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const token = jwt.sign(
      {
        documentId: document._id,
        docId,
        pin,
        title: document.title,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    if (name) await addDocParticipant(document._id, name);
    const participants = await getDocParticipants(document._id);
    await addUserSession(userToken, document._id, {
      title: document.title,
      docId,
      participants,
    });

    return res.status(200).json({
      message: "Document ready to join",
      id: document._id,
      title: document.title,
      token,
      s3Path: document.s3Path,
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

      const db = await MongoDBClient.getInstance();
      const document = await db.getOne<MongoDocument>("documents", {
        _id: decoded.documentId,
      });

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      return res.status(200).json({
        message: "Token valid",
        id: document._id,
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
    const { token, content } = req.body as { token: string; content: any };

    if (!token) {
      return res.status(400).json({ message: "Missing token" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      const s3Key = generateS3Key(decoded.title, decoded.documentId);
      await uploadToS3(s3Key, { content });

      const now = new Date();
      const db = await MongoDBClient.getInstance();
      await db.updateOne(
        "documents",
        { _id: decoded.documentId },
        { $set: { s3Path: s3Key, updatedAt: now } },
      );

      await setCachedContent(decoded.documentId, content);

      return res.status(200).json({
        message: "Document saved successfully",
        id: decoded.documentId,
        title: decoded.title,
        savedAt: now,
        s3Path: s3Key,
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

      const cached = await getCachedContent(decoded.documentId);
      if (cached && cached.length > 0) {
        return res.status(200).json({ source: "redis", content: cached });
      }

      const db = await MongoDBClient.getInstance();
      const document = await db.getOne<MongoDocument>("documents", {
        _id: decoded.documentId,
      });

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      if (document.s3Path) {
        const s3Data = await downloadFromS3(document.s3Path);
        if (s3Data) {
          const content = (s3Data as any).content ?? null;
          if (content) await setCachedContent(decoded.documentId, content);
          return res.status(200).json({ source: "s3", content });
        }
      }

      return res.status(200).json({ source: "none", content: null });
    } catch (jwtError) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  } catch (error) {
    console.error("Error loading document:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getSessions = async (req: Request, res: Response) => {
  try {
    const userToken = (req as any).cookies?.collabdocs_user_token;
    if (!userToken) return res.status(200).json({ sessions: [] });
    const sessions = await getUserSessions(userToken);
    return res.status(200).json({ sessions });
  } catch {
    return res.status(200).json({ sessions: [] });
  }
};

export const getSessionToken = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const userToken = (req as any).cookies?.collabdocs_user_token;
    if (!userToken) return res.status(403).json({ message: "No user token" });

    const access = await hasUserAccess(userToken, documentId);
    if (!access) return res.status(403).json({ message: "No access" });

    const meta = await getUserSessionMeta(userToken, documentId);
    if (!meta || meta.docId == null || !meta.title) {
      return res.status(409).json({ message: "Session metadata unavailable" });
    }

    const token = jwt.sign(
      { documentId, docId: meta.docId, title: meta.title },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    return res.status(200).json({ token });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};
