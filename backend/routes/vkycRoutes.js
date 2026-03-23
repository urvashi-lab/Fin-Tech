import express from "express";
import { authenticate } from "../middleware/authmiddleware.js";
import { 
  captureFrame,
  storePassiveLivenessScore,
  storeActiveLivenessResult
} from "../controller/videokycController.js";

import  {selfieverification as verifyVKYCCheck} from "../controller/captureController.js";
// import { storeLandmarks } from "../controller/videokycController.js";


const router = express.Router();

router.post("/capture", authenticate, captureFrame);


router.post(
  "/verify-check",
  authenticate,
  verifyVKYCCheck
);


// router.post("/liveness/landmarks", authenticate, storeLandmarks);
router.post("/liveness/passive", authenticate, storePassiveLivenessScore);
router.post("/liveness/active", authenticate, storeActiveLivenessResult);

export default router;