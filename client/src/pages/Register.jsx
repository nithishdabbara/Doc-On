import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'patient',
        specialization: '',
        medicalLicense: '',
        city: '',
        hospitalName: '',
        clinicAddress: '',
        registrationYear: '',
        stateMedicalCouncil: '',
        licenseProof: null
    });
    const [error, setError] = useState('');
    const { register, loadUser, loading } = useAuth();
    const navigate = useNavigate();

    // Handle Google Login Callback
    useEffect(() => {
        const handleGoogleLogin = async () => {
            const queryParams = new URLSearchParams(window.location.search);
            const token = queryParams.get('token');
            if (token) {
                localStorage.setItem('token', token);
                try {
                    await loadUser();
                    navigate('/dashboard');
                } catch (err) {
                    console.error("Google Auth Error:", err);
                    setError('Google Signup Failed');
                }
            }
        };
        handleGoogleLogin();
    }, [loadUser, navigate]);

    const { name, email, password, role, specialization, medicalLicense } = formData;

    const onChange = e => {
        if (e.target.name === 'licenseProof') {
            setFormData({ ...formData, licenseProof: e.target.files[0] });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const setRole = (newRole) => {
        setFormData({ ...formData, role: newRole });
    };

    const onSubmit = async e => {
        e.preventDefault();
        setError('');

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            data.append(key, formData[key]);
        });

        try {
            await register(data);
            navigate('/dashboard');
        } catch (err) {
            setError(err.msg || 'Registration failed');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="flex w-full max-w-6xl shadow-2xl rounded-2xl overflow-hidden bg-white min-h-[700px]">

                {/* LEFT SIDE: Form Section */}
                <div className="w-full md:w-1/2 p-10 flex flex-col justify-center relative">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
                        <p className="text-gray-500">Join DocOn for smarter healthcare management</p>
                    </div>

                    {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-6 text-sm border border-red-100">⚠️ {error}</div>}

                    {/* Role Selection Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                        {['patient', 'doctor'].map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setRole(r)}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all capitalize ${role === r ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>

                    {/* Google Signup Button */}
                    <div className="mb-6">
                        <a
                            href={`http://localhost:5000/api/auth/google?role=${role}`}
                            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition card-hover font-semibold shadow-sm"
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                            Sign up with Google
                        </a>
                        <div className="relative mt-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-100" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase tracking-widest text-gray-400 font-bold">
                                <span className="bg-white px-2">Or with email</span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="group">
                            <label className="block text-gray-700 text-sm font-bold mb-1 ml-1">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={name}
                                onChange={onChange}
                                placeholder="John Doe"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 transition-all font-medium"
                                required
                            />
                        </div>

                        <div className="group">
                            <label className="block text-gray-700 text-sm font-bold mb-1 ml-1">Email Address</label>
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
                            <label className="block text-gray-700 text-sm font-bold mb-1 ml-1">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={password}
                                onChange={onChange}
                                placeholder="Create a strong password"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 transition-all font-medium"
                                required
                            />
                        </div>

                        {role === 'doctor' && (
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 animate-fade-in space-y-3">
                                <h4 className="text-sm font-bold text-blue-800 mb-2">Doctor Verification</h4>

                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        name="specialization"
                                        placeholder="Specialization"
                                        value={specialization}
                                        onChange={onChange}
                                        className="w-full p-2 bg-white border border-blue-200 rounded-lg text-sm"
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="medicalLicense"
                                        placeholder="License Number"
                                        value={medicalLicense}
                                        onChange={onChange}
                                        className="w-full p-2 bg-white border border-blue-200 rounded-lg text-sm"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        name="hospitalName"
                                        placeholder="Clinic/Hospital Name"
                                        value={formData.hospitalName}
                                        onChange={onChange}
                                        className="w-full p-2 bg-white border border-blue-200 rounded-lg text-sm"
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="city"
                                        placeholder="City"
                                        value={formData.city}
                                        onChange={onChange}
                                        className="w-full p-2 bg-white border border-blue-200 rounded-lg text-sm"
                                        required
                                    />
                                </div>
                                <input
                                    type="text"
                                    name="clinicAddress"
                                    placeholder="Full Clinic Address"
                                    value={formData.clinicAddress}
                                    onChange={onChange}
                                    className="w-full p-2 bg-white border border-blue-200 rounded-lg text-sm"
                                    required
                                />

                                <div>
                                    <label className="text-xs font-bold text-blue-700">License Proof (Image/PDF)</label>
                                    <input
                                        type="file"
                                        name="licenseProof"
                                        onChange={onChange}
                                        accept="image/*,.pdf"
                                        className="w-full mt-1 text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-blue-200 file:text-blue-800 hover:file:bg-blue-300"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <button type="submit" className="w-full bg-indigo-600 text-white py-3.5 rounded-xl hover:bg-indigo-700 transition font-bold shadow-lg shadow-indigo-200 active:scale-[0.98] mt-2">
                            Create Account
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-500">
                        Already have an account? <a href="/login" className="text-indigo-600 font-bold hover:underline">Login</a>
                    </p>
                </div>

                {/* RIGHT SIDE: Hero Image */}
                <div className="hidden md:block w-1/2 bg-cover bg-center relative" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80')" }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 to-purple-900/80 flex flex-col justify-end p-12 text-white">
                        <h2 className="text-4xl font-bold mb-4 leading-tight">Join the Future<br />of Healthcare.</h2>
                        <ul className="space-y-3 text-blue-100 text-lg opacity-90 mb-8">
                            <li className="flex items-center gap-3"><span className="bg-white/20 p-1 rounded-full">✓</span> Smart Appointments</li>
                            <li className="flex items-center gap-3"><span className="bg-white/20 p-1 rounded-full">✓</span> Digital Prescriptions</li>
                            <li className="flex items-center gap-3"><span className="bg-white/20 p-1 rounded-full">✓</span> Secure Medical Records</li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Register;
