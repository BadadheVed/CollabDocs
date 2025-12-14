import { Router } from "express";
import {
  createDocument,
  joinDocument,
  verifyToken,
  saveDocument,
} from "@/controllers/document.controller";

const docsRouter = Router();

docsRouter.post("/create", createDocument);
docsRouter.post("/join", joinDocument);
docsRouter.post("/verify-token", verifyToken);
docsRouter.post("/save", saveDocument);

export default docsRouter;
