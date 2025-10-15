import { useEffect, useMemo, useState } from 'react';
import { getRoles } from '../services/roles';
import { createUser, listUsers } from '../services/users';

export default function AdminUsers() {
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [r, u] = await Promise.all([getRoles(), listUsers()]);
        setRoles(r);
        setUsers(u);
      } catch (e) {
        setError('Failed to load roles or users');
      }
    })();
  }, []);

  const roleOptions = useMemo(
    () => roles.map((r) => ({ value: r.name, label: r.displayName })),
    [roles]
  );

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setError('');
    setSuccess('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.firstName || !form.email || !form.password || !form.role) {
      setError('First name, email, password and role are required');
      return;
    }
    setLoading(true);
    try {
      await createUser(form);
      setSuccess('User created');
      setForm({ firstName: '', lastName: '', email: '', password: '', role: '' });
      const refreshed = await listUsers();
      setUsers(refreshed);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">User Management</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Create users and assign a user type (role).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Add new user</h3>
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">First name <span className="text-red-500">*</span></label>
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={onChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Jane"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Last name</label>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={onChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="jane@example.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Password <span className="text-red-500">*</span></label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Strong password"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">User type <span className="text-red-500">*</span></label>
              <select
                name="role"
                value={form.role}
                onChange={onChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="" disabled>Select a role</option>
                {roleOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">
                {success}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Creating…' : 'Create user'}
              </button>
            </div>
          </form>
        </section>

        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Existing users</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Name</th>
                  <th scope="col" className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Email</th>
                  <th scope="col" className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Roles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-2">
                      {`${u.firstName || ''} ${u.lastName || ''}`.trim() || '—'}
                    </td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">{(u.roles || []).map((r) => r.displayName).join(', ') || '—'}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
