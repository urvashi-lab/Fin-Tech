import Document from "../models/doc.js";

const uploadDocuments = async (req, res) => {
  try {
    const userId = req.user.id;

    // Extract file paths from uploaded files
    let aadharFront = null;
    let aadharBack = null;
    let panFront = null;

    if (req.files?.aadharFront?.[0]) {
      aadharFront = req.files.aadharFront[0].path;
    }

    if (req.files?.aadharBack?.[0]) {
      aadharBack = req.files.aadharBack[0].path;
    }

    if (req.files?.panFront?.[0]) {
      panFront = req.files.panFront[0].path;
    }

    // Extract text fields from request body
    const { aadharNumber, panNumber, issueDate } = req.body;

    // Validate required text fields
    if (!aadharNumber || !panNumber || !issueDate) {
      return res.status(400).json({
        message: "Missing required fields",
        error: "aadharNumber, panNumber, and issueDate are required"
      });
    }

    // Prepare update data - only include fields that are provided
    const updateData = {
      aadharNumber: aadharNumber.trim(),
      panNumber: panNumber.trim().toUpperCase(),
      issueDate: new Date(issueDate)
    };

    // Only update file paths if new files were uploaded
    if (aadharFront) updateData.aadharFront = aadharFront;
    if (aadharBack) updateData.aadharBack = aadharBack;
    if (panFront) updateData.panFront = panFront;

    // Find and update document, or create if doesn't exist
    const documentData = await Document.findOneAndUpdate(
      { userId },
      updateData,
      { 
        new: true,        // Return the updated document
        upsert: true,     // Create if doesn't exist
        runValidators: true  // Run schema validators
      }
    );

    return res.status(201).json({
      message: "Documents uploaded successfully",
      document: {
        aadharFront: documentData.aadharFront,
        aadharBack: documentData.aadharBack,
        panFront: documentData.panFront,
        aadharNumber: documentData.aadharNumber,
        panNumber: documentData.panNumber,
        issueDate: documentData.issueDate,
        createdAt: documentData.createdAt,
        updatedAt: documentData.updatedAt
      }
    });

  } catch (error) {
    console.error("Upload Error:", error);

    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Validation error",
        error: error.message,
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    return res.status(500).json({
      message: "Error uploading documents",
      error: error.message
    });
  }
};

const getDocuments = async (req, res) => {
  try {
    const userId = req.user.id;

    const documentData = await Document.findOne({ userId });

    if (!documentData) {
      return res.status(404).json({
        message: "No documents found for this user"
      });
    }

    return res.status(200).json({
      success: true,
      document: {
        aadharFront: documentData.aadharFront,
        aadharBack: documentData.aadharBack,
        panFront: documentData.panFront,
        aadharNumber: documentData.aadharNumber,
        panNumber: documentData.panNumber,
        issueDate: documentData.issueDate,
        createdAt: documentData.createdAt,
        updatedAt: documentData.updatedAt
      }
    });

  } catch (error) {
    console.error("Get Documents Error:", error);
    return res.status(500).json({
      message: "Error fetching documents",
      error: error.message
    });
  }
};

// At the bottom of documentController.js
export { uploadDocuments, getDocuments };