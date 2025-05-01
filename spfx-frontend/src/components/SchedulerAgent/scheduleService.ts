import { SCHEDULE_API_URL } from "../../services/apiConfig";
import { CreateSchedulePayload } from "../../types/types";




export const createScheduleItem = async (scheduleData: CreateSchedulePayload): Promise<boolean> => {
  try {
    console.log('📤 Sending schedule to backend:', scheduleData);

    const response = await fetch(SCHEDULE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduleData)
    });

    if (!response.ok) {
      console.error('❌ Schedule creation failed:', response.statusText);
      return false;
    }

    console.log('✅ Schedule created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating schedule:', error);
    return false;
  }
};
