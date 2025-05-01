import { Shift, ScheduleState } from "../types";

export const toShift = (txt?: string | null): Shift | undefined =>
  /morning/i.test(txt ?? "")   ? "Morning"   :
  /afternoon/i.test(txt ?? "") ? "Afternoon" :
  /night/i.test(txt ?? "")     ? "Night"     :
  undefined;

export const plusHours = (iso: string, h = 8) =>
  new Date(new Date(iso).getTime() + h * 3_600_000).toISOString();

export const initSchedule: ScheduleState = { confirmationPending: false };
