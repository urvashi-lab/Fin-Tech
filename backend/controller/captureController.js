import axios from "axios";
import VKYC from "../models/vkyc.js";

const FASTAPI_BASE = "https://prishaa-techfiesta-kyc.hf.space";

// VERIFY SELFIE
export const selfieverification = async (req, res) => {
    try {
        const userId = req.user.id;

        const doc = await VKYC.findOne({ userId });
        if (!doc) {
            return res.status(404).json({ 
                success: false, 
                message: "Frame not Found" 
            });
        }

        // Find the SELFIE check (most recent or first pending)
        const selfieCheck = doc.checks.find(c => c.type === "SELFIE");
        if (!selfieCheck) {
            return res.status(404).json({ 
                success: false, 
                message: "Selfie not captured" 
            });
        }

        console.log("CAPTURED SELFIE:", selfieCheck.imageUrl);

        const FAST_API_URL = `${FASTAPI_BASE}/detect/face`;

        const response = await axios.post(FAST_API_URL, {
            image_url: selfieCheck.imageUrl
        });

        console.log("FastAPI Response:", response.data);

        // Update DB → Verified (using correct MongoDB dot notation)
        await VKYC.findOneAndUpdate(
            { userId, "checks.type": "SELFIE" },
            {
                $set: {
                    "checks.$.status": "SUCCESS",
                    "checks.$.result": "Verified successfully",
                    "checks.$.updatedAt": new Date()
                }
            },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Selfie verified successfully",
            data: response.data
        });

    } catch (err) {
        console.log("ERROR:", err.response?.data || err.message);

        // FIX: Convert error object to string properly
        const errorMessage = typeof err.response?.data === 'object' 
            ? JSON.stringify(err.response.data) 
            : (err.response?.data || err.message || "Selfie verification failed");

        // Update DB → Rejected (using correct MongoDB dot notation)
        await VKYC.findOneAndUpdate(
            { userId: req.user.id, "checks.type": "SELFIE" },
            {
                $set: {
                    "checks.$.status": "FAILED",
                    "checks.$.result": errorMessage,
                    "checks.$.updatedAt": new Date()
                }
            }
        );

        return res.status(500).json({
            success: false,
            message: err.response?.data?.error || err.message || "Selfie verification failed"
        });
    }
}

export default selfieverification;