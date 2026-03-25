import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Stethoscope, Phone, Award, FileText, MapPin, Briefcase, Globe, Activity, Calendar, ArrowRight } from 'lucide-react';

const DoctorRegistration = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', specialization: '',
        licenseNumber: '', medicalCouncil: '', address: '',
        consultationFee: '', phone: '', experience: '', patientsTreated: ''
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/doctors/register`, formData);
            alert('Registration Successful! Please wait for Admin Verification.');
            navigate('/');
        } catch (err) {
            alert('Error registering: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="min-h-screen flex animate-fade-in bg-white">
            {/* Left Side - Professional Sidebar */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white relative overflow-hidden flex-col justify-between p-12">

                {/* Abstract Background */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/20">
                            <Stethoscope size={28} />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-white">DocOn for Doctors</span>
                    </div>

                    <h1 className="text-5xl font-bold leading-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
                        Expand Your <br /> Digital Practice.
                    </h1>
                    <p className="text-slate-400 text-lg max-w-md mb-12 leading-relaxed">
                        Join the fastest-growing healthcare network. Manage appointments, consult online, and grow your patient base effortlessly.
                    </p>

                    <div className="space-y-8">
                        <div className="flex items-start gap-4 group">
                            <div className="bg-slate-800 p-3 rounded-xl group-hover:bg-blue-600/20 transition-colors">
                                <Globe size={24} className="text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white">Global Reach</h3>
                                <p className="text-slate-400 text-sm mt-1">Connect with patients beyond your locality.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 group">
                            <div className="bg-slate-800 p-3 rounded-xl group-hover:bg-blue-600/20 transition-colors">
                                <Calendar size={24} className="text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white">Smart Scheduling</h3>
                                <p className="text-slate-400 text-sm mt-1">Automated appointment management & reminders.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 group">
                            <div className="bg-slate-800 p-3 rounded-xl group-hover:bg-blue-600/20 transition-colors">
                                <Activity size={24} className="text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white">Practice Insights</h3>
                                <p className="text-slate-400 text-sm mt-1">Track patient history and practice growth.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-sm text-slate-500">
                    © 2026 DocOn Healthcare. All rights reserved.
                </div>
            </div>

            {/* Right Side - Registration Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 overflow-y-auto h-screen">
                <div className="max-w-xl w-full py-8">
                    {/* Header for Mobile */}
                    <div className="lg:hidden mb-8 text-center">
                        <div className="bg-blue-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                            <Stethoscope size={28} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Partner Registration</h1>
                    </div>

                    <div className="mb-10">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">Register as Specialist</h2>
                        <p className="text-gray-500">Enter your professional details to get verified.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="grid gap-5 text-left" autoComplete="off">
                        {/* Basic Info */}
                        <div className="grid md:grid-cols-2 gap-5">
                            <div className="relative group">
                                <User className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                <input name="name" placeholder="Full Name" onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800" required autoComplete="off" />
                            </div>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                <input name="email" type="email" placeholder="Email Address" onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800" required autoComplete="new-email" />
                            </div>
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                            <input name="password" type="password" placeholder="Create Password" onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800" required autoComplete="new-password" />
                        </div>

                        {/* Professional Info */}
                        <div className="grid md:grid-cols-2 gap-5">
                            <div className="relative group">
                                <Briefcase className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                <input name="specialization" placeholder="Specialization (e.g. Cardiologist)" onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800" required />
                            </div>
                            <div className="relative group">
                                <span className="absolute left-4 top-3.5 text-gray-400 font-bold group-focus-within:text-blue-600 transition-colors">₹</span>
                                <input name="consultationFee" type="number" placeholder="Consultation Fee" onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800" required />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-5">
                            <div className="relative group">
                                <Phone className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                <input name="phone" placeholder="Phone Number" onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800" required />
                            </div>
                            <div className="relative group">
                                <Award className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                <input name="experience" placeholder="Experience (e.g. 5 Years)" onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800" required />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-5">
                            <div className="relative group">
                                <User className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                <input name="patientsTreated" type="number" placeholder="Patients Treated (Approx)" onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800" required />
                            </div>
                            <div className="relative group">
                                <FileText className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                <input name="licenseNumber" placeholder="License Number" onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800" required />
                            </div>
                        </div>

                        <div className="relative group">
                            <Award className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                            <input name="medicalCouncil" placeholder="Medical Council (e.g. NMC India)" onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800" required />
                        </div>

                        <div className="relative group">
                            <MapPin className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                            <input name="address" placeholder="Clinic Address" onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800" />
                        </div>

                        <button
                            type="submit"
                            className="w-full mt-4 py-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-lg shadow-xl shadow-slate-900/10 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                            Register for Approval <ArrowRight size={20} />
                        </button>

                        <p className="text-center text-sm text-gray-500 mt-6">
                            Already a partner? <a href="/login" className="text-slate-900 font-bold hover:underline">Log in to Console</a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DoctorRegistration;

