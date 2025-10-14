import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

export const checkBackend = async () => {
  const response = await API.get('/');
  return response.data;
};

export default API;
