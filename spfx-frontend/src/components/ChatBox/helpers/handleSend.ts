/*  Chat-box “one turn” state machine  |  v1.9  ------------------------- */
import { toShift, plusHours, initSchedule } from "./shiftUtils";
import { sendChatToBackend } from "../../../services/chatService";
import spListService from "../../../services/sp/spListService";

import {
  AiResponse,
  QuickReply,
  Shift,
  ScheduleState
} from "../types";

/* ───────────────────────────── helpers ────────────────────────────── */

const weekdayList = [
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"
];
const isoDay = (iso: string) => iso.split("T")[0];
const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined,
    { weekday: "long", month: "long", day: "numeric", year: "numeric" });

/** “this Monday / next Friday” → ISO date */
function resolveRelativeWeekday(txt: string): string | undefined {
  const m = /(this|next)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.exec(txt);
  if (!m) return;
  const tgt = weekdayList.indexOf(m[2].toLowerCase());
  const today = new Date();
  let delta = (tgt - today.getDay() + 7) % 7;
  if (m[1].toLowerCase() === "next" || delta === 0) delta += 7;
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() + delta).toISOString();
}

/** “4/29/2025”, “2025-04-29”, etc. → ISO */
/**
* looks for the first DD/MM/YYYY, YYYY-MM-DD … inside *any* sentence.
* returns an ISO string or undefined.
*/
function parseAbsDate(txt: string): string | undefined {
    /* grab the first date-looking token in the string (no ^ … $ anchors) */
    const m = /(\d{1,4})[\/.\-](\d{1,2})[\/.\-](\d{1,4})/.exec(txt);
  if (!m) return;
  let [, a, b, c] = m.map(Number);
  let y: number, mo: number, d: number;

  if (c > 31) { y = c; mo = a; d = b; }
  else if (a > 31) { y = a; mo = b; d = c; }
  else { y = c < 100 ? 2000 + c : c; mo = a; d = b; }

  if (mo < 1 || mo > 12 || d < 1 || d > 31) return;
  return new Date(y, mo - 1, d).toISOString();
}

/** “this week” / “next week” → [MonISO,SunISO] */
function resolveRelativeWeek(txt: string): [string, string] | undefined {
  const m = /(this|next)\s+week/i.exec(txt);
  if (!m) return;
  const today = new Date();
  const deltaToMon = (today.getDay() + 6) % 7;
  let monday = new Date(today); monday.setDate(today.getDate() - deltaToMon);
  if (m[1].toLowerCase() === "next") monday.setDate(monday.getDate() + 7);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  return [monday.toISOString(), sunday.toISOString()];
}

/** “17/4/2025 – 23/4/2025” → [startISO,endISO] */
function parseExplicitRange(txt: string): [string, string] | undefined {
  const m = /^\s*(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})\s*(?:to|\-|–|—)\s*(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})\s*$/i.exec(txt);
  if (!m) return;
  const s = parseAbsDate(m[1]); const e = parseAbsDate(m[2]);
  return s && e ? [s, e] : undefined;
}

/* UI callback aliases */
type Say = (m: string, q?: QuickReply[]) => void;
type SetSchedule = (s: ScheduleState) => void;
type AddBubble = (c: string, who: "user" | "ai", q?: QuickReply[]) => void;

const confirmPrompt = (iso: string, sh: Shift, say: Say) => {
  say(`✅ Ready to schedule **${fmtDay(iso)}** (**${sh}**).`, [
    { title: "Confirm ✅", payload: "confirm" },
    { title: "Change 📝", payload: "cancel" }
  ]);
};

/* ==================================================================== */
/* MAIN                                                                 */
/* ==================================================================== */
export async function handleSend(
  text: string,
  userCtx: { name: string; email: string; id: number },
  sch: ScheduleState,
  setSch: SetSchedule,
  add: AddBubble,
  setLoading: (v: boolean) => void
) {
  if (!text.trim()) return;
  add(text, "user");
  const say: Say = (m, q = []) => add(m, "ai", q);

  /* ── pending: need date ─────────────────────────────────────────── */
  if (sch.awaiting === "shiftDate") {
    /* try every client-side parser we have                              */
    const iso = parseAbsDate(text)          // 2025-05-05 or 05/05/2025 …
      ?? resolveRelativeWeekday(text)// “this Monday / next Friday”
      ?? (() => {                    // explicit dd/mm – dd/mm range? use start
        const r = parseExplicitRange(text);
        return r ? r[0] : undefined;
      })()
      ?? (() => {                    // “this week / next week” → Monday
        const r = resolveRelativeWeek(text);
        return r ? r[0] : undefined;
      })();
    if (iso) {
      setSch({ ...sch, shiftDate: iso, awaiting: "shiftType" });
      say("🕐 Which shift? (Morning, Afternoon, Night)");
      return;
    }
    setLoading(true);
    const { ShiftStartDate, raw_date_phrase } = await sendChatToBackend(
      text, userCtx.name, userCtx.email, userCtx.id) as AiResponse;
    setLoading(false);

    if (!ShiftStartDate && raw_date_phrase) {
      const d = raw_date_phrase[0].toUpperCase() + raw_date_phrase.slice(1);
      say(`📅 You mentioned **${d}** – which ${d}?`, [
        { title: `This ${d}`, payload: `Schedule me this ${d}` },
        { title: `Next ${d}`, payload: `Schedule me next ${d}` },
        { title: "Pick a date 📅", payload: "Open calendar" },
      ]);
      return;
    }
    if (!ShiftStartDate) { say("📅 Which date did you have in mind?"); return; }

    setSch({ ...sch, shiftDate: ShiftStartDate, awaiting: "shiftType" });
    say("🕐 Which shift? (Morning, Afternoon, Night)");
    return;
  }

  /* ── pending: need shift type ───────────────────────────────────── */
  if (sch.awaiting === "shiftType") {
    const s = toShift(text);
    if (!s) { say("🕐 Morning, Afternoon or Night?"); return; }
    setSch({ ...sch, shiftType: s, awaiting: undefined, confirmationPending: true });
    confirmPrompt(sch.shiftDate!, s, say);
    return;
  }

  /* ── confirmation ──────────────────────────────────────────────── */
  if (sch.confirmationPending) {
    if (/confirm/i.test(text)) {
      await spListService.createScheduleItem({
        currentUserEmail: userCtx.email,
        currentUserName: userCtx.name,
        ShiftStartDate: sch.shiftDate!,
        ShiftEndDate: plusHours(sch.shiftDate!),
        ShiftType: sch.shiftType!,
        Role: "NURSE",
        userId: userCtx.id,
      });
      say("🎉 Schedule created!");
      setSch(initSchedule);
    } else {
      setSch({ ...initSchedule, awaiting: "shiftDate" });
      say("❗ Okay, new date please?");
    }
    return;
  }

  /* ── first round-trip to backend ───────────────────────────────── */
  setLoading(true);
  const res = await sendChatToBackend(
    text, userCtx.name, userCtx.email, userCtx.id) as AiResponse;
  setLoading(false);

  /* ========= 1)  availability / view_schedule  ==================== */
  const AVAIL = ["check_availability", "availability", "view_schedule"];
  if (AVAIL.includes(res.intent)) {
    /* pick a single date if possible */
    const dateISO = res.ShiftStartDate ??
      parseAbsDate(text) ??
      resolveRelativeWeekday(text);
    if (!dateISO) {
      say("📅 Which day *or* date-range should I check?");
      return;
    }

    const start = isoDay(dateISO) + "T00:00:00Z";
    const end = isoDay(dateISO) + "T23:59:59Z";

    setLoading(true);
    const items = await spListService.getScheduleForDate(userCtx.email, start, end);
    setLoading(false);

    if (items.length === 0) {
      say(`🆓 You’re free on **${fmtDay(dateISO)}**. Want to book a shift?`, [
        { title: "Morning", payload: `Schedule me ${fmtDay(dateISO)} morning` },
        { title: "Afternoon", payload: `Schedule me ${fmtDay(dateISO)} afternoon` },
        { title: "Night", payload: `Schedule me ${fmtDay(dateISO)} night` }
      ]);
      return;
    }

    const rows = items.map(i => `
      <tr>
        <td>${new Date(i.ShiftDate)
        .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
        <td>${i.ShiftType}</td>
        <td>${i.Role || ""}</td>
      </tr>`).join("");
    say(`✅ You **are scheduled** on **${fmtDay(dateISO)}**:<br/>
         <table style="border-collapse:collapse">
           <tr><th style="text-align:left">Time</th>
               <th style="text-align:left">Shift</th>
               <th style="text-align:left">Role</th></tr>
           ${rows}
         </table>`);
    return;
  }

  /* ========= 2)  schedule_shift  ================================== */
  if (res.intent === "schedule_shift") {
    /* ❶ try to extract both date and shift from either backend or user text */
    const dateISO =
      res.ShiftStartDate ??
      parseAbsDate(text) ??
      resolveRelativeWeekday(text);
    const shift =
      (res.shift_type ?? res.ShiftType) ? toShift(String(res.shift_type ?? res.ShiftType))
        : toShift(text);

    /* have both → skip straight to confirmation */
    if (dateISO && shift) {
      setSch({ shiftDate: dateISO, shiftType: shift, confirmationPending: true });
      confirmPrompt(dateISO, shift, say);
      return;
    }

    /* missing shift only */
    if (dateISO && !shift) {
      setSch({
        shiftDate: dateISO,
        awaiting: "shiftType",
        confirmationPending: false
      });
      say("🕐 Which shift? (Morning / Afternoon / Night)");
      return;
    }

    /* missing date only */
    if (!dateISO && shift) {
      setSch({
        shiftType: shift,
        awaiting: "shiftDate",
        confirmationPending: false
      });
      say("📅 Which date did you have in mind?");
      return;
    }

    /* nothing recognised → ask for date first */
    setSch({ ...initSchedule, awaiting: "shiftDate" });
    say("📅 When would you like to schedule your shift?");
    return;
  }

  /* ========= 3)  fallback  ======================================== */
  say("💬 I can help you schedule shifts or check availability.");
}
