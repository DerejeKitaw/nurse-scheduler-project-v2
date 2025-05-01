import axios from 'axios';
import { API_BASE_URL } from '../../config';

export interface ConflictRequestPayload {
  userId: string;
  message: string;
  scheduleData: unknown;
}

export const sendConflictCheck = async (payload: ConflictRequestPayload): Promise<string> => {

  console.log('Sending conflict check request to backend:', payload);
  const response = await axios.post<{ reply: string }>(`${API_BASE_URL}/conflict`, payload);
  return response.data.reply;
};
