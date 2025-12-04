import User from '../models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import authenticate from '../middleware/authmiddleware.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

//  Generate your custom JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '1d'
  });
};

//  Manual Signup
export const signup = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body || {};

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      isGoogleUser: false
    });

    const token = generateToken(user._id);
    // res.status(201).json({ user, token });
    res.status(201).json({
  token,
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,

  }
});


  } catch (err) {
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
};

//  Manual Login
export const login = async (req, res) => {
  console.log('[BACKEND-LOGIN] ========== New Login Request ==========');
  console.log('[BACKEND-LOGIN] Request body:', { 
    email: req.body?.email,
    password: req.body?.password ? '***' : 'missing' 
  });

  const { email, password } = req.body;

  try {
    // Validation
    if (!email || !password) {
      console.error('[BACKEND-LOGIN] Missing credentials:', {
        email: !!email,
        password: !!password
      });
      return res.status(400).json({ 
        message: "Email and password are required",
        missing: {
          email: !email,
          password: !password
        }
      });
    }

    console.log('[BACKEND-LOGIN] Looking up user with email:', email);
    const user = await User.findOne({ email });

    if (!user) {
      console.warn('[BACKEND-LOGIN] User not found with email:', email);
      console.log('[BACKEND-LOGIN] Checking all users in database...');
      const allUsers = await User.find({}, 'email');
      console.log('[BACKEND-LOGIN] All user emails:', allUsers.map(u => u.email));
      return res.status(400).json({ message: "User not found" });
    }

    console.log('[BACKEND-LOGIN] User found:', {
      id: user._id,
      email: user.email,
      name: user.name,
      isGoogleUser: user.isGoogleUser,
      hasPassword: !!user.password
    });

    if (user.isGoogleUser) {
      console.warn('[BACKEND-LOGIN] Google user attempted manual login');
      return res.status(403).json({ message: "You signed up with Google. Please login using Google." });
    }

    console.log('[BACKEND-LOGIN] Comparing passwords...');
    console.log('[BACKEND-LOGIN] Stored password hash (first 20 chars):', user.password?.substring(0, 20));
    console.log('[BACKEND-LOGIN] Input password length:', password.length);
    
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('[BACKEND-LOGIN] Password match result:', isMatch);

    if (!isMatch) {
      console.warn('[BACKEND-LOGIN] Invalid password for user:', email);
      console.log('[BACKEND-LOGIN] Password comparison failed');
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log('[BACKEND-LOGIN] Password matched successfully! Generating token...');
    const token = generateToken(user._id);
    console.log('[BACKEND-LOGIN] Token generated successfully');

    const responseData = {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      }
    };

    console.log('[BACKEND-LOGIN] Sending success response:', {
      userId: responseData.user.id,
      userName: responseData.user.name,
      userEmail: responseData.user.email,
      tokenPresent: !!token
    });

    res.status(200).json(responseData);
    console.log('[BACKEND-LOGIN] ========== Login Completed Successfully ==========');

  } catch (err) {
    console.error('[BACKEND-LOGIN] ========== ERROR OCCURRED ==========');
    console.error('[BACKEND-LOGIN] Error type:', err.name);
    console.error('[BACKEND-LOGIN] Error message:', err.message);
    console.error('[BACKEND-LOGIN] Stack trace:', err.stack);
    
    res.status(500).json({ message: "Login failed", error: err.message });
    console.log('[BACKEND-LOGIN] ========== Error Response Sent ==========');
  }
};
// Add this to your auth controller file

export const getMe = async (req, res) => {
  console.log('[BACKEND-GETME] ========== Get User Data Request ==========');
  console.log('[BACKEND-GETME] User ID from token:', req.user.id);
  
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      console.error('[BACKEND-GETME] User not found');
      return res.status(404).json({ message: "User not found" });
    }
    
    console.log('[BACKEND-GETME] User found:', {
      id: user._id,
      email: user.email,
      name: user.name
    });
    
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
    
    console.log('[BACKEND-GETME] ========== Request Completed Successfully ==========');
  } catch (err) {
    console.error('[BACKEND-GETME] ========== ERROR ==========');
    console.error('[BACKEND-GETME] Error:', err.message);
    console.error('[BACKEND-GETME] Stack:', err.stack);
    res.status(500).json({ message: "Failed to fetch user data", error: err.message });
  }
};

