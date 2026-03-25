import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Shield, Stethoscope, Activity, ArrowRight, Lock } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState('credentials'); // credentials | otp
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [tempAuth, setTempAuth] = useState(null); // { userId, type }

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // Check for existing Trust Token
            let trustToken = localStorage.getItem('trustDeviceToken');
            if (trustToken === 'undefined' || trustToken === 'null') trustToken = null;

            const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth/login`, {
                email,
                password,
                trustDeviceToken: trustToken
            });

            // Check if 2FA is required
            if (res.data.status === '2fa_required') {
                setTempAuth({ userId: res.data.userId, type: res.data.type });
                setStep('otp');
                // You can show a toast here: "OTP sent to your email"
                return;
            }

            // Direct Login (Admin or if 2FA is disabled OR Trusted Device)
            // If API returns trust token (refresh), update it
            if (res.data.trustDeviceToken) {
                localStorage.setItem('trustDeviceToken', res.data.trustDeviceToken);
            }
            completeLogin(res.data);

        } catch (err) {
            alert('Login Failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth/verify-login-otp`, {
                userId: tempAuth.userId,
                type: tempAuth.type,
                otp
            });

            // Save Trust Token if provided
            if (res.data.trustDeviceToken) {
                localStorage.setItem('trustDeviceToken', res.data.trustDeviceToken);
            }

            completeLogin(res.data);
        } catch (err) {
            alert('Verification Failed: ' + (err.response?.data?.message || 'Invalid OTP'));
        }
    };

    const completeLogin = (data) => {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));

        const type = data.user.type;
        if (type === 'admin') {
            sessionStorage.setItem('adminToken', data.token);
            navigate('/admin/dashboard');
        }
        else if (type === 'doctor') navigate('/doctor/dashboard');
        else navigate('/patient/dashboard');
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const trustToken = localStorage.getItem('trustDeviceToken');
            const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth/google`, {
                token: credentialResponse.credential,
                trustDeviceToken: trustToken
            });

            // Handle 2FA for Patients
            if (res.data.status === '2fa_required') {
                setTempAuth({ userId: res.data.userId, type: res.data.type });
                setStep('otp');
                // Optional: Toast "OTP sent to your Google email"
                return;
            }

            if (res.data.trustDeviceToken) {
                localStorage.setItem('trustDeviceToken', res.data.trustDeviceToken);
            }
            completeLogin(res.data);
        } catch (err) {
            console.error("Google Login Error", err);
            alert('Google Login Failed: ' + (err.response?.data?.message || 'Unknown Error'));
        }
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

                    {step === 'credentials' && (
                        <>
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

                                <button type="submit" className="btn btn-primary w-full">
                                    Log In <ArrowRight size={18} />
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
                        </>
                    )}

                    {step === 'otp' && (
                        <>
                            <div className="text-center mb-6">
                                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                                    <Lock size={32} />
                                </div>
                                <h2 className="text-2xl font-bold">Security Check</h2>
                                <p className="text-gray text-sm">Enter the OTP sent to your email</p>
                            </div>

                            <form onSubmit={handleVerifyOtp} className="login-form">
                                <input
                                    type="text"
                                    className="input-field text-center text-3xl font-mono tracking-widest"
                                    placeholder="0 0 0 0 0 0"
                                    maxLength={6}
                                    value={otp}
                                    onChange={e => setOtp(e.target.value)}
                                    required
                                    autoFocus
                                />
                                <button type="submit" className="btn btn-primary w-full mt-4">
                                    Verify & Login
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep('credentials')}
                                    className="btn btn-secondary w-full mt-2"
                                >
                                    Cancel
                                </button>
                            </form>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Login;

