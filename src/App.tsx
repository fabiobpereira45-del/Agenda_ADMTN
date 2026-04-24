import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/public/Home';
import PreSchedule from './pages/public/PreSchedule';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AdminDashboard from './pages/admin/Dashboard';
import ManageEvents from './pages/admin/ManageEvents';
import ManagePendingEvents from './pages/admin/ManagePendingEvents';
import ManageLeaders from './pages/admin/ManageLeaders';
import ManageDepartments from './pages/admin/ManageDepartments';
import ManageCommemorative from './pages/admin/ManageCommemorative';
import ManageAccess from './pages/admin/ManageAccess';
import UpdatePassword from './pages/admin/UpdatePassword';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="pre-agenda" element={<PreSchedule />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="pending-events" element={<ManagePendingEvents />} />
          <Route path="events" element={<ManageEvents />} />
          <Route path="commemorative" element={<ManageCommemorative />} />
          <Route path="leaders" element={<ManageLeaders />} />
          <Route path="departments" element={<ManageDepartments />} />
          <Route path="access" element={<ManageAccess />} />
          <Route path="profile/password" element={<UpdatePassword />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
