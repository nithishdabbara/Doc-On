import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { TestTube, LogIn, ArrowRight } from 'lucide-react';

const LabLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) return alert('Enter Email and Password');

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/labs/login`, {
                email,
                password
            });

            // Store session & Token
            sessionStorage.setItem('labId', res.data.lab.id);
            sessionStorage.setItem('labName', res.data.lab.name);
            sessionStorage.setItem('token', res.data.token);

            navigate('/lab/dashboard');
        } catch (err) {
            alert(err.response?.data?.message || 'Login Failed');
        }
    };

    return (
        <div className="min-h-screen bg-teal-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full animate-fade-up">
                <div className="text-center mb-8">
                    <div className="bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TestTube size={32} className="text-teal-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Lab Assistant Portal</h1>
                    <p className="text-gray-500">Secure Access for Lab Technicians</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Email ID</label>
                        <input
                            type="email"
                            className="w-full border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="lab@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transition flex justify-center items-center gap-2"
                    >
                        Access Dashboard <ArrowRight size={18} />
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    New Diagnostic Centre? <a href="/lab/register" className="text-teal-600 font-bold hover:underline">Register Here</a>
                </div>
            </div>
        </div>
    );
};

export default LabLogin;

