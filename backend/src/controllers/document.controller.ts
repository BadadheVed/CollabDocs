import { Request, Response } from "express";
import prisma from "@/client/db";
import { generateRoomCode, generatePin } from "@/utils/codes";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export const createDocument = async (req: Request, res: Response) => {
  try {
    const { title } = req.body as { title: string };

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
      { expiresIn: "7d" }
    );

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
    const { docId, pin } = req.body as { docId: number; pin: number };

    if (!docId || !pin) {
      return res.status(400).json({ message: "Missing document ID or pin" });
    }

    const document = await prisma.document.findFirst({
      where: { docId, pin },
      select: { id: true, title: true },
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
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Document ready to join",
      id: document.id,
      title: document.title,
      token,
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

      // Update document content
      const document = await prisma.document.update({
        where: { id: decoded.documentId },
        data: { Content: content },
        select: { id: true, title: true, updatedAt: true },
      });

      return res.status(200).json({
        message: "Document saved successfully",
        id: document.id,
        title: document.title,
        savedAt: document.updatedAt,
      });
    } catch (jwtError) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  } catch (error) {
    console.error("Error saving document:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
