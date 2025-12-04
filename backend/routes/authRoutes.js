import express from 'express';
import {
  signup,
  login,
  getMe
} from '../controller/authController.js';

import {authenticate} from '../middleware/authmiddleware.js';
import { auth } from 'google-auth-library';

const router = express.Router();

//  Route for manual signup
// Endpoint: POST /api/auth/signup
router.post('/signup', signup);

//  Route for manual login
// Endpoint: POST /api/auth/login
router.post('/login', login);

router.get('/me', authenticate, getMe); 

//  Route for Google OAuth login/signup
// Endpoint: POST /api/auth/google-auth
// router.post('/google-auth', googleAuth);

export default router; 