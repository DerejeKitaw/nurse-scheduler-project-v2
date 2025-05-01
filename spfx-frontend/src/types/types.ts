// 🎭 Avatar Options
export type AvatarOption = 'avatar1' | 'avatar2' | 'avatar3' | 'none';

// 👤 Shared User Info
export interface UserIdentity {
  currentUserName: string;
  currentUserEmail: string;
  userId: number;
}


// 📩 Payload to Create Schedule
export interface CreateSchedulePayload {
  currentUserEmail: string;
  currentUserName: string;
  userId: number; // ✅ lowercase
  ShiftStartDate: string;
  ShiftEndDate: string;
  ShiftType: string;
  Role?: string;
  WorkHours?: number;
}






// 📋 Nurse Master List Item
export interface NurseItem {
  Id: number;
  Title: string;
  Email: string;
  Role?: string;
  [key: string]: unknown;
}

// 📅 Schedule Submission Format
export interface ScheduleItem {
  ShiftStartDate: string;
  ShiftEndDate: string;
  ShiftType: string;
  WorkHours: number;
  currentUserEmail: string;
  currentUserName: string;
  UserId?: string;
}

// 📅 Schedule Item with Expanded User Info
export interface NurseScheduleItem {
  Id: number;
  Title: string;
  ShiftType: string;
  ShiftDate: string;
  ShiftEndDate?: string;
  WorkHours?: number;
  Role?: string;
  User?: {
    Id: number;
    Title: string;
    EMail: string;
  };
  [key: string]: unknown;
}


/* ------------------------------------------------------------------ */
/*  Message – add rich-bubble helpers                                 */
/* ------------------------------------------------------------------ */
export interface Message {
  sender:        "user" | "ai";
  role:          "user" | "ai";
  content:       string;          // what we actually render
  text:          string;          // ← keep for legacy
  timestamp:     string;
  quickReplies?: { title: string; payload: string }[];
  kind?:         "text" | "calendar";
}



// export interface ScheduleState {
//   intent?: string;
//   shiftDate?: string | null;
//   shiftType?: "Morning" | "Afternoon" | "Night" | null;
//   role?: string;
//   awaiting?: "shiftDate" | "shiftType";
//   isResolved: boolean;
//   confirmationPending: boolean;
//   rawWeekday?: string; 
// }
export interface ChatBoxProps {
  currentUserName: string;
  currentUserEmail: string;
  userId: number;
  userImageUrl?: string;                 // optional → string | undefined
  aiAvatarOption?: "avatar1" | "avatar2" | "avatar3" | "none";
  useAiAvatar?: boolean;
  showScheduleFormModal?: () => void;
}
