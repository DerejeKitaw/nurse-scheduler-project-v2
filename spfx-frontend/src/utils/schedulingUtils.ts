// src/agents/schedulingUtils.ts

export const requiredFields = ['days', 'shiftType', 'hours'];

export function extractSchedulingInfo(message: string): Partial<Record<string, string>> {
  const info: Partial<Record<string, string>> = {};

  if (/monday|tuesday|wednesday|thursday|friday|saturday|sunday/i.test(message)) {
    info.days = 'provided';
  }

  if (/morning|evening|night|day shift|night shift/i.test(message)) {
    info.shiftType = 'provided';
  }

  if (/\b\d{1,2}(:\d{2})?\s?(am|pm)?\b|\bhour(s)?\b/i.test(message)) {
    info.hours = 'provided';
  }

  return info;
}

export function getMissingFieldsText(missing: string[]): string {
    console.log("Missing fields:", missing); 
  return (
    `Sure! To help you schedule your shift for next week, I’ll need the following information:\n` +
    `${missing.includes('days') ? "1. **Your availability**: What days and times are you available to work?\n" : ""}` +
    `${missing.includes('shiftType') ? "2. **Shift types**: Do you prefer morning, evening, or night?\n" : ""}` +
    `${missing.includes('hours') ? "3. **Hours per shift**: How many hours do you want to work per shift?\n" : ""}` +
    `Please provide these details and I’ll create a tailored schedule for you.`
  );
}
