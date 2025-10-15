import API from './api';

/**
 * Fetch available roles for assignment to users.
 * @returns {Promise<Array<{_id:string,name:string,displayName:string}>>}
 */
export async function getRoles() {
  const { data } = await API.get('/api/roles');
  return data;
}

export default { getRoles };
