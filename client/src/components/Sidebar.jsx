import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    // Helper to determine active state
    const isActive = (path, searchParam) => {
        if (searchParam) {
            return location.search.includes(searchParam) ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white';
        }
        return location.pathname === path && !location.search ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white';
    };

    const linkClasses = "flex items-center space-x-3 py-3 px-4 rounded-lg transition duration-200 mb-1";

    const renderLinks = () => {
        if (!user) return null;

        if (user.role === 'patient') {
            return (
                <>
                    <Link to="/dashboard" className={`${linkClasses} ${isActive('/dashboard')}`}>
                        <span className="text-xl">🏠</span><span className="font-medium">Dashboard</span>
                    </Link>
                    <Link to="/dashboard?tab=appointments" className={`${linkClasses} ${isActive('/dashboard', 'appointments')}`}>
                        <span className="text-xl">📅</span><span className="font-medium">Appointments</span>
                    </Link>
                    <Link to="/dashboard?tab=bills" className={`${linkClasses} ${isActive('/dashboard', 'bills')}`}>
                        <span className="text-xl">🧾</span><span className="font-medium">Medical Bills</span>
                    </Link>
                    <Link to="/dashboard?tab=records" className={`${linkClasses} ${isActive('/dashboard', 'records')}`}>
                        <span className="text-xl">📂</span><span className="font-medium">Records</span>
                    </Link>
                    <Link to="/dashboard?tab=medications" className={`${linkClasses} ${isActive('/dashboard', 'medications')}`}>
                        <span className="text-xl">💊</span><span className="font-medium">Medications</span>
                    </Link>
                    <Link to="/messages" className={`${linkClasses} ${isActive('/messages')}`}>
                        <span className="text-xl">💬</span><span className="font-medium">Messages</span>
                    </Link>
                </>
            );
        } else if (user.role === 'doctor') {
            return (
                <>
                    <Link to="/dashboard" className={`${linkClasses} ${isActive('/dashboard')}`}>
                        <span className="text-xl">🗓️</span><span className="font-medium">Calendar</span>
                    </Link>
                    <Link to="/dashboard?tab=appointments" className={`${linkClasses} ${isActive('/dashboard', 'appointments')}`}>
                        <span className="text-xl">📅</span><span className="font-medium">Appointments</span>
                    </Link>
                    <Link to="/dashboard?tab=patients" className={`${linkClasses} ${isActive('/dashboard', 'patients')}`}>
                        <span className="text-xl">👥</span><span className="font-medium">Patients</span>
                    </Link>
                    <Link to="/dashboard?tab=wallet" className={`${linkClasses} ${isActive('/dashboard', 'wallet')}`}>
                        <span className="text-xl">💰</span><span className="font-medium">Wallet</span>
                    </Link>
                    <Link to="/dashboard?tab=reminders" className={`${linkClasses} ${isActive('/dashboard', 'reminders')}`}>
                        <span className="text-xl">🔔</span><span className="font-medium">Reminders</span>
                    </Link>
                    <Link to="/messages" className={`${linkClasses} ${isActive('/messages')}`}>
                        <span className="text-xl">💬</span><span className="font-medium">Messages</span>
                    </Link>
                </>
            );
        } else if (user.role === 'admin') {
            return (
                <>
                    <Link to="/dashboard" className={`${linkClasses} ${isActive('/dashboard')}`}>
                        <span className="text-xl">📊</span><span className="font-medium">Dashboard</span>
                    </Link>
                    <Link to="/dashboard?tab=doctors" className={`${linkClasses} ${isActive('/dashboard', 'doctors')}`}>
                        <span className="text-xl">👨‍⚕️</span><span className="font-medium">Manage Doctors</span>
                    </Link>
                    <Link to="/dashboard?tab=patients" className={`${linkClasses} ${isActive('/dashboard', 'patients')}`}>
                        <span className="text-xl">👥</span><span className="font-medium">Manage Patients</span>
                    </Link>
                    <Link to="/dashboard?tab=appointments" className={`${linkClasses} ${isActive('/dashboard', 'appointments')}`}>
                        <span className="text-xl">📅</span><span className="font-medium">Appointments</span>
                    </Link>
                    <Link to="/dashboard?tab=finance" className={`${linkClasses} ${isActive('/dashboard', 'finance')}`}>
                        <span className="text-xl">💲</span><span className="font-medium">Finance</span>
                    </Link>
                    <Link to="/dashboard?tab=settings" className={`${linkClasses} ${isActive('/dashboard', 'settings')}`}>
                        <span className="text-xl">⚙️</span><span className="font-medium">System Settings</span>
                    </Link>
                    <Link to="/messages" className={`${linkClasses} ${isActive('/messages')}`}>
                        <span className="text-xl">💬</span><span className="font-medium">Messages</span>
                    </Link>
                </>
            );
        }
    };

    return (
        <div className="bg-gray-900/90 backdrop-blur-xl border-r border-white/10 text-white w-64 flex flex-col h-screen shadow-2xl z-20 transition-all duration-300">
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 border-b border-gray-800">
                <Link to="/" className="text-2xl font-bold tracking-wider text-blue-400">
                    DocOn<span className="text-white">.</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                {renderLinks()}
            </nav>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={logout}
                    className={`${linkClasses} w-full text-left text-red-400 hover:bg-red-500/10 hover:text-red-300`}
                >
                    <span className="text-xl">🚪</span>
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
