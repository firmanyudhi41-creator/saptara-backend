import { Router } from "express";
import { studentService } from "../services/student.service.js";
import { requireTeacher } from "../middleware/auth.middleware.js";
import { requireStudent } from "../middleware/student-auth.middleware.js";
import type { AuthenticatedRequest } from "../types/index.js";

const router = Router();

// POST /api/students — Add student to class (teacher auth)
router.post("/", requireTeacher, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { classId, name, avatar } = req.body;

    if (!classId || !name) {
      res.status(400).json({ error: "classId and name are required" });
      return;
    }

    const newStudent = await studentService.create(classId, name, avatar);
    res.status(201).json(newStudent);
  } catch (error) {
    next(error);
  }
});

// GET /api/students/leaderboard/:classId — Class leaderboard
router.get("/leaderboard/:classId", async (req, res, next) => {
  try {
    const classId = parseInt(req.params.classId);
    const leaderboard = await studentService.getLeaderboard(classId);
    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
});

// GET /api/students/:id — Get student profile
router.get("/:id", async (req, res, next) => {
  try {
    const studentId = parseInt(req.params.id);
    const studentData = await studentService.getById(studentId);
    res.json(studentData);
  } catch (error) {
    next(error);
  }
});

// GET /api/students/:id/dashboard — Full dashboard data
router.get("/:id/dashboard", async (req, res, next) => {
  try {
    const studentId = parseInt(req.params.id);
    const dashboard = await studentService.getDashboard(studentId);
    res.json(dashboard);
  } catch (error) {
    next(error);
  }
});

// GET /api/students/:id/weekly — Weekly completion trend
router.get("/:id/weekly", async (req, res, next) => {
  try {
    const studentId = parseInt(req.params.id);
    const weeklyData = await studentService.getWeeklyData(studentId);
    res.json(weeklyData);
  } catch (error) {
    next(error);
  }
});

// GET /api/students/:id/compass — Radar chart data
router.get("/:id/compass", async (req, res, next) => {
  try {
    const studentId = parseInt(req.params.id);
    const compassData = await studentService.getCompassData(studentId);
    res.json(compassData);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/students/:id — Remove student (teacher auth)
router.delete("/:id", requireTeacher, async (req: AuthenticatedRequest, res, next) => {
  try {
    const studentId = parseInt(req.params.id as string);
    const result = await studentService.delete(studentId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
