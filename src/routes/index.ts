import { Router } from "express";
import authRoutes from "./auth.routes.js";
import classRoutes from "./class.routes.js";
import studentRoutes from "./student.routes.js";
import habitRoutes from "./habit.routes.js";
import logbookRoutes from "./logbook.routes.js";
import rewardRoutes from "./reward.routes.js";

const router = Router();

// Auth routes are mounted at root level (Better Auth needs /api/auth/*splat)
router.use(authRoutes);

// Feature routes
router.use("/api/classes", classRoutes);
router.use("/api/students", studentRoutes);
router.use("/api/habits", habitRoutes);
router.use("/api/logbook", logbookRoutes);
router.use("/api/rewards", rewardRoutes);

export default router;
