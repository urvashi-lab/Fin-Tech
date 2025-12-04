import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import docRoutes from './routes/docRoutes.js';
import personalInfoRoutes from './routes/personalInfoRoutes.js'; // ✅ ADD THIS

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());  
app.use(express.urlencoded({ limit: '50mb', extended: true })); 

connectDB();

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use('/api/auth', authRoutes);
app.use('/api/document', docRoutes);
app.use('/api', personalInfoRoutes); // ✅ ADD THIS

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});