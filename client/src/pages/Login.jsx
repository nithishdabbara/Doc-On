import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Shield, Stethoscope, Activity, ArrowRight, Lock } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Check for existing Trust Token
            let trustToken = localStorage.getItem('trustDeviceToken');
            if (trustToken === 'undefined' || trustToken === 'null') trustToken = null;

            const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth/login`, {
                email,
                password,
                trustDeviceToken: trustToken
            });

            // Direct Login Success
            if (res.data.trustDeviceToken) {
                localStorage.setItem('trustDeviceToken', res.data.trustDeviceToken);
            }
            completeLogin(res.data);

        } catch (err) {
            console.error("Login Error", err);
            const msg = err.response?.data?.message || (err.code === 'ERR_NETWORK' ? 'Backend Connection Failed. Please check if Render is sleeping.' : 'Invalid credentials');
            alert('Login Failed: ' + msg);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        try {
            const trustToken = localStorage.getItem('trustDeviceToken');
            const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth/google`, {
                token: credentialResponse.credential,
                trustDeviceToken: trustToken
            });

            console.log("Google Login Backend Response:", res.data);

            if (res.data.trustDeviceToken) {
                localStorage.setItem('trustDeviceToken', res.data.trustDeviceToken);
            }
            completeLogin(res.data);
        } catch (err) {
            console.error("Google Login Error", err);
            const msg = err.response?.data?.message || (err.code === 'ERR_NETWORK' ? 'Backend Connection Failed. Please check if Render is sleeping.' : 'Unknown Error');
            alert('Google Login Failed: ' + msg);
        } finally {
            setLoading(false);
        }
    };

    const completeLogin = (data) => {
        const { token, user } = data;
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(user));

        if (user.type === 'admin') navigate('/admin/dashboard');
        else if (user.type === 'doctor') navigate('/doctor/dashboard');
        else if (user.type === 'lab') navigate('/lab/dashboard');
        else navigate('/patient/dashboard');
    };

    return (
        <div className="login-container">
            {/* Left Panel - Feature Section */}
            <div className="marketing-side">
                <div className="content-wrapper">
                    <div className="brand-header animate-fade-in">
                        <Stethoscope size={40} className="brand-icon" />
                        <h1>DocOn</h1>
                    </div>

                    <h2 className="tagline">Your Complete<br />Healthcare Ecosystem</h2>

                    <div className="features-list">
                        <div className="feature-item">
                            <div className="icon-box"><Activity size={24} /></div>
                            <div>
                                <h3>Expert Care</h3>
                                <p>Book verified specialists instantly.</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="icon-box"><Shield size={24} /></div>
                            <div>
                                <h3>Secure Records</h3>
                                <p>Bank-grade encryption for your data.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative Pattern */}
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="login-side">
                <div className="login-box animate-fade-up">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl">Welcome Back</h2>
                        <p className="text-gray">Log in to manage your health journey</p>
                    </div>

                    <form onSubmit={handleLogin} className="login-form">
                        <div className="form-group">
                            <label>Email or Username</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="name@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoComplete="off"
                            />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                            />
                        </div>

                        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                            {loading ? 'Logging in...' : 'Log In'} <ArrowRight size={18} />
                        </button>
                    </form>

                    <div className="divider">
                        <span className="divider-text">Or continue with</span>
                    </div>

                    <div className="flex-center">
                        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => alert('Login Failed')} />
                    </div>

                    <p className="signup-link">
                        Don't have an account? <Link to="/patient/signup">Sign up as Patient</Link>
                        <span className="separator">|</span>
                        <Link to="/doctor/signup">Join as Doctor</Link>
                    </p>
                    <div className="mt-4 text-center space-y-2">
                        <a href="/lab/login" className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center justify-center gap-1">
                            <Activity size={14} /> Lab Partner Login
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
