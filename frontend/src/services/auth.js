import API from './api';

export async function login(email, password) {
  const { data } = await API.post('/api/auth/login', { email, password });
  return data; // { token, user }
}
