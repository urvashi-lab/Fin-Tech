import { cloudinary } from "../config/cloudinary.js";

export const uploadBase64Image = async (base64, folderPath) => {
  return await cloudinary.uploader.upload(base64, {
    folder: folderPath,
    resource_type: "image"
  });
};
