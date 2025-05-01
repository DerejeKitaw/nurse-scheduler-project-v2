import axios from 'axios';
import { API_BASE_URL } from '../../config';

export interface AvailabilityRequestPayload {
  userId: string;
  message: string;
  scheduleData: unknown;
}

export const sendAvailabilityCheck = async (payload: AvailabilityRequestPayload): Promise<string> => {
  console.log('Sending availability check request to backend:', payload);
  const response = await axios.post<{ reply: string }>(`${API_BASE_URL}/availability`, payload);
  return response.data.reply;
};
