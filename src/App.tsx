import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/public/Home';
import PreSchedule from './pages/public/PreSchedule';
import Login from './pages/auth/Login';
import AdminDashboard from './pages/admin/Dashboard';
import ManageEvents from './pages/admin/ManageEvents';
import ManageLeaders from './pages/admin/ManageLeaders';
import ManageDepartments from './pages/admin/ManageDepartments';
import ManageCommemorative from './pages/admin/ManageCommemorative';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="pre-agenda" element={<PreSchedule />} />
        </Route>

        <Route path="/login" element={<Login />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="events" element={<ManageEvents />} />
          <Route path="commemorative" element={<ManageCommemorative />} />
          <Route path="leaders" element={<ManageLeaders />} />
          <Route path="departments" element={<ManageDepartments />} />
        </Route>
      </Routes>
    </Router>
  );
}
