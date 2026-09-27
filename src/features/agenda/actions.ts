"use server";

// "use server" turns every exported function in this file into a Server Action:
// the browser can call it like a normal function, but it runs on the server.
// Because anyone can call them, each one (1) gets the user from the session,
// (2) validates its input and (3) only touches rows that belong to that user.

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { type DayKey, dayKeyToDate, isDayKey } from "@/lib/dates";
import { errorState, type FormState, successState, validationError } from "@/lib/form";
import { ownedAreaId } from "@/lib/ownership";
import { requireUserId } from "@/lib/session";
import { parseRecurringTaskForm, parseRoutineForm, parseTaskForm } from "./schemas";

/** Refresh every page, so lists and counters show the change right away. */
function refreshApp(): void {
  revalidatePath("/", "layout");
}

// ─────────────── One-off tasks ───────────────

export async function saveTaskAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = parseTaskForm(formData);
  if (!parsed.success) return validationError(parsed.error);

  const { id, title, date, time, notes } = parsed.data;
  const data = {
    title,
    date: dayKeyToDate(date),
    time: time ?? null,
    notes: notes ?? null,
    areaId: await ownedAreaId(userId, parsed.data.areaId),
  };

  if (id) {
    // updateMany lets us filter by id AND userId. If the task isn't ours, count is 0.
    const { count } = await db.task.updateMany({ where: { id, userId }, data });
    if (count === 0) return errorState("Task not found.");
  } else {
    await db.task.create({ data: { ...data, userId } });
  }

  refreshApp();
  return successState(id ? "Task updated" : "Task added");
}

export async function toggleTaskAction(taskId: string, done: boolean): Promise<void> {
  const userId = await requireUserId();
  await db.task.updateMany({
    where: { id: taskId, userId },
    data: { completedAt: done ? new Date() : null },
  });
  refreshApp();
}

export async function deleteTaskAction(taskId: string): Promise<void> {
  const userId = await requireUserId();
  await db.task.deleteMany({ where: { id: taskId, userId } });
  refreshApp();
}

/** Moves an overdue task to today — a gentle alternative to leaving it red forever. */
export async function moveTaskToDayAction(taskId: string, date: DayKey): Promise<void> {
  const userId = await requireUserId();
  if (!isDayKey(date)) return;
  await db.task.updateMany({ where: { id: taskId, userId }, data: { date: dayKeyToDate(date) } });
  refreshApp();
}

// ─────────────── Recurring tasks ───────────────

export async function saveRecurringTaskAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = parseRecurringTaskForm(formData);
  if (!parsed.success) return validationError(parsed.error);

  const input = parsed.data;
  const data = {
    title: input.title,
    time: input.time ?? null,
    areaId: await ownedAreaId(userId, input.areaId),
    frequency: input.frequency,
    // Only keep the fields that make sense for the chosen frequency
    daysOfWeek: input.frequency === "WEEKLY" ? [...new Set(input.daysOfWeek)].sort((a, b) => a - b) : [],
    dayOfMonth: input.frequency === "MONTHLY" ? (input.dayOfMonth ?? null) : null,
    startDate: dayKeyToDate(input.startDate),
  };

  if (input.id) {
    const { count } = await db.recurringTask.updateMany({ where: { id: input.id, userId }, data });
    if (count === 0) return errorState("Recurring task not found.");
  } else {
    await db.recurringTask.create({ data: { ...data, userId } });
  }

  refreshApp();
  return successState(input.id ? "Recurring task updated" : "Recurring task added");
}

export async function toggleOccurrenceAction(recurringTaskId: string, date: DayKey, done: boolean): Promise<void> {
  const userId = await requireUserId();
  if (!isDayKey(date)) return;

  const owned = await db.recurringTask.findFirst({ where: { id: recurringTaskId, userId }, select: { id: true } });
  if (!owned) return;

  const day = dayKeyToDate(date);
  if (done) {
    // upsert = "create it, or do nothing if it already exists".
    // The @@unique([recurringTaskId, date]) in the schema makes this possible.
    await db.recurringTaskCompletion.upsert({
      where: { recurringTaskId_date: { recurringTaskId, date: day } },
      create: { recurringTaskId, userId, date: day },
      update: {},
    });
  } else {
    await db.recurringTaskCompletion.deleteMany({ where: { recurringTaskId, userId, date: day } });
  }
  refreshApp();
}

/** Archiving hides it from the agenda but keeps its history for the areas dashboard. */
export async function archiveRecurringTaskAction(id: string): Promise<void> {
  const userId = await requireUserId();
  await db.recurringTask.updateMany({ where: { id, userId }, data: { archivedAt: new Date() } });
  refreshApp();
}

// ─────────────── Routines ───────────────

export async function saveRoutineAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = parseRoutineForm(formData);
  if (!parsed.success) return validationError(parsed.error);

  const input = parsed.data;
  const data = {
    name: input.name,
    areaId: await ownedAreaId(userId, input.areaId),
    frequency: input.frequency,
    daysOfWeek: input.frequency === "WEEKLY" ? [...new Set(input.daysOfWeek)].sort((a, b) => a - b) : [],
    dayOfMonth: input.frequency === "MONTHLY" ? (input.dayOfMonth ?? null) : null,
  };

  if (!input.id) {
    const count = await db.routine.count({ where: { userId } });
    await db.routine.create({
      data: {
        ...data,
        userId,
        position: count,
        // Nested create: the routine and its steps are inserted together
        steps: { create: input.steps.map((title, position) => ({ title, position })) },
      },
    });
    refreshApp();
    return successState("Routine added");
  }

  const routine = await db.routine.findFirst({
    where: { id: input.id, userId },
    include: { steps: { orderBy: { position: "asc" } } },
  });
  if (!routine) return errorState("Routine not found.");

  // Update steps by position instead of deleting them all, so the check marks
  // of steps that still exist are kept. A transaction makes it all-or-nothing.
  await db.$transaction(async (tx) => {
    await tx.routine.update({ where: { id: routine.id }, data });
    for (const [position, title] of input.steps.entries()) {
      const existing = routine.steps[position];
      if (existing) {
        if (existing.title !== title) await tx.routineStep.update({ where: { id: existing.id }, data: { title } });
      } else {
        await tx.routineStep.create({ data: { routineId: routine.id, title, position } });
      }
    }
    const removed = routine.steps.slice(input.steps.length).map((step) => step.id);
    if (removed.length > 0) await tx.routineStep.deleteMany({ where: { id: { in: removed } } });
  });

  refreshApp();
  return successState("Routine updated");
}

export async function toggleRoutineStepAction(stepId: string, date: DayKey, done: boolean): Promise<void> {
  const userId = await requireUserId();
  if (!isDayKey(date)) return;

  // The step itself has no userId, so we check its routine's owner
  const step = await db.routineStep.findFirst({ where: { id: stepId, routine: { userId } }, select: { id: true } });
  if (!step) return;

  const day = dayKeyToDate(date);
  if (done) {
    await db.routineStepCheck.upsert({
      where: { stepId_date: { stepId, date: day } },
      create: { stepId, userId, date: day },
      update: {},
    });
  } else {
    await db.routineStepCheck.deleteMany({ where: { stepId, userId, date: day } });
  }
  refreshApp();
}

export async function archiveRoutineAction(id: string): Promise<void> {
  const userId = await requireUserId();
  await db.routine.updateMany({ where: { id, userId }, data: { archivedAt: new Date() } });
  refreshApp();
}
