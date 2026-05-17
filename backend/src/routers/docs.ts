import { Router } from "express";
import {
  createDocument,
  joinDocument,
  verifyToken,
  saveDocument,
  loadDocument,
  getRecentDocs,
  getSessions,
  getSessionToken,
} from "@/controllers/document.controller";

const docsRouter = Router();

docsRouter.post("/create", createDocument);
docsRouter.post("/join", joinDocument);
docsRouter.post("/verify-token", verifyToken);
docsRouter.post("/save", saveDocument);
docsRouter.post("/load", loadDocument);
docsRouter.post("/recents", getRecentDocs);
docsRouter.get("/sessions", getSessions);
docsRouter.get("/sessions/:documentId/token", getSessionToken);

export default docsRouter;
