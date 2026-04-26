import type { Response, NextFunction } from "express";
import { db } from "../db/index.js";
import { teacher } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { auth } from "../auth.js";
import { fromNodeHeaders } from "better-auth/node";
import type { AuthenticatedRequest } from "../types/index.js";

/**
 * Middleware: Require authenticated teacher (Better Auth session).
 * Attaches `req.teacher` with { userId, teacherId, role }
 *
 * If the user has a valid session but no teacher profile yet,
 * auto-create one using the user's name from Better Auth.
 */
export async function requireTeacher(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      res.status(401).json({ error: "Unauthorized — teacher login required" });
      return;
    }

    // Look up teacher record
    let [teacherRecord] = await db
      .select()
      .from(teacher)
      .where(eq(teacher.userId, session.user.id))
      .limit(1);

    // Auto-create teacher profile if not exists
    if (!teacherRecord) {
      const displayName = session.user.name || session.user.email.split("@")[0];
      const [newTeacher] = await db
        .insert(teacher)
        .values({
          userId: session.user.id,
          displayName,
        })
        .returning();
      teacherRecord = newTeacher;
    }

    req.teacher = {
      userId: session.user.id,
      teacherId: teacherRecord.id,
      role: "teacher",
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Invalid session" });
  }
}
