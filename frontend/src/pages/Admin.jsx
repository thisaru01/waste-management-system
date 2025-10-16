import { Link, Outlet } from 'react-router-dom';

export default function Admin() {
  return (
    <div style={{ padding: 20 }}>
      <h2>Admin Dashboard</h2>

      <nav style={{ marginTop: 12 }}>
        <Link to="/admin/users">User Management</Link>
      </nav>
      <div style={{ marginTop: 16 }}>
        <Outlet />
      </div>
    </div>
  );
}
