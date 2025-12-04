import Document from "../models/doc.js";


export const uploadDocuments = async (req, res) => {
  try {
    const userId = req.user.id;

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

    const documentData = await Document.findOneAndUpdate(
      { userId },
      {
        aadharFront,
        aadharBack,
        panFront,
      },
      { new: true, upsert: true }
    );

    return res.status(201).json({
      message: "Documents uploaded successfully",
      document: documentData,
    });

  } catch (error) {
    console.error("Upload Error:", error);
    return res.status(500).json({
      message: "Error uploading documents",
      error: error.message,
    });
  }
};
export default uploadDocuments;