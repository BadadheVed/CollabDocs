import { Request, Response } from "express";
import prisma from "@/client/db";
import { generateRoomCode, generatePin } from "@/utils/codes";

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

    return res.status(201).json({
      message: "Document created successfully",
      id: document.id,
      docId: document.docId,
      pin: document.pin,
      joinLink,
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

    return res.status(200).json({
      message: "Document ready to join",
      id: document.id,
      title: document.title,
    });
  } catch (error) {
    console.error("Error joining document:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
