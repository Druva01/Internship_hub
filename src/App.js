import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Components
import LandingPage from './components/LandingPage';
import About from './components/About';
import Contact from './components/Contact';
import QuickAdminSetup from './components/QuickAdminSetup';
import Login from './components/Login';
import Register from './components/Register';
import StudentDashboard from './components/StudentDashboard';
import SetupGuide from './components/SetupGuide';
import AdminLogin from './components/admin/AdminLogin';
import AdminRegister from './components/admin/AdminRegister';
import ModernAdminDashboard from './components/admin/ModernAdminDashboard';
import AdminDashboardNew from './components/admin/AdminDashboardNew';
import AdvancedSettings from './components/admin/AdvancedSettings';
import AdminApplications from './components/admin/AdminApplications';
import CreateInternship from './components/admin/CreateInternship';
import EditInternship from './components/admin/EditInternship';
import ManageInternships from './components/admin/ManageInternships';
import InternshipBrowser from './components/InternshipBrowser';
import MyApplications from './components/student/MyApplications';
import SubmitTaskUpdate from './components/student/SubmitTaskUpdate';
import MyTaskUpdates from './components/student/MyTaskUpdates';
import AdminTaskReviews from './components/admin/AdminTaskReviews';
import MyAttendance from './components/student/MyAttendance';
import AdminAttendanceReviews from './components/admin/AdminAttendanceReviews';
import UserProfile from './components/UserProfile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/quick-admin-setup" element={<QuickAdminSetup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/setup-guide" element={<SetupGuide />} />
            
            {/* Student Routes */}
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/internships" element={<InternshipBrowser />} />
            <Route path="/my-applications" element={<MyApplications />} />
            <Route path="/submit-task" element={<SubmitTaskUpdate />} />
            <Route path="/my-tasks" element={<MyTaskUpdates />} />
            <Route path="/my-attendance" element={<MyAttendance />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/register" element={<AdminRegister />} />
            <Route path="/admin/dashboard" element={<AdminDashboardNew />} />
            <Route path="/admin/settings" element={<AdvancedSettings />} />
            <Route path="/admin/applications" element={<AdminApplications />} />
            <Route path="/admin/task-reviews" element={<AdminTaskReviews />} />
            <Route path="/admin/create-internship" element={<CreateInternship />} />
            <Route path="/admin/edit-internship/:id" element={<EditInternship />} />
            <Route path="/admin/internships" element={<ManageInternships />} />
            <Route path="/admin/old-dashboard" element={<ModernAdminDashboard />} />
            <Route path="/admin/attendance-reviews" element={<AdminAttendanceReviews />} />
            
            {/* Add more routes as needed */}
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
