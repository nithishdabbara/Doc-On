import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const [status, setStatus] = useState('verifying'); // verifying | success | error

    useEffect(() => {
        const verify = async () => {
            if (!token) {
                setStatus('error');
                return;
            }
            try {
                await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/patients/verify-email-token`, { token });
                setStatus('success');
                setTimeout(() => navigate('/login'), 3000); // Auto redirect
            } catch (err) {
                setStatus('error');
            }
        };
        verify();
    }, [token, navigate]);

    return (
        <div className="container animate-fade flex items-center justify-center h-screen" style={{ paddingTop: '0' }}>
            <div className="card text-center p-8 shadow-xl" style={{ maxWidth: '400px' }}>

                {status === 'verifying' && (
                    <div className="flex flex-col items-center">
                        <Loader className="animate-spin text-blue-600 mb-4" size={48} />
                        <h2 className="text-2xl font-bold text-gray-800">Verifying...</h2>
                        <p className="text-gray-500">Please wait while we confirm your email.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <CheckCircle className="text-green-500 mb-4" size={56} />
                        <h2 className="text-2xl font-bold text-gray-800">Email Verified!</h2>
                        <p className="text-gray-500 mb-4">Your account is now active.</p>
                        <p className="text-sm text-gray-400">Redirecting to login...</p>
                        <button onClick={() => navigate('/login')} className="btn btn-primary mt-4 w-full">
                            Login Now
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <XCircle className="text-red-500 mb-4" size={56} />
                        <h2 className="text-2xl font-bold text-gray-800">Verification Failed</h2>
                        <p className="text-gray-500 mb-4">The link is invalid or has expired.</p>
                        <button onClick={() => navigate('/patient/signup')} className="btn btn-secondary mt-4 w-full">
                            Back to Signup
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;

