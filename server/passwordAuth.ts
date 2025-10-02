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

// Login endpoint for username/password
export async function handlePasswordLogin(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await storage.getUserByEmail(email);
    
    if (!user || !user.passwordHash || !user.isAdmin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Set session
    (req.session as any).userId = user.id;
    (req.session as any).isAdmin = true;

    res.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error("Login error:", error);
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

  if (!userId || !isAdmin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Attach user to request
  try {
    const user = await storage.getUser(userId);
    if (!user || !user.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = user as any;
    next();
  } catch (error) {
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
