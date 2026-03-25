import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { ShieldCheck, Mail, User, Lock, ArrowRight } from 'lucide-react';

const PatientSignup = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const pageTopRef = React.useRef(null);

    const [step, setStep] = useState('signup');
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [otp, setOtp] = useState('');

    // Check for redirect message
    const [alertMessage, setAlertMessage] = useState('');

    useEffect(() => {
        // 1. Force Scroll using multiple methods
        window.scrollTo(0, 0);

        if (pageTopRef.current) {
            pageTopRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
        }

        // 2. Check Session Storage for persistent message
        const msg = sessionStorage.getItem('signupMessage');

        if (msg) {
            setAlertMessage(msg);
            sessionStorage.removeItem('signupMessage');
        }
    }, []);

    // Google Confirmation State
    const [googleCredential, setGoogleCredential] = useState(null);
    const [googleUser, setGoogleUser] = useState(null); // Decoded details
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/patients/register`, formData);
            setStep('otp');
            // Assuming the server now logs the OTP, we can tell the user to check console if local, but functionally "Check Email" is still the UI message.
            alert('OTP Sent! Check your email (or server console for demo).');
        } catch (err) {
            alert('Error: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleVerifyParams = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/patients/verify-otp`, {
                email: formData.email, otp
            });
            sessionStorage.setItem('token', res.data.token);
            sessionStorage.setItem('user', JSON.stringify(res.data.user));
            alert('Verified!');
            navigate('/patient/dashboard');
        } catch (err) {
            alert('Verification Failed: ' + (err.response?.data?.message || 'Invalid OTP'));
        }
    };

    // Helper to decode JWT payload (without external lib)
    const decodeJwt = (token) => {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            return {};
        }
    };

    const handleGoogleSuccess = (credentialResponse) => {
        const token = credentialResponse.credential;
        const decoded = decodeJwt(token);

        setGoogleCredential(token);
        setGoogleUser(decoded);
        setStep('google_confirm'); // Move to confirmation step
    };

    const confirmGoogleSignup = async () => {
        if (!acceptedTerms) {
            alert('Please accept the Terms of Policy to continue.');
            return;
        }

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth/google`, {
                token: googleCredential
            });
            sessionStorage.setItem('token', res.data.token);
            sessionStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/patient/dashboard');
        } catch (err) {
            alert('Google Signup Failed');
        }
    };

    return (
        <div ref={pageTopRef} className="min-h-screen flex animate-fade-in bg-gray-50">
            {/* Left Side - Informational/Visual */}
            <div className="hidden lg:flex lg:w-1/2 bg-blue-600 text-white relative overflow-hidden flex-col justify-between p-12">
                {/* Background Pattern */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <ShieldCheck size={32} />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">DocOn Health</span>
                    </div>

                    <h1 className="text-5xl font-bold leading-tight mb-6">
                        Your Journey to <br /> Better Health <br /> Starts Here.
                    </h1>
                    <p className="text-blue-100 text-lg max-w-md mb-12">
                        Join thousands of patients who trust DocOn for their healthcare needs. Simple, secure, and fast.
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-blue-500/50 p-3 rounded-lg">
                                <User size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Top-Rated Doctors</h3>
                                <p className="text-blue-100 text-sm">Access verified specialists across 50+ verities.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="bg-blue-500/50 p-3 rounded-lg">
                                <Lock size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Secure & Private</h3>
                                <p className="text-blue-100 text-sm">Your medical records are encrypted and safe with us.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="bg-blue-500/50 p-3 rounded-lg">
                                <Mail size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Instant Notifications</h3>
                                <p className="text-blue-100 text-sm">Get real-time updates on appointments and reports.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-sm text-blue-200">
                    © 2026 DocOn Healthcare. All rights reserved.
                </div>
            </div>

            {/* Right Side - Signup Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 relative">
                {/* Back Button for Mobile */}
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 lg:hidden"
                >
                    Back to Home
                </button>

                <div className="max-w-md w-full">
                    {step === 'signup' && (
                        <div className="bg-white rounded-3xl lg:shadow-none p-6 lg:p-0 w-full animate-slide-up">
                            <div className="mb-8">
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
                                <p className="text-gray-500">Enter your details to register as a patient.</p>
                            </div>

                            {alertMessage && (
                                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl mb-6 flex items-center justify-between shadow-sm">
                                    <span className="text-sm font-medium">{alertMessage}</span>
                                    <button onClick={() => setAlertMessage('')} className="text-yellow-600 hover:text-yellow-900 font-bold">&times;</button>
                                </div>
                            )}

                            <form onSubmit={handleSignup} className="grid gap-4" autoComplete="off">
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                        <input
                                            placeholder="Full Name"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800"
                                            required
                                            autoComplete="off"
                                        />
                                    </div>

                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                        <input
                                            type="email"
                                            placeholder="Email Address"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800"
                                            required
                                            autoComplete="new-email"
                                        />
                                    </div>

                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                        <input
                                            type="password"
                                            placeholder="Create Password"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800"
                                            required
                                            autoComplete="new-password"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 mt-2">
                                    <input
                                        type="checkbox"
                                        id="terms-manual"
                                        className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                        checked={acceptedTerms}
                                        onChange={e => setAcceptedTerms(e.target.checked)}
                                        required
                                    />
                                    <label htmlFor="terms-manual" className="text-xs text-gray-500 cursor-pointer leading-relaxed">
                                        I agree to the <span className="font-semibold text-gray-700 hover:text-blue-600 underline">Terms of Service</span> and <span className="font-semibold text-gray-700 hover:text-blue-600 underline">Privacy Policy</span>.
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-base transition-all ${acceptedTerms
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                    disabled={!acceptedTerms}
                                >
                                    Create Account <ArrowRight size={18} />
                                </button>
                            </form>

                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => alert('Signup Failed')}
                                    shape="circle"
                                    type="icon"
                                    size="large"
                                />
                                {/* Standard Google Button also looks good, sticking to simple circle/icon might be cleaner or user explicitly likes the standard one. Let's revert to standard pill for visibility if user prefers clarity */}
                                {/* Actually, let's keep the standard pill for better UX */}
                                <div className="absolute opacity-0 pointer-events-none">
                                    <GoogleLogin onSuccess={() => { }} onError={() => { }} />
                                </div>
                            </div>
                            <div className="flex justify-center mt-[-10px]"> {/* Hack to position standard button if needed, but let's just use standard */}
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => alert('Signup Failed')}
                                    shape="pill"
                                    text="signup_with"
                                    width="100%"
                                />
                            </div>


                            <p className="text-center text-sm text-gray-500 mt-8">
                                Already have an account? <a href="/login" className="text-blue-600 font-bold hover:underline">Log in</a>
                            </p>
                        </div>
                    )}

                    {step === 'otp' && (
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center max-w-sm mx-auto animate-fade-in">
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                                <Mail size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
                            <p className="text-gray-500 mb-6 text-sm">
                                We sent a verification link to <br /> <span className="font-semibold text-gray-900">{formData.email}</span>
                            </p>

                            <button onClick={() => setStep('signup')} className="text-sm font-medium text-gray-400 hover:text-gray-600 underline">
                                Back to Signup
                            </button>
                        </div>
                    )}

                    {step === 'google_confirm' && (
                        <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 max-w-sm mx-auto animate-fade-in">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                                    <ShieldCheck size={32} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Confirm Details</h2>
                                <p className="text-sm text-gray-500">Almost there! Review your info.</p>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl mb-6">
                                <img src={googleUser?.picture} alt="Profile" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                                <div>
                                    <p className="font-bold text-gray-900">{googleUser?.name}</p>
                                    <p className="text-xs text-gray-500">{googleUser?.email}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 mb-6">
                                <input
                                    type="checkbox"
                                    id="terms-google"
                                    className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    checked={acceptedTerms}
                                    onChange={e => setAcceptedTerms(e.target.checked)}
                                />
                                <label htmlFor="terms-google" className="text-xs text-gray-500 cursor-pointer">
                                    I agree to the <span className="font-semibold text-gray-700">Terms of Service</span>.
                                </label>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={confirmGoogleSignup}
                                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${acceptedTerms ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30' : 'bg-gray-100 text-gray-400'}`}
                                    disabled={!acceptedTerms}
                                >
                                    Complete Signup
                                </button>
                                <button onClick={() => setStep('signup')} className="w-full py-3 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-50">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientSignup;

