import { AiResponse } from '../components/ChatBox/types';
import { CHAT_API_URL } from './apiConfig';



export const sendChatToBackend = async (
  message: string,
  currentUserName: string,
  currentUserEmail: string,
  userId: number
): Promise<AiResponse | string> => {
  try {
    console.log('📤 Sending message to backend:', message);
    const response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        currentUserName,
        currentUserEmail,
        UserId: userId
      })
    });

    const data = await response.json();

    if (data.intent) {
      return {
        intent: data.intent,
        ShiftStartDate: data.ShiftStartDate,
        shift_type: data.ShiftType,
        reply: data.reply || undefined
      };
    } else {
      return '🤖 No intent detected.';
    }
  } catch (error) {
    console.error('❌ Error calling backend:', error);
    return '⚠️ Assistant is currently unavailable.';
  }
};
