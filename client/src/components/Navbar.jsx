import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Stethoscope, User, Search, LogOut } from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Forces re-render on route change
    const user = JSON.parse(sessionStorage.getItem('user'));
    const adminToken = sessionStorage.getItem('adminToken');

    const handleLogout = () => {
        sessionStorage.clear();
        navigate('/');
    };

    const getHomeLink = () => {
        if (adminToken || user?.type === 'admin') return '/admin/dashboard';
        if (user?.type === 'doctor') return '/doctor/dashboard';
        if (user?.type === 'lab') return '/lab/dashboard';
        if (user?.type === 'patient') return '/patient/dashboard';
        return '/';
    };

    return (
        <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '1rem 0' }}>
            <div className="container flex items-center justify-between">
                <Link to={getHomeLink()} className="flex items-center gap-4">
                    <Stethoscope color="var(--primary)" size={32} />
                    <span className="text-2xl" style={{ color: 'var(--primary)' }}>DocOn</span>
                </Link>

                <div className="flex items-center gap-4">


                    {!user && !adminToken && (
                        <>
                            <Link to="/patient/signup" className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                Patient Signup
                            </Link>
                            <Link to="/doctor/signup" className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                Doctor Signup
                            </Link>
                            <Link to="/login" className="btn btn-primary">
                                Login
                            </Link>
                        </>
                    )}

                    {(user || adminToken) && (
                        <div className="flex items-center gap-4">

                            {/* Doctor Console — always visible for doctors, on every page */}
                            {user?.type === 'doctor' && (
                                <Link to="/doctor/dashboard" className="btn btn-secondary text-sm font-bold flex items-center gap-2">
                                    <User size={16} /> {user.name}
                                </Link>
                            )}

                            {/* Patient Dashboard — always visible for patients, on every page */}
                            {user?.type === 'patient' && (
                                <Link to="/patient/dashboard" className="btn btn-secondary text-sm font-bold flex items-center gap-2">
                                    <User size={16} /> {user.name}
                                </Link>
                            )}

                            {/* Admin Console — always visible for admins, on every page */}
                            {(adminToken || user?.type === 'admin') && (
                                <Link to="/admin/dashboard" className="btn btn-primary bg-blue-600 text-white flex items-center gap-2">
                                    <User size={16} /> Admin Console
                                </Link>
                            )}

                            <button onClick={handleLogout} className="btn" style={{ padding: '0.5rem' }}>
                                <LogOut size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

