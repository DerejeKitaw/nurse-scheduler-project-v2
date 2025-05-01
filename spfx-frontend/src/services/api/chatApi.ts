import axios from 'axios';

const BACKEND_BASE_URL = 'http://localhost:5000';

export const sendMessageToBackend = async (message: string, userId: string): Promise<string> => {
  console.log('Sending message to backend:', message, userId);
  try {
    const res = await axios.post(`${BACKEND_BASE_URL}/api/intent`, {
      message,
      userId
    });
    return res.data.reply;
  } catch (error) {
    console.error('API error:', error);
    throw new Error('Failed to fetch reply from backend');
  }
};
