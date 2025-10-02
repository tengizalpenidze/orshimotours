import { Request, Response, RequestHandler } from "express";
import { storage } from "./storage";
import crypto from "crypto";

// Simple password hashing using Node's built-in crypto
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Hardcoded fallback admin credentials
const FALLBACK_ADMIN = {
  email: "david.alpenidze@gmail.com",
  password: "Kompasi123!",
  id: "fallback-admin-id",
  firstName: "David",
  lastName: "Alpenidze"
};

// Login endpoint for username/password
export async function handlePasswordLogin(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Try to authenticate from database first
    const user = await storage.getUserByEmail(email);
    
    // If user exists in database, authenticate using database only (no fallback)
    if (user) {
      // Check if user has admin privileges and correct password
      if (user.passwordHash && user.isAdmin && verifyPassword(password, user.passwordHash)) {
        // Set session
        (req.session as any).userId = user.id;
        (req.session as any).isAdmin = true;

        return res.json({ 
          success: true, 
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isAdmin: user.isAdmin
          }
        });
      }
      
      // User exists but credentials are invalid or user is not admin
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // User doesn't exist in database - check fallback credentials ONLY if user not found
    if (email === FALLBACK_ADMIN.email && password === FALLBACK_ADMIN.password) {
      console.log("⚠️  Using fallback admin credentials (DB user not found)");
      
      // Set session with fallback admin
      (req.session as any).userId = FALLBACK_ADMIN.id;
      (req.session as any).isAdmin = true;
      (req.session as any).isFallbackAdmin = true;

      return res.json({ 
        success: true, 
        user: {
          id: FALLBACK_ADMIN.id,
          email: FALLBACK_ADMIN.email,
          firstName: FALLBACK_ADMIN.firstName,
          lastName: FALLBACK_ADMIN.lastName,
          isAdmin: true
        }
      });
    }

    return res.status(401).json({ error: "Invalid credentials" });
  } catch (error) {
    console.error("Login error (DB unavailable):", error);
    
    // Database is unavailable - use fallback credentials as last resort
    if (email === FALLBACK_ADMIN.email && password === FALLBACK_ADMIN.password) {
      console.log("⚠️  CRITICAL: Using fallback admin credentials (DATABASE UNAVAILABLE)");
      
      (req.session as any).userId = FALLBACK_ADMIN.id;
      (req.session as any).isAdmin = true;
      (req.session as any).isFallbackAdmin = true;

      return res.json({ 
        success: true, 
        user: {
          id: FALLBACK_ADMIN.id,
          email: FALLBACK_ADMIN.email,
          firstName: FALLBACK_ADMIN.firstName,
          lastName: FALLBACK_ADMIN.lastName,
          isAdmin: true
        }
      });
    }
    
    res.status(500).json({ error: "Login failed" });
  }
}

// Logout endpoint
export async function handlePasswordLogout(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.json({ success: true });
  });
}

// Middleware to check if user is authenticated via password
export const isPasswordAuthenticated: RequestHandler = async (req, res, next) => {
  const userId = (req.session as any)?.userId;
  const isAdmin = (req.session as any)?.isAdmin;
  const isFallbackAdmin = (req.session as any)?.isFallbackAdmin;

  if (!userId || !isAdmin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // If using fallback admin, create a mock user object
  if (isFallbackAdmin && userId === FALLBACK_ADMIN.id) {
    req.user = {
      id: FALLBACK_ADMIN.id,
      email: FALLBACK_ADMIN.email,
      firstName: FALLBACK_ADMIN.firstName,
      lastName: FALLBACK_ADMIN.lastName,
      isAdmin: true,
      passwordHash: null
    } as any;
    return next();
  }

  // Attach user to request from database
  try {
    const user = await storage.getUser(userId);
    if (!user || !user.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = user as any;
    next();
  } catch (error) {
    // If DB error but user is fallback admin, allow access
    if (isFallbackAdmin && userId === FALLBACK_ADMIN.id) {
      req.user = {
        id: FALLBACK_ADMIN.id,
        email: FALLBACK_ADMIN.email,
        firstName: FALLBACK_ADMIN.firstName,
        lastName: FALLBACK_ADMIN.lastName,
        isAdmin: true,
        passwordHash: null
      } as any;
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Create admin user helper
export async function createAdminUser(email: string, password: string) {
  const passwordHash = hashPassword(password);
  
  await storage.upsertUser({
    id: crypto.randomUUID(),
    email,
    passwordHash,
    firstName: "Admin",
    lastName: "User",
    isAdmin: true,
  });
}
