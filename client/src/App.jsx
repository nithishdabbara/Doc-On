import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import SearchDoctors from './pages/SearchDoctors';
import DoctorRegistration from './pages/DoctorRegistration';
import DoctorDetails from './pages/DoctorDetails';
import AdminDashboard from './pages/AdminDashboard';
import AdminAppointments from './pages/AdminAppointments';
import AdminDoctorDetails from './pages/AdminDoctorDetails';
import AdminAnalytics from './pages/AdminAnalytics'; // Phase 1 Advanced AI
import DoctorProfile from './pages/DoctorProfile';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminLogin from './pages/AdminLogin';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import PatientSignup from './pages/PatientSignup';
import PatientDashboard from './pages/PatientDashboard';
import MeetingRoom from './pages/MeetingRoom';
import VerifyEmail from './pages/VerifyEmail';
import Footer from './components/Footer';
import LabMarketplace from './pages/LabMarketplace';
import LabLogin from './pages/LabLogin';
import LabDashboard from './pages/LabDashboard';
import LabSignup from './pages/LabSignup';

import LabDetail from './pages/LabDetail';
import MembershipPage from './pages/MembershipPage';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    // Force scroll to top on all possible scroll containers
    window.scrollTo(0, 0);
    document.documentElement.scrollTo(0, 0);
    document.body.scrollTo(0, 0);

    // Fallback for race conditions
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
};

// Layout Component to handle Navbar/Footer conditional rendering
const Layout = ({ children }) => {
  const location = useLocation();
  const hideHeaderFooter = ['/login', '/admin'];

  // Check if current path starts with any of the hidden paths (exact match for login, specific for admin)
  const shouldHide = location.pathname === '/login' || location.pathname === '/admin';

  return (
    <>
      {!shouldHide && <Navbar />}
      <main>{children}</main>
      {!shouldHide && <Footer />}
    </>
  );
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="app-container">
        <Layout>
          <Routes>
            {/* Admin Protected Routes */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
            <Route path="/admin/appointments" element={<AdminRoute><AdminAppointments /></AdminRoute>} />
            <Route path="/admin/doctor/:id" element={<AdminRoute><AdminDoctorDetails /></AdminRoute>} />

            {/* Other Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/search-doctors" element={<SearchDoctors />} />
            <Route path="/doctor/:id" element={<DoctorDetails />} />

            {/* Standardized Routes */}
            <Route path="/doctor/signup" element={<DoctorRegistration />} />
            <Route path="/patient/signup" element={<PatientSignup />} />

            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/doctor/profile/:id" element={<DoctorProfile />} />
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/patient/dashboard" element={<PatientDashboard />} />
            <Route path="/meeting/:roomName" element={<MeetingRoom />} />
            <Route path="/diagnostics" element={<LabMarketplace />} />
            <Route path="/lab/:id" element={<LabDetail />} />
            <Route path="/lab/login" element={<LabLogin />} />
            <Route path="/lab/dashboard" element={<LabDashboard />} />
            <Route path="/lab/signup" element={<LabSignup />} />
            {/* <Route path="/ai-assistant" element={<AIAssistant />} /> */}
            <Route path="/membership" element={<MembershipPage />} />
          </Routes>
        </Layout>
      </div>
    </Router>
  );
}

// Simple Admin Route Protection
const AdminRoute = ({ children }) => {
  const location = useLocation();
  const token = sessionStorage.getItem('adminToken') || sessionStorage.getItem('token');
  const userStr = sessionStorage.getItem('user');
  let userType = null;

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      userType = user.type;
    } catch (e) {
      console.error("Error parsing user from storage", e);
    }
  }

  if (!token || userType !== 'admin') {
    sessionStorage.setItem('adminRedirect', location.pathname);
    return <Navigate to="/admin" replace />;
  }
  return children;
};

// App Component - Routes Configured
export default App;

