
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    let folderName = 'KYC';
    if (file.fieldname === 'aadharFront') {
      folderName = 'KYC/AadhaarCardFront';
    } 
    else if (file.fieldname === 'aadharBack') {
      folderName = 'KYC/AadhaarCardBack';
    }
    else if (file.fieldname === 'panFront') {
      folderName = 'KYC/PANCard';
    }
   

    return {
      folder: folderName,
      allowed_formats: ['jpg', 'jpeg', 'png'],
      public_id: `${file.fieldname}-${Date.now()}-${file.originalname}`,
      resource_type: 'image',
    };
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, png, webp) are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export default upload;

