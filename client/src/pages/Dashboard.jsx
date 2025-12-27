import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';
import AppointmentList from '../components/AppointmentList';
import CalendarView from '../components/CalendarView';
import PrescriptionList from '../components/PrescriptionList';
import PatientProfile from '../components/PatientProfile';
import BillList from '../components/BillList';
import FinancialCharts from '../components/FinancialCharts';
import EmergencyButton from '../components/EmergencyButton';
import SmartSymptomChecker from '../components/SmartSymptomChecker';
import AdminVerifyPanel from '../components/AdminVerifyPanel';
import PatientProfileForm from '../components/PatientProfileForm';
import Settings from './Settings';
import MedicalRecords from '../components/MedicalRecords';
import AdminPatientList from '../components/AdminPatientList';
import HealthRiskAnalyzer from '../components/HealthRiskAnalyzer';
import ChatWindow from '../components/ChatWindow';

const Dashboard = () => {
    const { user, loadUser } = useAuth();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const tab = queryParams.get('tab') || 'dashboard';

    const [stats, setStats] = useState(null);

    // Sync User State (Fix for Stale Status)
    useEffect(() => {
        // 1. Doctor Verification Check
        if (user && user.role === 'doctor' && !user.isVerified) {
            loadUser();
        }
        // 2. Patient Profile Check - if incomplete, re-fetch to be sure
        if (user && user.role === 'patient' && (!user.profile?.age || !user.profile?.gender)) {
            loadUser();
        }
    }, []); // Run ONCE on mount

    useEffect(() => {
        if (user && (user.role === 'admin' || user.role === 'doctor' || user.role === 'patient')) {
            api.get('/users/stats')
                .then(res => setStats(res.data))
                .catch(err => console.error(err));
        }
    }, [user]);

    const renderContent = () => {
        if (!user) return null;

        // --- Common Tabs ---
        if (tab === 'appointments') {
            return (
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Manage Appointments</h2>
                        {user.role === 'patient' && (
                            <Link to="/book-appointment" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                                + Book Appointment
                            </Link>
                        )}
                    </div>
                    <AppointmentList role={user.role} />
                </div>
            );
        }

        if (tab === 'bills') {
            return (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">Medical Bills</h2>
                    <BillList />
                </div>
            );
        }

        if (['finance', 'reports'].includes(tab)) {
            return (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold capitalize">{tab} & Analytics</h2>
                    <FinancialCharts />
                </div>
            );
        }

        if (tab === 'settings') {
            return <Settings />;
        }

        if (tab === 'records') {
            return <MedicalRecords />;
        }

        if (tab === 'health-check') {
            return <HealthRiskAnalyzer />;
        }

        if (tab === 'medications') {
            return (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">Medical Prescriptions</h2>
                    <PrescriptionList patientId={user._id} />
                </div>
            );
        }

        if (tab === 'messages') {
            return <ChatWindow />;
        }

        // --- Role Specific Dashboard Homes ---

        // 1. PATIENT VIEW
        if (user.role === 'patient') {
            return (
                <div className="space-y-6 animate-fade-in">
                    {/* Welcome Banner */}
                    <div className="relative bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-3xl font-bold mb-2">Welcome back, {user.name}! 👋</h2>
                            <p className="opacity-90">Your health dashboard is ready. You have {stats?.upcoming || 0} upcoming appointments.</p>
                        </div>
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl transform -translate-x-10 translate-y-10"></div>
                    </div>

                    <div className="backdrop-blur-xl bg-white/60 border border-white/40 p-1 rounded-2xl shadow-lg">
                        <PatientProfile />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/70 backdrop-blur-lg border border-white/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition duration-300">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="bg-blue-100 text-blue-600 p-2 rounded-lg">📅</span>
                                <h3 className="font-bold text-xl text-gray-800">Recent Appointments</h3>
                            </div>
                            <AppointmentList role="patient" />
                        </div>

                        <div className="bg-white/70 backdrop-blur-lg border border-white/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition duration-300">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="bg-green-100 text-green-600 p-2 rounded-lg">⚡</span>
                                <h3 className="font-bold text-xl text-gray-800">Quick Actions</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Link to="/book-appointment" className="group p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl hover:bg-blue-200 transition border border-blue-100 text-center">
                                    <span className="text-2xl mb-1 block group-hover:scale-110 transition">➕</span>
                                    <span className="font-bold text-blue-900 text-sm">Book New</span>
                                </Link>
                                <Link to="/dashboard?tab=messages" className="group p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl hover:bg-green-200 transition border border-green-100 text-center">
                                    <span className="text-2xl mb-1 block group-hover:scale-110 transition">💬</span>
                                    <span className="font-bold text-green-900 text-sm">Message Doctor</span>
                                </Link>
                                <Link to="/dashboard?tab=bills" className="group p-4 bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-xl hover:bg-yellow-200 transition border border-yellow-100 text-center">
                                    <span className="text-2xl mb-1 block group-hover:scale-110 transition">🧾</span>
                                    <span className="font-bold text-yellow-900 text-sm">View Bills</span>
                                </Link>
                                <Link to="/dashboard?tab=medications" className="group p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl hover:bg-purple-200 transition border border-purple-100 text-center">
                                    <span className="text-2xl mb-1 block group-hover:scale-110 transition">💊</span>
                                    <span className="font-bold text-purple-900 text-sm">My Meds</span>
                                </Link>
                                <Link to="/dashboard?tab=records" className="group p-4 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl hover:bg-indigo-200 transition border border-indigo-100 text-center">
                                    <span className="text-2xl mb-1 block group-hover:scale-110 transition">📂</span>
                                    <span className="font-bold text-indigo-900 text-sm">Records</span>
                                </Link>
                                <Link to="/dashboard?tab=health-check" className="group p-4 bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-xl hover:bg-rose-200 transition border border-rose-100 text-center">
                                    <span className="text-2xl mb-1 block group-hover:scale-110 transition">🤖</span>
                                    <span className="font-bold text-rose-900 text-sm">AI Check</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // 2. DOCTOR VIEW
        else if (user.role === 'doctor') {
            if (tab === 'calendar') {
                return (
                    <div className="bg-white/80 backdrop-blur-lg border border-white/50 p-6 rounded-2xl shadow-xl animate-fade-in">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Master Schedule</h2>
                        <CalendarView />
                    </div>
                );
            }

            if (tab === 'patients') {
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-white drop-shadow-sm">My Patients</h2>
                        <AdminPatientList />
                    </div>
                );
            }

            return (
                <div className="space-y-6 animate-fade-in">
                    {/* Welcome Banner */}
                    <div className="relative bg-gradient-to-r from-blue-600 to-teal-500 rounded-2xl p-6 text-white shadow-xl overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-3xl font-bold mb-2">Dr. {user.name}, Ready for rounds? 🩺</h2>
                            <p className="opacity-90">You have {stats?.appointmentsToday || 0} appointments scheduled for today.</p>
                        </div>
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl transform -translate-x-10 translate-y-10"></div>
                    </div>

                    {/* Doctor Dashboard Home */}
                    <div className="bg-white/80 backdrop-blur-lg border border-white/50 p-6 rounded-2xl shadow-xl">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Doctor's Schedule</h2>
                        <CalendarView />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-blue-600/90 backdrop-blur text-white p-6 rounded-2xl shadow-lg hover:-translate-y-1 transition duration-300">
                            <h3 className="text-lg font-bold opacity-90">Upcoming</h3>
                            <p className="text-4xl font-extrabold mt-2">{stats ? stats.appointmentsToday : '--'}</p>
                            <p className="text-sm opacity-75">Appointments today</p>
                        </div>
                        <div className="bg-green-600/90 backdrop-blur text-white p-6 rounded-2xl shadow-lg hover:-translate-y-1 transition duration-300">
                            <h3 className="text-lg font-bold opacity-90">Patients</h3>
                            <p className="text-4xl font-extrabold mt-2">{stats ? stats.totalPatients : '--'}</p>
                            <p className="text-sm opacity-75">Total registered</p>
                        </div>
                        <div className="bg-purple-600/90 backdrop-blur text-white p-6 rounded-2xl shadow-lg hover:-translate-y-1 transition duration-300">
                            <h3 className="text-lg font-bold opacity-90">Wallet</h3>
                            <p className="text-4xl font-extrabold mt-2">${stats ? stats.wallet : '0'}</p>
                            <p className="text-sm opacity-75">Earnings this month</p>
                        </div>
                    </div>
                </div>
            );
        }

        // 3. ADMIN VIEW
        else if (user.role === 'admin') {
            if (tab === 'patients') {
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Patient Management</h2>
                        <AdminPatientList />
                    </div>
                );
            }

            if (tab === 'doctors') {
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Doctor Management</h2>
                        <AdminVerifyPanel />
                    </div>
                );
            }

            if (tab === 'calendar') {
                return (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-bold mb-4">Master Schedule</h2>
                        <CalendarView />
                    </div>
                );
            }

            // Default Admin Dashboard
            return (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Admin Dashboard</h2>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                            <h3 className="text-gray-500 text-sm">Total Patients</h3>
                            <p className="text-2xl font-bold">{stats?.totalPatients || 0}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                            <h3 className="text-gray-500 text-sm">Total Doctors</h3>
                            <p className="text-2xl font-bold">{stats?.totalDoctors || 0}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
                            <h3 className="text-gray-500 text-sm">Appointments</h3>
                            <p className="text-2xl font-bold">{stats?.totalAppointments || 0}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
                            <h3 className="text-gray-500 text-sm">Total Revenue</h3>
                            <p className="text-2xl font-bold">${stats?.revenue || 0}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="font-bold text-lg mb-4">System Reports</h3>
                            <ul className="space-y-3">
                                <li className="flex justify-between p-3 bg-gray-50 rounded">
                                    <span>Server Uptime</span>
                                    <span className="text-blue-600 font-bold">99.9%</span>
                                </li>
                                <li className="flex justify-between p-3 bg-gray-50 rounded">
                                    <span>Database Health</span>
                                    <span className="text-green-600 font-bold">Good</span>
                                </li>
                            </ul>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Link to="/dashboard?tab=doctors" className="p-4 bg-indigo-50 text-indigo-700 rounded text-center hover:bg-indigo-100 font-semibold">
                                    Verify Doctors
                                </Link>
                                <Link to="/dashboard?tab=finance" className="p-4 bg-emerald-50 text-emerald-700 rounded text-center hover:bg-emerald-100 font-semibold">
                                    View Finance
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    };

    // Dynamic Backgrounds for Patient & Doctor Tabs
    const getRoleBasedBackground = (role, currentTab) => {
        if (role === 'patient') {
            const backgrounds = {
                'dashboard': 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80',
                'appointments': 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&q=80',
                'bills': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80',
                'medications': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80',
                'records': 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80',
                'messages': 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&q=80',
                'health-check': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80',
            };
            return backgrounds[currentTab] || backgrounds['dashboard'];
        }

        if (role === 'doctor') {
            const backgrounds = {
                'dashboard': 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80', // Doctor Desk
                'calendar': 'https://images.unsplash.com/photo-1506784365371-1634b67916c3?auto=format&fit=crop&q=80', // Calendar/Planner
                'patients': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80', // Hospital Hallway
                'finance': 'https://images.unsplash.com/photo-1554224155-9ffd4cb55931?auto=format&fit=crop&q=80', // Financial
            };
            return backgrounds[currentTab] || backgrounds['dashboard'];
        }

        return '';
    };

    const hasBackground = true; // Always show background now (or default to gray-100 fallback via generic)

    // Generic Background for Admin/Others
    const getGenericBackground = (role, tab) => {
        if (role === 'admin') return 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80'; // Modern Office
        // Default Fallback
        return '';
    }

    const bgImage = getRoleBasedBackground(user.role, tab) || getGenericBackground(user.role, tab);

    return (
        <div
            className={`flex h-screen transition-all duration-700 ease-in-out ${bgImage ? "bg-cover bg-fixed bg-center" : "bg-gray-100"}`}
            style={bgImage ? { backgroundImage: `url('${bgImage}')` } : {}}
        >
            {/* Global Overlay for contrast */}
            {bgImage && <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-none fixed z-0"></div>}

            {/* Sidebar (Glassmorphic) */}
            <Sidebar role={user?.role} />

            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                {/* Header (Transparent) */}
                <div className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
                    <TopHeader />
                </div>

                {/* Main Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
                    <div className="relative z-10 max-w-7xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            {/* Dynamic Header based on Tab */}
                            <h1 className="text-2xl font-bold text-white drop-shadow-md">
                                {tab === 'dashboard' ? `Welcome, ${user?.name}` : ''}
                            </h1>
                            <EmergencyButton />
                        </div>

                        {/* Verification Check for Doctors */}
                        {user?.role === 'doctor' && !user.isVerified && (
                            <div className="bg-yellow-50/90 backdrop-blur border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg shadow">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 g0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-lg leading-6 font-medium text-yellow-800">Account Pending Verification</h3>
                                        <div className="mt-2 text-sm text-yellow-700">
                                            <p>Your medical license is currently under review by our administration team. You will have full access once verified.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Profile Check for Patients - Force Profile Completion */}
                        {user?.role === 'patient' && (!user.profile?.age || !user.profile?.gender) && tab === 'dashboard' ? (
                            <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-xl">
                                <PatientProfileForm user={user} onComplete={loadUser} />
                            </div>
                        ) : (
                            <>
                                {/* AI-Lite Assistant for Patients */}
                                {user?.role === 'patient' && tab === 'dashboard' && (
                                    <div className="mb-6 transform hover:scale-[1.01] transition duration-300">
                                        <SmartSymptomChecker />
                                    </div>
                                )}

                                {renderContent()}
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
