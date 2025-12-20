import express from "express";
import axios from "axios";
import authenticate from "../middleware/authmiddleware.js";
import { aadharverification , panverification } from "../controller/kycController.js";

const router = express.Router();

// VERIFY AADHAAR BACK QR
router.post("/verify/aadhar/back", authenticate, aadharverification)

// VERIFY PAN CARD
router.post("/verify/pancard", authenticate, panverification);
    
export default router;
