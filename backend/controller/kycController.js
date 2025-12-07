
import axios from "axios";
import Document from "../models/doc.js";
import Result from "../models/result.js";

const FASTAPI_BASE = "https://prishaa-techfiesta-kyc.hf.space";



// VERIFY AADHAAR
export const aadharverification = async (req, res) => {
    try {
        const { userId } = req.params;

        const doc = await Document.findOne({ userId });
        if (!doc) {
            return res.status(404).json({ status: "error", message: "Documents not found" });
        }

        console.log("Aadhaar Back URL:", doc.aadharBack);

        const FAST_API_URL = `${FASTAPI_BASE}/aadhaar/detect_qr`;

        const response = await axios.post(FAST_API_URL, {
            image_url: doc.aadharBack
        });

        console.log("FastAPI Response:", response.data);

        // Update DB → Verified
        await Result.findOneAndUpdate(
            { userId },
            {
                $set: {
                    aadharVerificationStatus: "Verified",
                    aadharCheckResult:"Verified successfully"
                }
            },
            { upsert: true, new: true }
        );

        return res.status(200).json({
            status: "success",
            data: response.data
        });

    } catch (err) {
        console.log("ERROR:", err.response?.data || err.message);

        // Update DB → Rejected
        await Result.findOneAndUpdate(
            { userId: req.params.userId },
            {
                $set: {
                    aadharVerificationStatus: "Rejected",
                    aadharCheckResult: err.response?.data || err.message
                }
            },
            { upsert: true }
        );

        return res.status(500).json({
            status: "error",
            message: err.response?.data || err.message
        });
    }
};




// VERIFY PAN

export const panverification = async (req, res) => {
    try {
        const { userId } = req.params;

        const doc = await Document.findOne({ userId });
        if (!doc) {
            return res.status(404).json({ status: "error", message: "Documents not found" });
        }

        console.log("PAN Front URL:", doc.panFront);

        const FAST_API_URL = `${FASTAPI_BASE}/process/pancard`;

        const response = await axios.post(FAST_API_URL, {
            image_url: doc.panFront
        });

        console.log("FastAPI Response:", response.data);

        // Update DB → Verified
        await Result.findOneAndUpdate(
            { userId },
            {
                $set: {
                    panVerificationStatus: "Verified",
                    panCheckResult: "Verified successfully"
                }
            },
            { upsert: true, new: true }
        );

        return res.status(200).json({
            status: "success",
            data: response.data
        });

    } catch (err) {
        console.log("ERROR:", err.response?.data || err.message);

        // Update DB → Rejected
        await Result.findOneAndUpdate(
            { userId: req.params.userId },
            {
                $set: {
                    panVerificationStatus: "Rejected",
                    panCheckResult: err.response?.data || err.message
                }
            },
            { upsert: true }
        );

        return res.status(500).json({
            status: "error",
            message: err.response?.data || err.message
        });
    }
};




