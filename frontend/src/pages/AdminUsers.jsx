import { useEffect, useMemo, useState } from 'react';
import { getRoles } from '../services/roles';
import { createUser, listUsers } from '../services/users';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import { Card, CardContent, CardHeader } from '../components/ui/Card.jsx';
import { Table, TableContainer, TBody, THead, TH, TD } from '../components/ui/Table.jsx';
import LayoutGrid from '../components/ui/LayoutGrid.jsx';

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

      <LayoutGrid
        left={
          <Card>
            <CardHeader title="Add new user" />
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input name="firstName" value={form.firstName} onChange={onChange} required label="First name" placeholder="Jane" />
                  <Input name="lastName" value={form.lastName} onChange={onChange} label="Last name" placeholder="Doe" />
                </div>
                <Input type="email" name="email" value={form.email} onChange={onChange} required label="Email" placeholder="jane@example.com" />
                <Input type="password" name="password" value={form.password} onChange={onChange} required label="Password" placeholder="Strong password" />
                <Select name="role" value={form.role} onChange={onChange} required label="User type">
                  <option value="" disabled>Select a role</option>
                  {roleOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
                {error && (
                  <div className="rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
                )}
                {success && (
                  <div className="rounded-md border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">{success}</div>
                )}
                <div className="pt-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating…' : 'Create user'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        }
        right={
          <Card>
            <CardHeader title="Existing users" />
            <CardContent>
              <TableContainer>
                <Table>
                  <THead>
                    <tr>
                      <TH>Name</TH>
                      <TH>Email</TH>
                      <TH>Roles</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-gray-50">
                        <TD>{`${u.firstName || ''} ${u.lastName || ''}`.trim() || '—'}</TD>
                        <TD>{u.email}</TD>
                        <TD>{(u.roles || []).map((r) => r.displayName).join(', ') || '—'}</TD>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <TD colSpan={3}>
                          <div className="px-4 py-6 text-center text-gray-500">No users found.</div>
                        </TD>
                      </tr>
                    )}
                  </TBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        }
      />
    </div>
  );
}
