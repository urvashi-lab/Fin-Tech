import axios from "axios";
import FormData from "form-data";
import fetch from "node-fetch";
import Document from "../models/doc.js";

const FASTAPI_BASE = "https://prishaa-techfiesta-kyc.hf.space";

export const aadharverification=async (req, res) => {
    try {
        const { userId } = req.params;

        // 1. Fetch documents from MongoDB
        const doc = await Document.findOne({ userId });

        if (!doc) {
            return res.status(404).json({
                status: "error",
                message: "Documents not found"
            });
        }

        console.log(" Aadhaar Back URL:", doc.aadharBack);

        // 2. Send request to FAST API
        const FAST_API_URL = "https://prishaa-techfiesta-kyc.hf.space/aadhaar/detect_qr";

        const response = await axios.post(FAST_API_URL, {
            image_url: doc.aadharBack
        });

        console.log(" FastAPI Response:", response.data);

        // 3. Send response back to frontend
        return res.status(200).json({
            status: "success",
            data: response.data
        });

    } catch (err) {
        console.log(" ERROR:", err.response?.data || err.message);

        return res.status(500).json({
            status: "error",
            message: err.response?.data || err.message
        });
    }
}



// VERIFY PAN CARD
    
export const panverification=async (req, res) => {
    try {
        const { userId } = req.params;

        // 1. Fetch documents from MongoDB
        const doc = await Document.findOne({ userId });

        if (!doc) {
            return res.status(404).json({
                status: "error",
                message: "Documents not found"
            });
        }

        console.log(" PAN Card URL:", doc.panFront);

        // 2. Send request to FAST API
        const FAST_API_URL = "https://prishaa-techfiesta-kyc.hf.space/process/pancard";

        const response = await axios.post(FAST_API_URL, {
            image_url: doc.panFront
        });

        console.log(" FastAPI Response:", response.data);

        // 3. Send response back to frontend
        return res.status(200).json({
            status: "success",
            data: response.data
        });

    } catch (err) {
        console.log(" ERROR:", err.response?.data || err.message);

        return res.status(500).json({
            status: "error",
            message: err.response?.data || err.message
        });
    }
}





