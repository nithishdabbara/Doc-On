import { useState } from 'react'; // Added useState
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import NotificationDropdown from './NotificationDropdown';

const TopHeader = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        // Redirect logic based on role
        if (user.role === 'admin') {
            // Admin searches doctors by default or patients? Let's search patients for now as it's more common
            navigate(`/dashboard?tab=patients&search=${encodeURIComponent(searchTerm)}`);
        } else if (user.role === 'doctor') {
            // Doctors search patients
            navigate(`/dashboard?tab=patients&search=${encodeURIComponent(searchTerm)}`);
        }
    };

    return (
        <header className="flex justify-between items-center py-4 px-6 bg-transparent"> {/* Changed to transparent to respect new dashboard layout */}
            <div className="flex items-center">
                {user && (user.role === 'doctor' || user.role === 'admin') && (
                    <div className="relative mx-auto text-gray-600">
                        <form onSubmit={handleSearch}>
                            <input
                                className="border-2 border-white/30 bg-white/50 backdrop-blur-md h-10 px-5 pr-16 rounded-lg text-sm focus:outline-none focus:bg-white transition-all w-64 focus:w-80 shadow-sm"
                                type="search"
                                name="search"
                                placeholder="Search patients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button type="submit" className="absolute right-0 top-0 mt-3 mr-4">
                                <svg className="text-gray-600 h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg"
                                    version="1.1" id="Capa_1" x="0px" y="0px"
                                    viewBox="0 0 56.966 56.966" style={{ enableBackground: 'new 0 0 56.966 56.966' }}
                                    width="512px" height="512px">
                                    <path
                                        d="M55.146,51.887L41.588,37.786c3.486-4.144,5.396-9.358,5.396-14.786c0-12.682-10.318-23-23-23s-23,10.318-23,23  s10.318,23,23,23c4.761,0,9.298-1.436,13.177-4.162l13.661,14.208c0.571,0.593,1.339,0.92,2.162,0.92  c0.779,0,1.518-0.297,2.079-0.837C56.255,54.982,56.293,53.08,55.146,51.887z M23.984,6c9.374,0,17,7.626,17,17s-7.626,17-17,17  s-17-7.626-17-17S14.61,6,23.984,6z" />
                                </svg>
                            </button>
                        </form>
                    </div>
                )}
            </div>

            <div className="flex items-center space-x-4">
                <NotificationDropdown />

                <Link to="/messages" className="text-gray-500 hover:text-blue-600 focus:outline-none relative">
                    <span className="sr-only">Messages</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {/* Mock badge for visual feedback */}
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                </Link>

                <Link to="/dashboard?tab=settings" className="text-gray-500 hover:text-blue-600 focus:outline-none">
                    <span className="sr-only">Settings</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </Link>

                <div className="flex items-center ml-4">
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold">
                        {user ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    {user && <span className="ml-2 text-sm font-semibold">{user.name}</span>}
                </div>
            </div>
        </header>
    );
};

export default TopHeader;
