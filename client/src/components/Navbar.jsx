import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

    const onLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-blue-600 text-white shadow-lg">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <Link to="/" className="text-xl font-bold font-mono tracking-tighter flex items-center gap-1">
                    <span className="text-blue-600 text-2xl">⚡</span> DocOn
                </Link>
                <ul className="flex space-x-4">
                    {!isAuthenticated ? (
                        <>
                            <li><Link to="/login" className="hover:text-blue-200">Login</Link></li>
                            <li><Link to="/register" className="hover:text-blue-200">Register</Link></li>
                        </>
                    ) : (
                        <>
                            <li className="flex items-center">
                                <span className="mr-2">Welcome, {user && user.name}</span>
                            </li>
                            <li><Link to="/dashboard" className="hover:text-blue-200">Dashboard</Link></li>
                            <li><Link to="/messages" className="hover:text-blue-200">Messages</Link></li>
                            <li>
                                <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded">
                                    Logout
                                </button>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
