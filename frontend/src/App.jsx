import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute, { RoleGuard } from './routes/ProtectedRoute.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Admin from './pages/Admin.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminSensorSim from './pages/AdminSensorSim.jsx';
import ComingSoon from './pages/ComingSoon.jsx';
import SchedulePickup from './pages/SchedulePickup.jsx';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/schedule-pickup" element={<SchedulePickup />} />
              <Route element={<RoleGuard roles={["admin"]} />}>
                <Route path="/admin" element={<Admin />}>
                  <Route index element={<AdminUsers />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="sensors" element={<AdminSensorSim />} />
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