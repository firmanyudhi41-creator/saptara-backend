import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AuthenticatedRequest, StudentPayload } from "../types/index.js";

const JWT_SECRET = process.env.JWT_SECRET || "saptara-student-jwt-secret";

/**
 * Middleware: Require authenticated student (JWT token).
 * Students use a lightweight name+classCode login that returns a JWT.
 * Attaches `req.student` with { studentId, classId, role }
 */
export function requireStudent(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized — student login required" });
      return;
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as StudentPayload;

    if (payload.role !== "student") {
      res.status(403).json({ error: "Invalid student token" });
      return;
    }

    req.student = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired student token" });
  }
}

/**
 * Middleware: Require either teacher or student auth.
 * Useful for endpoints accessible by both roles.
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  // Check for student JWT first (faster)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return requireStudent(req, res, next);
  }

  // Fall back to teacher session check
  // Import dynamically to avoid circular dependency
  import("./auth.middleware.js").then(({ requireTeacher }) => {
    requireTeacher(req, res, next);
  });
}
