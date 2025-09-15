import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import supplierRoutes from './routes/supplier';
import invoiceRoutes from './routes/invoice';
import aresRoutes from './routes/ares';
import customerRoutes from './routes/customer';
import { requireAuth } from './middleware/auth';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Auth routes
app.use('/api/v1/auth', authRoutes);

// Supplier routes (protected)
app.use('/api/v1/supplier', requireAuth, supplierRoutes);

// Invoice routes (protected)
app.use('/api/v1/invoices', requireAuth, invoiceRoutes);

// ARES routes (protected)
app.use('/api/v1/ares', requireAuth, aresRoutes);

// Customer routes (protected)
app.use('/api/v1/customers', requireAuth, customerRoutes);

// Protected route example
app.get('/api/v1/me', requireAuth, async (req: Request, res: Response) => {
  res.json({ userId: req.userId, message: 'This is a protected route' });
});

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
  });
}

export default app;
