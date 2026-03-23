import VKYC from "../models/vkyc.js";
import { uploadBase64Image } from "../middleware/capturemiddleware.js";
import LandmarkSession from "../models/LandmarkSession.js";
import axios from "axios";


export const captureFrame = async (req, res) => {
  try {
    const { userId, captureType, imageBase64 } = req.body;
    //Added later

    if (!userId || !captureType || !imageBase64) {
      return res.status(400).json({ message: "Missing required fields" });
    }
     if (
      imageBase64 === "data:," ||
      imageBase64.length < 100 ||
      !imageBase64.startsWith("data:image")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid image data — frame not ready"
      })
    }

    const folder = {
      SELFIE: "LiveCaptures/Selfie",
      PAN: "LiveCaptures/PAN",
      AADHAAR: "LiveCaptures/Aadhaar",
      AADHAAR_BACK: "LiveCaptures/AadhaarBack"
    }[captureType];

    if (!folder) {
      return res.status(400).json({ message: "Invalid capture type" });
    }

    // Upload base64 image to Cloudinary
    const uploadResult = await uploadBase64Image(imageBase64, folder);

    // Prepare check entry
    const check = {
      type: captureType,
      imageUrl: uploadResult.secure_url,
      status: "PENDING",
      result: null,
      updatedAt: new Date()
    };

    // Upsert VKYC document
    const vkyc = await VKYC.findOneAndUpdate(
      { userId },
      { $push: { checks: check } },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      status: "success",
      imageUrl: uploadResult.secure_url,
      vkycId: vkyc._id
    });

  } catch (err) {
    console.error("Video KYC capture error:", err);
    return res.status(500).json({
      status: "error",
      message: err.message
    });
  }
};


// // Endpoint to receive landmark data from client
// export const storeLandmarks = async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { vkycId, frames } = req.body

//     // Basic validation
//     if (!vkycId || !frames || !Array.isArray(frames)) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields: vkycId and frames array required"
//       })
//     }

//     if (frames.length < 10) {
//       return res.status(400).json({
//         success: false,
//         message: "Insufficient frames — minimum 10 required"
//       })
//     }

//     // Store landmarks in landmark_sessions collection
//     const landmarkSession = await LandmarkSession.create({
//       userId,
//       vkycId,
//       passive: frames
//     })

//     // Update vkycs.liveness.landmarkSessionId
//     await VKYC.findByIdAndUpdate(
//       vkycId,
//       {
//         $set: {
//           "liveness.landmarkSessionId": landmarkSession._id
//         }
//       },
//       { new: true }
//     )

//     return res.status(200).json({
//       success:            true,
//       message:            "Landmarks stored successfully",
//       landmarkSessionId:  landmarkSession._id
//     })

//   } catch (err) {
//     console.error("Landmark storage error:", err)
//     return res.status(500).json({
//       success: false,
//       message: err.message || "Failed to store landmarks"
//     })
//   }
// }

export const storePassiveLivenessScore = async (req, res) => {
  try {
    const userId = req.user.id
    const { passive_score, signal_scores, flags, status } = req.body

    if (passive_score === undefined || passive_score === null) {
      return res.status(400).json({
        success: false,
        message: "passive_score is required"
      })
    }

    await VKYC.findOneAndUpdate(
      { userId },
      {
        $set: {
          "liveness.passiveScore": passive_score,
          "liveness.passiveFlags": flags || []
        }
      },
      { upsert: true, new: true }
    )

    return res.status(200).json({
      success: true,
      message: "Passive liveness score stored"
    })

  } catch (err) {
    console.error("Passive liveness storage error:", err)
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to store passive liveness score"
    })
  }
}

//Activeliveness and composite scoring
export const storeActiveLivenessResult = async (req, res) => {
  try {
    const userId = req.user.id
    const { taskResults, overallPassed, averageScore } = req.body  // ← add averageScore

    if (!taskResults || !Array.isArray(taskResults) || taskResults.length === 0) {
      return res.status(400).json({
        success: false,
        message: "taskResults array is required"
      })
    }

    if (averageScore === undefined || averageScore === null) {
      return res.status(400).json({
        success: false,
        message: "averageScore is required"
      })
    }

    // ── Step 1: Use averageScore directly ──────────────────────────────
    const activeScore = Math.round(averageScore * 10000) / 10000  // ← no calculation needed

    const challengeTypes = taskResults.map(t => t.taskId)

    // ── Step 2: Fetch passiveScore from DB ─────────────────────────────
    const vkyc = await VKYC.findOne({ userId })

    if (!vkyc) {
      return res.status(404).json({
        success: false,
        message: "VKYC session not found — passive check may not have run"
      })
    }

    const passiveScore = vkyc.liveness?.passiveScore ?? 0

    // ── Step 3: Calculate compositeScore ───────────────────────────────
    const compositeScore = Math.round(
      ((passiveScore * 0.4) + (activeScore * 0.6))
      * 10000
    ) / 10000

    // ── Step 4: Determine overall liveness status ──────────────────────
    let livenessStatus = "FAIL"
    if (compositeScore >= 0.70)      livenessStatus = "PASS"
    else if (compositeScore >= 0.50) livenessStatus = "FLAGGED"

    // ── Step 5: Combine flags ──────────────────────────────────────────
    const passiveFlags = vkyc.liveness?.passiveFlags || []
    const activeFlags  = taskResults
      .filter(t => !t.passed)
      .map(t => `${t.taskId}_failed`)
    const combinedFlags = [...passiveFlags, ...activeFlags]

    // ── Step 6: Update vkycs ───────────────────────────────────────────
    await VKYC.findOneAndUpdate(
      { userId },
      {
        $set: {
          "liveness.activeScore":    activeScore,
          "liveness.challengeTypes": challengeTypes,
          "liveness.taskResults":    taskResults,
          "liveness.compositeScore": compositeScore,
          "liveness.status":         livenessStatus,
          "liveness.flags":          combinedFlags,
          "finalStatus":             "UNDER_REVIEW"
        }
      },
      { new: true }
    )

    // ── Step 7: Return to React ────────────────────────────────────────
    return res.status(200).json({
      success:       true,
      message:       "Active liveness stored and composite score calculated",
      activeScore,
      passiveScore,
      compositeScore,
      livenessStatus,
      overallPassed: livenessStatus !== "FAIL",
      flags:         combinedFlags
    })

  } catch (err) {
    console.error("Active liveness error:", err)
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to store active liveness result"
    })
  }
}

