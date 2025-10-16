import API from './api';

export async function createUser({ firstName, lastName, email, password, role, binLocation }) {
  const body = { email, password, firstName, lastName, roles: [role] };
  if (role === 'bin-owner') body.binLocation = binLocation;
  const { data } = await API.post('/api/users', body);
  return data;
}

export async function listUsers() {
  const { data } = await API.get('/api/users');
  return data;
}

export async function listCollectors() {
  const { data } = await API.get('/api/users');
  // Filter client-side by role name === 'collector'
  const isCollector = (u) => Array.isArray(u.roles) && u.roles.some((r) => (r.name || r)?.toString?.().toLowerCase?.() === 'collector');
  return (data || []).filter(isCollector);
}

export default { createUser, listUsers, listCollectors };
