import axios from 'axios';
import { API_BASE_URL } from '../../config';

export interface ScheduleRequestPayload {
  userId: string;
  extracted: Record<string, string>;
  nurseData: unknown;
  originalMessage: string;
}

export const sendScheduleRequest = async (payload: ScheduleRequestPayload): Promise<string> => {
  console.log('Sending schedule request to backend:', payload);
  const response = await axios.post<{ reply: string }>(`${API_BASE_URL}/schedule`, payload);
  return response.data.reply;
};
