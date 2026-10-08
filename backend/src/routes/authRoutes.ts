import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'wanderlust_touring_super_secret_key_2026';

// POST /api/auth/login - Admin login
router.post('/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Default admin credentials: admin / admin123 or configurable
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || 'admin123';

    if (username === adminUser && password === adminPass) {
      const token = jwt.sign(
        { username, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        message: 'Authentication successful',
        token,
        user: {
          username,
          name: 'Touring Systems Administrator',
          role: 'Admin',
          email: 'admin@wanderlust-expeditions.com'
        }
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid username or password. Default credentials: admin / admin123'
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ success: false, error: msg });
  }
});

// GET /api/auth/me - Verify token
router.get('/me', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized: missing token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string; role: string };

    return res.json({
      success: true,
      user: {
        username: decoded.username,
        name: 'Touring Systems Administrator',
        role: decoded.role,
        email: 'admin@wanderlust-expeditions.com'
      }
    });
  } catch {
    return res.status(401).json({ success: false, error: 'Token expired or invalid' });
  }
});

export default router;
