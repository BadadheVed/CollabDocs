import { Router } from "express";
import {
  createDocument,
  joinDocument,
  verifyToken,
  saveDocument,
  loadDocument,
  getRecentDocs,
} from "@/controllers/document.controller";

const docsRouter = Router();

docsRouter.post("/create", createDocument);
docsRouter.post("/join", joinDocument);
docsRouter.post("/verify-token", verifyToken);
docsRouter.post("/save", saveDocument);
docsRouter.post("/load", loadDocument);
docsRouter.post("/recents", getRecentDocs);

export default docsRouter;
