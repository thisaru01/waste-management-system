import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute, { RoleGuard } from './routes/ProtectedRoute.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Admin from './pages/Admin.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import Analytics from './pages/Analytics.jsx';
import Report from './pages/Report.jsx';
import ComingSoon from './pages/ComingSoon.jsx';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/reports" element={<Report />} />
              <Route element={<RoleGuard roles={["admin"]} />}>
                <Route path="/admin" element={<Admin />}>
                  <Route index element={<AdminUsers />} />
                  <Route path="users" element={<AdminUsers />} />
                </Route>
              </Route>
              {/* Placeholder pages for planned sections */}
              <Route path="/coming-soon/:slug" element={<ComingSoon title="Coming Soon" />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;