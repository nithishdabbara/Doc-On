import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Shield, MapPin, Phone, Mail, FileText, CheckCircle } from 'lucide-react';

const LabSignup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        contactNumber: '',
        address: '',
        city: '',
        district: '',
        availableTestTypes: [] // 'Pathology', 'Radiology'
    });

    const districts = [
        "Anantapur", "Kurnool", "Hyderabad", "Mumbai", "Bangalore", "Chennai", "Delhi", "Other"
    ];

    const handleCheckbox = (type) => {
        setFormData(prev => {
            const types = prev.availableTestTypes.includes(type)
                ? prev.availableTestTypes.filter(t => t !== type)
                : [...prev.availableTestTypes, type];
            return { ...prev, availableTestTypes: types };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/labs/register`, formData);
            alert('Registration Successful! Please wait for Admin Approval.');
            navigate('/lab/login');
        } catch (err) {
            alert('Registration Failed: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row animate-fade-up">

                {/* Visual Side */}
                <div className="md:w-1/3 bg-teal-600 p-8 text-white flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <Activity size={32} />
                            <h1 className="text-2xl font-bold">DocOn Labs</h1>
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Partner with India's Fastest Growing Health Network</h2>
                        <ul className="space-y-4 mt-8">
                            <li className="flex items-center gap-2"><CheckCircle size={20} /> Zero Onboarding Fee</li>
                            <li className="flex items-center gap-2"><CheckCircle size={20} /> Direct Doctor Referrals</li>
                            <li className="flex items-center gap-2"><CheckCircle size={20} /> Automated Reporting</li>
                        </ul>
                    </div>
                    <div className="text-sm opacity-80 mt-8">
                        &copy; 2024 DocOn Healthcare
                    </div>
                </div>

                {/* Form Side */}
                <div className="md:w-2/3 p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Register Your Lab Centre</h2>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-bold text-gray-600 mb-1">Lab Name</label>
                            <input
                                className="input-field w-full"
                                placeholder="e.g. City Diagnostics"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-bold text-gray-600 mb-1">Official Email</label>
                            <input
                                type="email"
                                className="input-field w-full"
                                placeholder="contact@lab.com"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-600 mb-1">Set Password</label>
                            <input
                                type="password"
                                className="input-field w-full"
                                placeholder="Create a secure password"
                                required
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        {/* Location */}
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-600 mb-1">Address</label>
                            <input
                                className="input-field w-full"
                                placeholder="Street Address, Area"
                                required
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">City</label>
                            <input
                                className="input-field w-full"
                                placeholder="City"
                                required
                                value={formData.city}
                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">District</label>
                            <select
                                className="input-field w-full"
                                value={formData.district}
                                onChange={e => setFormData({ ...formData, district: e.target.value })}
                                required
                            >
                                <option value="">Select District</option>
                                {districts.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">Phone Number</label>
                            <input
                                className="input-field w-full"
                                placeholder="Mobile / Landline"
                                required
                                value={formData.contactNumber}
                                onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                            />
                        </div>

                        {/* Services */}
                        <div className="col-span-2 bg-gray-50 p-4 rounded-lg border">
                            <label className="block text-sm font-bold text-gray-600 mb-2">Services Provided</label>
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.availableTestTypes.includes('Pathology')}
                                        onChange={() => handleCheckbox('Pathology')}
                                        className="w-4 h-4 text-teal-600"
                                    />
                                    <span>Pathology (Blood, Urine)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.availableTestTypes.includes('Radiology')}
                                        onChange={() => handleCheckbox('Radiology')}
                                        className="w-4 h-4 text-teal-600"
                                    />
                                    <span>Radiology (X-Ray, MRI, CT)</span>
                                </label>
                            </div>
                        </div>

                        <div className="col-span-2 pt-4">
                            <button type="submit" className="btn btn-primary w-full py-3 text-lg font-bold bg-teal-600 hover:bg-teal-700">
                                Register Lab
                            </button>
                        </div>

                        <div className="col-span-2 text-center text-sm text-gray-500">
                            Already a partner? <Link to="/lab/login" className="text-teal-600 font-bold hover:underline">Log In Here</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LabSignup;

