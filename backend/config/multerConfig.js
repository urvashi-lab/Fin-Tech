import multer from 'multer';
import path from 'path';


// File filter (accept only image )
function fileFilter(req, file, cb) {
  const allowedTypes = ['.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
}

const upload = multer({ fileFilter });

export default upload;
