
import express from "express";
import { authenticate } from "../middleware/authmiddleware.js";
import upload from "../middleware/uploadmiddleware.js";
import { uploadDocuments, getDocuments } from "../controller/documentController.js";

const router = express.Router();

router.post(
  "/upload",
  authenticate,
  upload.fields([
    { name: "aadharFront", maxCount: 1 },
    { name: "aadharBack", maxCount: 1 },
    { name: "panFront", maxCount: 1 },
  ]),
  uploadDocuments
);
router.get(
  "/",
  authenticate,
  getDocuments
);

export default router;

