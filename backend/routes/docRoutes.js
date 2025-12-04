// // routes/docRoutes.js
// import express from "express";
// import document from "../models/document.js"; //change this acc to schema
// import User from "../models/user.js";
// import { authenticate } from "../middleware/authmiddleware.js";
// import upload from "../middleware/uploadmiddleware.js";

// const router = express.Router();
// router.post(
//   "/upload",
//   authenticate,
//   upload.fields([
//     { name: "AadhaarCardFront", maxCount: 1 },
//     { name: "AadhaarCardBack", maxCount: 1 },
//     { name: "PANCard", maxCount: 1 },
//   ]),
//   async (req, res) => {
//     try {
      


//       const UserId = req.user.id;

//       // Extract file URLs (from cloudinary)
//       let AadhaarCardFront = null;
//       let AadhaarCardBack = null;
//       let PANCard = null;
    

//       if (req.files && req.files.AadhaarCardFront && req.files.AadhaarCardFront[0]) {
//         AadhaarCardFrontURL = req.files.AadhaarCardFront[0].path;
//       }

//        if (req.files && req.files.AadhaarCardBack && req.files.AadhaarCardBack[0]) {
//         AadhaarCardBackURL = req.files.AadhaarCardBack[0].path;
//       }

//       if (req.files && req.files.PANCard && req.files.PANCard[0]) {
//         cetScoreCardURL = req.files.PANCard[0].path;
//       }
//       const getFilenameFromURL = (url, prefix) => {
//         const extension = url.split(".").pop().split("?")[0]; // handles .jpg?version=123
//         return `${prefix}.${extension}`;
//       };

//       const attachments = [];

//       if (AadhaarCardFrontURL) {
//         attachments.push({
//           filename: getFilenameFromURL(AadhaarCardFront, "Aadhaar_Card_Front"),
//           path: AadhaarCardFrontURL,
//         });
//       }

//       if (AadhaarCardBackURL) {
//         attachments.push({
//           filename: getFilenameFromURL(AadhaarCardBack, "Aadhaar_Card_Back"),
//           path: AadhaarCardBackURL,
//         });
//       }

//       const request = await document.create({
      
//         AadhaarCardFrontURL,
//         AadhaarCardBackURL,
//         PANCardURL,
//         UserId,
//       });

//         res.status(201).json({ message: "Documents uploaded successfully", request });





// routes/docRoutes.js
// import express from "express";
// import Document from "../models/doc.js";
// import { authenticate } from "../middleware/authmiddleware.js";
// import upload from "../middleware/uploadmiddleware.js";

// const router = express.Router();

// router.post(
//   "/upload",
//   authenticate,
//   upload.fields([
//     { name: "aadharFront", maxCount: 1 },
//     { name: "aadharBack", maxCount: 1 },
//     { name: "panFront", maxCount: 1 },
//   ]),
//   async (req, res) => {
//     try {
//       const userId = req.user.id;

//       let aadharFront = null;
//       let aadharBack = null;
//       let panFront = null;

//       if (req.files?.aadharFront?.[0]) {
//         aadharFront = req.files.aadharFront[0].path;
//       }

//       if (req.files?.aadharBack?.[0]) {
//         aadharBack = req.files.aadharBack[0].path;
//       }

//       if (req.files?.panFront?.[0]) {
//         panFront = req.files.panFront[0].path;
//       }

//       const documentData = await Document.findOneAndUpdate(
//         { userId },
//         {
//           aadharFront,
//           aadharBack,
//           panFront
//         },
//         { new: true, upsert: true }
//       );

//       return res.status(201).json({
//         message: "Documents uploaded successfully",
//         document: documentData,
//       });

//     } catch (error) {
//       console.error("Upload Error:", error);
//       return res.status(500).json({
//         message: "Error uploading documents",
//         error: error.message,
//       });
//     }
//   }
// );

// export default router;


import express from "express";
import { authenticate } from "../middleware/authmiddleware.js";
import upload from "../middleware/uploadmiddleware.js";
import { uploadDocuments } from "../controller/documentController.js";

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

export default router;

