import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/mongodb.js';
import userRouter from './routes/userRoutes.js';
import imageRouter from './routes/imageRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet());

// Basic rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// JSON parsing with size limit
app.use(express.json({ limit: '1mb' }));

// CORS - allow specific client if provided
if (process.env.CLIENT_URL) {
  app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
} else {
  app.use(cors());
}

connectDB();

app.use('/api/user', userRouter);
app.use('/api/image', imageRouter);
app.get('/', (req, res) => {
  res.send('API working');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});