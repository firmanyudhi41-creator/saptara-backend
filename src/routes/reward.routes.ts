import { Router } from "express";
import { rewardService } from "../services/reward.service.js";
import { requireTeacher } from "../middleware/auth.middleware.js";
import { requireStudent } from "../middleware/student-auth.middleware.js";
import type { AuthenticatedRequest } from "../types/index.js";

const router = Router();

// GET /api/rewards/badges/:studentId — Get student's badges
router.get("/badges/:studentId", async (req, res, next) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const badges = await rewardService.getBadges(studentId);
    res.json(badges);
  } catch (error) {
    next(error);
  }
});

// POST /api/rewards/badges — Award badge to student (teacher auth)
router.post("/badges", requireTeacher, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { studentId, habitId } = req.body;

    if (!studentId || !habitId) {
      res.status(400).json({ error: "studentId and habitId are required" });
      return;
    }

    const badge = await rewardService.awardBadge(
      studentId,
      habitId,
      req.teacher!.teacherId
    );
    res.status(201).json(badge);
  } catch (error) {
    next(error);
  }
});

// GET /api/rewards/accessories — Get all available accessories
router.get("/accessories", (_req, res) => {
  const accessories = rewardService.getAllAccessories();
  res.json(accessories);
});

// GET /api/rewards/accessories/:studentId — Get student's accessories
router.get("/accessories/:studentId", async (req, res, next) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const accessories = await rewardService.getStudentAccessories(studentId);
    res.json(accessories);
  } catch (error) {
    next(error);
  }
});

// POST /api/rewards/accessories/purchase — Purchase accessory with coins
router.post("/accessories/purchase", requireStudent, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { accessoryId } = req.body;

    if (!accessoryId) {
      res.status(400).json({ error: "accessoryId is required" });
      return;
    }

    const result = await rewardService.purchaseAccessory(
      req.student!.studentId,
      accessoryId
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/rewards/message — Send bottle message to student (teacher auth)
router.post("/message", requireTeacher, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { studentId, sticker, comment } = req.body;

    if (!studentId || !comment) {
      res.status(400).json({ error: "studentId and comment are required" });
      return;
    }

    const entry = await rewardService.sendBottleMessage(
      studentId,
      req.teacher!.teacherId,
      sticker || "🪙",
      comment
    );
    res.json(entry);
  } catch (error) {
    next(error);
  }
});

export default router;
