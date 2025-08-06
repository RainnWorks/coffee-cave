import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyWithSalt } from '../utils/auth';
import { createRefreshJWT, createZeroAccessJWT, verifyRefreshJWT, getRefreshCookieOptions } from '../utils/jwt';
import { 
  ipRateLimit, 
  staffPinRateLimit, 
  adminEmailRateLimit, 
  createCombinedRateLimit 
} from '../utils/rateLimitExpress';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Validation helpers
 */
const isValidStaffId = (staffId: string): boolean => {
  return typeof staffId === 'string' && staffId.length > 0;
};

const isValidPin = (pin: string): boolean => {
  return typeof pin === 'string' && /^\d{6}$/.test(pin);
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email);
};

const isValidPassword = (password: string): boolean => {
  return typeof password === 'string' && password.length >= 8;
};

/**
 * Rate limiting middleware combinations
 */
const staffPinRateLimitMiddleware = createCombinedRateLimit(staffPinRateLimit);
const adminEmailRateLimitMiddleware = createCombinedRateLimit(adminEmailRateLimit);

/**
 * POST /auth/login/staff-pin
 * Staff PIN authentication
 */
router.post('/login/staff-pin', 
  ...staffPinRateLimitMiddleware,
  async (req, res) => {
    try {
      const { staffId, pin } = req.body;

      // Validate input
      if (!isValidStaffId(staffId)) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      if (!isValidPin(pin)) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Fetch staff member
      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
        include: { adminAccount: true },
      });

      if (!staff) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Check if staff is disabled
      if (staff.disabledAt) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Verify PIN
      const isPinValid = await verifyWithSalt(pin, staff.pinSalt, staff.pinHash);
      if (!isPinValid) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Create Refresh JWT
      const refreshToken = createRefreshJWT({
        staffId: staff.id,
        role: staff.adminAccount ? 'admin' : 'staff',
        credVersion: staff.credVersion,
        adminId: staff.adminAccount?.id,
      });

      // Set cookie and return success
      const cookieOptions = getRefreshCookieOptions();
      res.cookie('refresh_token', refreshToken, cookieOptions);
      
      // Log successful login
      const clientIP = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip || 'unknown';
      console.log(`Staff login successful: ${staff.id} from IP ${clientIP}`);
      
      return res.status(204).send();

    } catch (error) {
      console.error('Staff PIN login error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /auth/login/admin
 * Admin email/password authentication
 */
router.post('/login/admin',
  ...adminEmailRateLimitMiddleware,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      if (!isValidPassword(password)) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Fetch admin user
      const admin = await prisma.admin.findFirst({
        where: { 
          email: email.toLowerCase(),
        },
        include: { staff: true },
      });

      if (!admin) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Check if admin is disabled
      if (admin.disabledAt || admin.staff.disabledAt) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isPasswordValid = await verifyWithSalt(password, admin.passwordSalt, admin.passwordHash);
      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Create Refresh JWT
      const refreshToken = createRefreshJWT({
        staffId: admin.staff.id,
        role: 'admin',
        credVersion: Math.min(admin.credVersion, admin.staff.credVersion), // Use minimum version
        adminId: admin.id,
      });

      // Set cookie and return success
      const cookieOptions = getRefreshCookieOptions();
      res.cookie('refresh_token', refreshToken, cookieOptions);
      
      // Log successful login
      const clientIP = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip || 'unknown';
      console.log(`Admin login successful: ${admin.id} (staff: ${admin.staff.id}) from IP ${clientIP}`);
      
      return res.status(204).send();

    } catch (error) {
      console.error('Admin login error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /auth/zero-token
 * Exchange Refresh JWT for Zero Access JWT
 */
router.post('/zero-token', async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No session' });
    }

    // Verify Refresh JWT
    let payload;
    try {
      payload = verifyRefreshJWT(refreshToken);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Fetch user to validate credVersion and disabled status
    const staff = await prisma.staff.findUnique({
      where: { id: payload.sub },
      include: { adminAccount: true },
    });

    if (!staff) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Check if staff is disabled
    if (staff.disabledAt) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Check credVersion for staff
    if (staff.credVersion !== payload.credVersion) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // If admin role, also check admin credVersion
    if (payload.role === 'admin' && payload.adminId) {
      const admin = await prisma.admin.findUnique({
        where: { id: payload.adminId },
      });

      if (!admin || admin.disabledAt || admin.credVersion !== payload.credVersion) {
        return res.status(401).json({ error: 'Invalid session' });
      }
    }

    // Generate scopes based on role
    const scopes = payload.role === 'admin' ? ['read', 'write', 'admin'] : ['read', 'write'];

    // Create Zero Access JWT
    const accessToken = createZeroAccessJWT({
      staffId: staff.id,
      role: payload.role,
      adminId: payload.adminId,
      scopes,
    });

    return res.status(200).json({
      token: accessToken,
      userID: staff.id, // userID must equal sub for Zero
    });

  } catch (error) {
    console.error('Zero token error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /auth/logout
 * Clear refresh token cookie
 */
router.post('/logout', (req, res) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    // Log logout
    const refreshToken = req.cookies.refresh_token;
    if (refreshToken) {
      try {
        const payload = verifyRefreshJWT(refreshToken);
        const clientIP = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip || 'unknown';
        console.log(`User logout: ${payload.sub} from IP ${clientIP}`);
      } catch (error) {
        // Ignore JWT verification errors during logout
      }
    }

    return res.status(204).send();

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
