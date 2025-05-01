// src/agents/schedulingAgent.ts

import { sendScheduleRequest } from "../services/agent/agentRouter";
import spListService from "../services/sp/spListService";
import {
  extractSchedulingInfo,
  getMissingFieldsText,
  requiredFields
} from "../utils/schedulingUtils";

export interface ScheduleRequestPayload {
  userId: string;
  extracted: Record<string, string>;
  nurseData: unknown;
  originalMessage: string;
}

export const SchedulingAgent = async (message: string, userId: string): Promise<string> => {
  const extractedPartial = extractSchedulingInfo(message);
  const missing = requiredFields.filter(field => !extractedPartial[field]);

  if (missing.length > 0) {
    return getMissingFieldsText(missing);
  }

  try {
    const nurseData = await spListService.getUserScheduleById(userId);

    if (!nurseData) {
      return "❌ I couldn’t find your schedule info. Please make sure you’re registered in the NurseSchedule list.";
    }

    const extracted = extractedPartial as Record<string, string>;

    const payload: ScheduleRequestPayload = {
      userId,
      extracted,
      nurseData,
      originalMessage: message
    };

    await sendScheduleRequest(payload);

    return "✅ Your schedule request has been submitted!";
  } catch (error) {
    console.error("SchedulingAgent error:", error);
    return "❌ Sorry, something went wrong while processing your schedule.";
  }
};
