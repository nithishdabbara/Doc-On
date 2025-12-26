import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const { login, loadUser, isAuthenticated, loading } = useAuth(); // Destructure loading
    const navigate = useNavigate();

    // Handle Google Login Callback
    useEffect(() => {
        const handleGoogleLogin = async () => {
            const queryParams = new URLSearchParams(window.location.search);
            const token = queryParams.get('token');
            if (token) {
                localStorage.setItem('token', token);
                try {
                    await loadUser(); // Update Context State
                    // No need to navigate() here; the effect will re-run, 
                    // isAuthenticated becomes true, and the check above handles redirect.
                } catch (err) {
                    console.error("Google Auth Error:", err);
                    setError('Google Login Verification Failed');
                }
            }
        };
        handleGoogleLogin();
    }, [loadUser]);

    const { email, password } = formData;

    const onChange = e => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = async e => {
        e.preventDefault();
        setError('');
        try {
            await login(formData);
            navigate('/dashboard');
        } catch (err) {
            setError(err.msg || 'Login failed');
        }
    };

    // 1. Loading State (Prevents Flicker/Crash)
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // 2. Redirect if already logged in (Declarative)
    if (isAuthenticated) {
        return <Navigate to="/dashboard" />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex w-full max-w-6xl shadow-2xl rounded-2xl overflow-hidden bg-white min-h-[600px]">

                {/* LEFT SIDE: Form Section */}
                <div className="w-full md:w-1/2 p-10 flex flex-col justify-center relative">
                    <div className="mb-10 text-center">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
                        <p className="text-gray-500">Access your digital health dashboard</p>
                    </div>

                    {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-6 text-sm border border-red-100 flex items-center gap-2">⚠️ {error}</div>}

                    {/* Google Sign In Button */}
                    <div className="mb-6">
                        <a
                            href="http://localhost:5000/api/auth/google"
                            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition card-hover font-semibold shadow-sm"
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                            Sign in with Google
                        </a>
                        <div className="relative mt-8">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-100" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase tracking-widest text-gray-400 font-bold">
                                <span className="bg-white px-2">Or with email</span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-5">
                        <div className="group">
                            <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={email}
                                onChange={onChange}
                                placeholder="name@example.com"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 transition-all font-medium"
                                required
                            />
                        </div>
                        <div className="group">
                            <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={password}
                                onChange={onChange}
                                placeholder="••••••••"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 transition-all font-medium"
                                required
                            />
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 text-white py-3.5 rounded-xl hover:bg-indigo-700 transition font-bold shadow-lg shadow-indigo-200 active:scale-[0.98]">
                            Secure Login
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-gray-500">
                        New to DocOn? <a href="/register" className="text-indigo-600 font-bold hover:underline">Create Account</a>
                    </p>
                </div>

                {/* RIGHT SIDE: Hero Image */}
                <div className="hidden md:block w-1/2 bg-cover bg-center relative" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80')" }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 to-blue-900/80 flex flex-col justify-end p-12 text-white">
                        <h2 className="text-4xl font-bold mb-4 leading-tight">Your Health,<br />Simplified.</h2>
                        <p className="text-blue-100 text-lg mb-8 opacity-90">Manage appointments, bills, and medical records in one secure portal.</p>

                        {/* Trust Badges */}
                        <div className="flex gap-4 opacity-70">
                            <div className="flex items-center gap-1 text-xs font-mono border px-2 py-1 rounded border-white/30">
                                🔒 256-bit Encryption
                            </div>
                            <div className="flex items-center gap-1 text-xs font-mono border px-2 py-1 rounded border-white/30">
                                🏥 Verified Doctors
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Login;
