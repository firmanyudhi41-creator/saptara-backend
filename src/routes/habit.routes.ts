import { Router } from "express";
import { habitService } from "../services/habit.service.js";
import { requireStudent } from "../middleware/student-auth.middleware.js";
import type { AuthenticatedRequest } from "../types/index.js";

const router = Router();

// GET /api/habits — Get all 7 habits
router.get("/", async (_req, res, next) => {
  try {
    const habits = await habitService.getAll();
    res.json(habits);
  } catch (error) {
    next(error);
  }
});

// GET /api/habits/today/:studentId — Get today's missions for student
router.get("/today/:studentId", async (req, res, next) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const missions = await habitService.getTodayMissions(studentId);
    res.json(missions);
  } catch (error) {
    next(error);
  }
});

// POST /api/habits/complete — Toggle habit completion
router.post("/complete", requireStudent, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { habitId } = req.body;

    if (!habitId) {
      res.status(400).json({ error: "habitId is required" });
      return;
    }

    const result = await habitService.toggleCompletion(
      req.student!.studentId,
      habitId
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/habits/scores/:studentId — Get habit scores (radar chart)
router.get("/scores/:studentId", async (req, res, next) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const scores = await habitService.getScores(studentId);
    res.json(scores);
  } catch (error) {
    next(error);
  }
});

export default router;
