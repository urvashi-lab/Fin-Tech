import express from 'express';
import { getPersonalInfo, updatePersonalInfo } from '../controller/personalInfoController.js';
import authenticate from '../middleware/authmiddleware.js';

const router = express.Router();

// Get personal info
router.get('/personal-info', authenticate, getPersonalInfo);

// Update personal info
router.post('/personal-info', authenticate, updatePersonalInfo);

export default router;