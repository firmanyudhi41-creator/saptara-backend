import { db } from "../db/index.js";
import { habit, habitCompletion, student } from "../db/schema.js";
import { eq, and, sql } from "drizzle-orm";

export const habitService = {
  /**
   * Get all 7 habits.
   */
  async getAll() {
    return db.select().from(habit);
  },

  /**
   * Get today's missions for a student with completion status.
   */
  async getTodayMissions(studentId: number) {
    const today = new Date().toISOString().split("T")[0];

    const allHabits = await db.select().from(habit);
    const completions = await db
      .select({ habitId: habitCompletion.habitId })
      .from(habitCompletion)
      .where(
        and(
          eq(habitCompletion.studentId, studentId),
          eq(habitCompletion.date, today)
        )
      );

    const completedIds = completions.map((c) => c.habitId);

    return allHabits.map((h) => ({
      habit: h,
      completed: completedIds.includes(h.id),
    }));
  },

  /**
   * Toggle habit completion for today.
   * If already completed → uncomplete (remove XP/coins).
   * If not completed → complete (add XP/coins).
   */
  async toggleCompletion(studentId: number, habitId: number) {
    const today = new Date().toISOString().split("T")[0];

    // Check if already completed today
    const [existing] = await db
      .select()
      .from(habitCompletion)
      .where(
        and(
          eq(habitCompletion.studentId, studentId),
          eq(habitCompletion.habitId, habitId),
          eq(habitCompletion.date, today)
        )
      )
      .limit(1);

    if (existing) {
      // Uncomplete: remove completion and subtract XP/coins
      await db
        .delete(habitCompletion)
        .where(eq(habitCompletion.id, existing.id));

      await db
        .update(student)
        .set({
          xp: sql`MAX(${student.xp} - 10, 0)`,
          coins: sql`MAX(${student.coins} - 5, 0)`,
        })
        .where(eq(student.id, studentId));

      return { action: "uncompleted", habitId };
    } else {
      // Complete: add completion and add XP/coins
      await db.insert(habitCompletion).values({
        studentId,
        habitId,
        date: today,
      });

      await db
        .update(student)
        .set({
          xp: sql`${student.xp} + 10`,
          coins: sql`${student.coins} + 5`,
          lastActiveDate: today,
        })
        .where(eq(student.id, studentId));

      // Update streak
      await this.updateStreak(studentId);

      return { action: "completed", habitId };
    }
  },

  /**
   * Recalculate streak for a student.
   */
  async updateStreak(studentId: number) {
    const [s] = await db
      .select()
      .from(student)
      .where(eq(student.id, studentId))
      .limit(1);

    if (!s) return;

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // If last active was yesterday or today, increment/keep streak
    if (s.lastActiveDate === yesterdayStr || s.lastActiveDate === today.toISOString().split("T")[0]) {
      // Streak continues or already updated
      if (s.lastActiveDate === yesterdayStr) {
        await db
          .update(student)
          .set({ streak: s.streak + 1 })
          .where(eq(student.id, studentId));
      }
    } else if (s.lastActiveDate !== today.toISOString().split("T")[0]) {
      // Streak broken — reset to 1
      await db
        .update(student)
        .set({ streak: 1 })
        .where(eq(student.id, studentId));
    }
  },

  /**
   * Get cumulative habit scores (percentage over last 30 days).
   */
  async getScores(studentId: number) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sinceDate = thirtyDaysAgo.toISOString().split("T")[0];

    const scores: Record<number, number> = {};

    for (let i = 1; i <= 7; i++) {
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(habitCompletion)
        .where(
          and(
            eq(habitCompletion.studentId, studentId),
            eq(habitCompletion.habitId, i),
            sql`${habitCompletion.date} >= ${sinceDate}`
          )
        );

      scores[i] = Math.round(((Number(result?.count) || 0) / 30) * 100);
    }

    return scores;
  },
};
