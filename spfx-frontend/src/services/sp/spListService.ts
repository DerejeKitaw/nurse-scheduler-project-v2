import { getSP, getSPInstance } from "../../pnpjsConfig";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { v4 as uuidv4 } from "uuid";
import {
  NurseItem,
  NurseScheduleItem,
  CreateSchedulePayload,
} from "../../types/types";

 /* ------------------------------------------------------------------ */
/* utilities                                                          */
/* ------------------------------------------------------------------ */

/** true ⇢ d is **within** the closed interval [start,end]  */
const between = (d: Date, start: Date, end: Date) =>
  d.getTime() >= start.getTime() && d.getTime() <= end.getTime();

/** strip the time part – keeps just YYYY-MM-DD for de-dup keys         */
const isoDay = (iso: string) => iso.split("T")[0];

/* ------------------------------------------------------------------ */
/* main service object                                                */
/* ------------------------------------------------------------------ */

const spListService = {
  /* 🩺 nurses list --------------------------------------------------- */
  async getNurseData(): Promise<NurseItem[]> {
    try {
      return await getSPInstance().web.lists.getByTitle("Nurses").items();
    } catch (e) {
      console.error("❌ getNurseData", e);
      return [];
    }
  },



/* ------------------------------------------------------------------ */
/* GET *one* user’s shifts for a given UTC day                         */
/* ------------------------------------------------------------------ */

async getScheduleForDate(
  email: string,
  startISO: string,        // 00:00:00 Z of the day
  endISO  : string         // 23:59:59 Z of the day
): Promise<NurseScheduleItem[]> {

  if (!email) return [];

  try {
    const rows = await getSP()
      .web.lists.getByTitle("NurseSchedule")
      .items
      .select(
        "Id",
        "Title",
        "ShiftType",
        "ShiftDate",
        "ShiftEndDate",
        "WorkHours",
        "Role",
        "User/EMail"
      )
      .expand("User")();

    /* 1 ▸ keep only the rows that belong to this user **and** fall
           on the requested day (UTC)                                     */
    const targetStart = new Date(startISO);
    const targetEnd   = new Date(endISO);

    const hits = rows.filter(r => {
      const sameUser = r.User?.EMail?.toLowerCase() === email.toLowerCase();
      const inRange  = between(new Date(r.ShiftDate), targetStart, targetEnd);
      return sameUser && inRange;
    });

    /* 2 ▸ guard against “mid-night stubs”-– use map to keep 1 per Id     */
    const unique = new Map<number, NurseScheduleItem>();
    hits.forEach(r => unique.set(r.Id, r));

    return Array.from(unique.values());
  }
  catch (e) {
    console.error("❌ getScheduleForDate", e);
    return [];
  }
},


  /* legacy wrappers kept for backward compatibility ----------------- */
  async getUserSchedule(
    email: string,
    startISO: string,
    endISO: string
  ): Promise<NurseScheduleItem[]> {
    return this.getScheduleForDate(email, startISO, endISO);
  },

  async getUserScheduleById(userId: string): Promise<NurseScheduleItem | undefined> {
    if (!userId) return undefined;
    try {
      const items = await getSP()
        .web.lists.getByTitle("NurseSchedule")
        .items.filter(`userId eq '${userId}'`)
        .top(1)();
      return items[0];
    } catch (e) {
      console.error("❌ getUserScheduleById", e);
      return undefined;
    }
  },

  async getUserScheduleConflicts(
    email: string,
    startISO: string,
    endISO: string
  ): Promise<NurseScheduleItem[]> {
    const items = await this.getScheduleForDate(email, startISO, endISO);
    return detectUserScheduleConflicts(items);
  },

  /* 🆕 create item --------------------------------------------------- */
  async createScheduleItem(p: CreateSchedulePayload): Promise<void> {
    try {
      await getSP().web.lists.getByTitle("NurseSchedule").items.add({
        Title: `Shift for ${p.currentUserName}`,
        ShiftDate: p.ShiftStartDate,
        ShiftEndDate: p.ShiftEndDate,
        ShiftType: p.ShiftType,
        WorkHours: p.WorkHours,
        Role: p.Role,
        userId: uuidv4(),
        UserId: p.userId,
      });
      console.log("✅ SharePoint item created");
    } catch (e) {
      console.error("❌ createScheduleItem", e);
    }
  },
  async deleteScheduleItem(id: number): Promise<void> {
    const sp = getSP();
    await sp.web.lists.getByTitle("NurseSchedule").items.getById(id).delete();
  }
  
};

/* ------------------------------------------------------------------ */
/* helper to find overlaps                                            */
/* ------------------------------------------------------------------ */

/* helper to detect overlaps (replace the old version) */
export function detectUserScheduleConflicts(
  items: NurseScheduleItem[]
): NurseScheduleItem[] {
  const groups = new Map<string, NurseScheduleItem[]>();

  for (const it of items) {
    const key = `${it.User?.EMail}-${isoDay(it.ShiftDate)}-${it.ShiftType}`;
    (groups.get(key) ?? groups.set(key, []).get(key))!.push(it);
  }

  /* keep only groups with >1 item, then flatten */
  return Array.from(groups.values())
              .filter(g => g.length > 1)
              .flat();
}

export default spListService;
