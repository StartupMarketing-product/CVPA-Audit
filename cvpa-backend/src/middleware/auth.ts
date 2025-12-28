import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  // Explicitly include Request properties for Render TypeScript resolution
  headers: Request['headers'];
  params: Request['params'];
  body: Request['body'];
  query: Request['query'];
  path: Request['path'];
  method: Request['method'];
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // #region agent log
  console.log(`[DEBUG] Auth middleware: path=${req.path}, hasToken=${!!token}, method=${req.method}`);
  // #endregion

  if (!token) {
    // #region agent log
    console.log(`[DEBUG] Auth failed: No token for path=${req.path}`);
    // #endregion
    return res.status(401).json({ error: 'Access token required' });
  }

  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  
          jwt.verify(token, secret, (err, decoded: any) => {
            if (err) {
              // #region agent log
              console.log(`[DEBUG] Auth failed: Invalid token for path=${req.path}, error=${err.message}`);
              // #endregion
              return res.status(403).json({ error: 'Invalid or expired token' });
            }
            
            req.user = {
              id: decoded.id,
              email: decoded.email,
              role: decoded.role,
            };
            
            // #region agent log
            console.log(`[DEBUG] Auth success: user=${req.user.id}, path=${req.path}`);
            // #endregion
            next();
          });
}

export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

