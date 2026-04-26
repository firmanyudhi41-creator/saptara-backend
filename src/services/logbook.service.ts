import { db } from "../db/index.js";
import { logbookEntry, student, habitCompletion } from "../db/schema.js";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

export const logbookService = {
  /**
   * Create a new logbook entry (student submits photo proof).
   */
  async create(
    studentId: number,
    habitId: number,
    caption: string,
    photoUrl: string | null
  ) {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const time = now.toTimeString().slice(0, 5);

    const [entry] = await db
      .insert(logbookEntry)
      .values({
        studentId,
        habitId,
        date: today,
        time,
        photoUrl,
        caption,
        status: "pending",
      })
      .returning();

    // Also mark habit as completed for today (if not already)
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

    if (!existing) {
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
    }

    return entry;
  },

  /**
   * Get logbook entries for a specific student.
   */
  async getByStudent(studentId: number) {
    return db
      .select()
      .from(logbookEntry)
      .where(eq(logbookEntry.studentId, studentId))
      .orderBy(desc(logbookEntry.createdAt));
  },

  /**
   * Get all logbook entries for a class (teacher feed).
   */
  async getByClass(classId: number) {
    const students = await db
      .select({ id: student.id })
      .from(student)
      .where(eq(student.classId, classId));

    const studentIds = students.map((s) => s.id);
    if (studentIds.length === 0) return [];

    return db
      .select()
      .from(logbookEntry)
      .where(inArray(logbookEntry.studentId, studentIds))
      .orderBy(desc(logbookEntry.createdAt));
  },

  /**
   * Get pending entries for a class (teacher feed filtered).
   */
  async getPending(classId: number) {
    const entries = await this.getByClass(classId);
    return entries.filter((e) => e.status === "pending");
  },

  /**
   * Verify (approve) a logbook entry.
   */
  async verify(
    entryId: number,
    teacherId: number,
    sticker: string = "🪙",
    comment: string = "Bagus, Kapten!"
  ) {
    const [entry] = await db
      .select()
      .from(logbookEntry)
      .where(eq(logbookEntry.id, entryId))
      .limit(1);

    if (!entry) {
      throw Object.assign(new Error("Entry tidak ditemukan"), {
        statusCode: 404,
      });
    }

    const xpReward = 15;

    // Update entry
    const [updated] = await db
      .update(logbookEntry)
      .set({
        status: "verified",
        reviewedByTeacherId: teacherId,
        teacherSticker: sticker,
        teacherComment: comment,
        xpEarned: xpReward,
        updatedAt: new Date(),
      })
      .where(eq(logbookEntry.id, entryId))
      .returning();

    // Award XP to student
    await db
      .update(student)
      .set({ xp: sql`${student.xp} + ${xpReward}` })
      .where(eq(student.id, entry.studentId));

    return updated;
  },

  /**
   * Reject a logbook entry (needs revision).
   */
  async reject(
    entryId: number,
    teacherId: number,
    comment: string = "Coba lagi ya, Kapten!"
  ) {
    const [updated] = await db
      .update(logbookEntry)
      .set({
        status: "needs_revision",
        reviewedByTeacherId: teacherId,
        teacherComment: comment,
        updatedAt: new Date(),
      })
      .where(eq(logbookEntry.id, entryId))
      .returning();

    if (!updated) {
      throw Object.assign(new Error("Entry tidak ditemukan"), {
        statusCode: 404,
      });
    }

    return updated;
  },

  /**
   * Batch verify multiple entries at once.
   */
  async batchVerify(
    entryIds: number[],
    teacherId: number,
    sticker: string = "👍",
    comment: string = "Bagus, Kapten! Lanjutkan!"
  ) {
    const results = [];
    for (const id of entryIds) {
      const result = await this.verify(id, teacherId, sticker, comment);
      results.push(result);
    }
    return results;
  },
};
