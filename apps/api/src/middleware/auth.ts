import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized - No token provided' });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Unauthorized - Invalid token' });
    return;
  }

  req.userId = decoded.userId;
  next();
}