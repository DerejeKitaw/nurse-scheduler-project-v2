export type QuickReply = { title: string; payload: string };

export type Message = {
  sender : "user" | "ai";
  content: string;
  quick? : QuickReply[];
  timestamp: number;
};

export type Shift = "Morning" | "Afternoon" | "Night";

export interface ScheduleState {
  shiftDate?: string;
  shiftType?: Shift;
  awaiting?: "shiftDate" | "shiftType";
  confirmationPending: boolean;
  isResolved?: boolean;
}

export interface AiResponse {
  intent: "schedule_shift" | "availability" | "check_availability" | "unknown";
  ShiftStartDate?: string | null;
  shift_type?: string | null;   // backend snake_case
  ShiftType?: string | null;    // backend camelCase
  raw_date_phrase?: string | null;
  reply?: string | null;
}
