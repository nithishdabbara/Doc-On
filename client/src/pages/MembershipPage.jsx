import { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, Star, Crown, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MembershipPage = () => {
    const navigate = useNavigate();
    const [currentPlan, setCurrentPlan] = useState('free');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch current status
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/patients/me`, { headers: { 'x-auth-token': token } });
                if (res.data.subscription?.expiresAt > new Date().toISOString()) {
                    setCurrentPlan(res.data.subscription.tier);
                }
            } catch (err) { console.error(err); }
        };
        fetchProfile();
    }, []);

    const handleSubscribe = async (tier) => {
        if (!window.confirm(`Upgrade to ${tier.toUpperCase()} Plan? Simulated Payment.`)) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/patients/subscribe`, { tier }, {
                headers: { 'x-auth-token': token }
            });
            alert(res.data.message);
            setCurrentPlan(tier);
        } catch (err) {
            alert('Upgrade Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">DocOn Plus Membership</h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Priority access to healthcare, exclusive discounts, and premium support.
                    Choose the plan that suits your health needs.
                </p>
            </div>

            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* FREE */}
                <div className={`bg-white rounded-2xl shadow-sm p-8 border hover:shadow-md transition ${currentPlan === 'free' ? 'ring-2 ring-blue-500' : ''}`}>
                    <div className="mb-4">
                        <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-bold uppercase">Basic</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Free</h3>
                    <p className="text-gray-500 text-sm mb-6">Standard access for everyone.</p>
                    <div className="text-3xl font-bold mb-6">₹0 <span className="text-sm font-normal text-gray-400">/ year</span></div>

                    <ul className="space-y-4 mb-8">
                        <li className="flex items-center gap-2"><Check size={18} className="text-green-500" /> Find Doctors 24/7</li>
                        <li className="flex items-center gap-2"><Check size={18} className="text-green-500" /> Book Appointments</li>
                        <li className="flex items-center gap-2 text-gray-400"><Check size={18} /> No Discounts</li>
                        <li className="flex items-center gap-2 text-gray-400"><Check size={18} /> Standard Support</li>
                    </ul>

                    <button disabled className="w-full bg-gray-100 text-gray-400 py-3 rounded-xl font-bold">
                        {currentPlan === 'free' ? 'Current Plan' : 'Downgrade'}
                    </button>
                </div>

                {/* SILVER */}
                <div className={`bg-white rounded-2xl shadow-sm p-8 border-t-4 border-gray-400 relative hover:shadow-xl transition transform hover:-translate-y-1 ${currentPlan === 'silver' ? 'ring-2 ring-gray-400' : ''}`}>
                    <div className="mb-4">
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 w-fit">
                            <Shield size={12} /> Silver
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Silver Plan</h3>
                    <p className="text-gray-500 text-sm mb-6">Essential savings for regular visits.</p>
                    <div className="text-3xl font-bold mb-6">₹499 <span className="text-sm font-normal text-gray-400">/ year</span></div>

                    <ul className="space-y-4 mb-8">
                        <li className="flex items-center gap-2 font-bold text-gray-800"><Check size={18} className="text-green-500" /> 5% OFF All Consultations</li>
                        <li className="flex items-center gap-2"><Check size={18} className="text-green-500" /> Verified Doctor Access</li>
                        <li className="flex items-center gap-2"><Check size={18} className="text-green-500" /> Digital Prescriptions</li>
                        <li className="flex items-center gap-2 text-gray-400"><Check size={18} /> Extended Support</li>
                    </ul>

                    {currentPlan === 'silver' ? (
                        <button disabled className="w-full bg-gray-200 text-gray-600 py-3 rounded-xl font-bold">Current Plan</button>
                    ) : (
                        <button onClick={() => handleSubscribe('silver')} className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-gray-900 transition shadow-lg">
                            {loading ? 'Processing...' : 'Upgrade to Silver'}
                        </button>
                    )}
                </div>

                {/* GOLD */}
                <div className={`bg-gradient-to-b from-yellow-50 to-white rounded-2xl shadow-xl p-8 border-t-4 border-yellow-400 relative transform scale-105 z-10 ${currentPlan === 'gold' ? 'ring-2 ring-yellow-400' : ''}`}>
                    <div className="absolute top-0 right-0 p-4">
                        <Crown size={24} className="text-yellow-500 animate-pulse" />
                    </div>
                    <div className="mb-4">
                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 w-fit">
                            <Star size={12} fill="currentColor" /> Best Value
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Gold Plan</h3>
                    <p className="text-gray-500 text-sm mb-6">Maximum savings & priority care.</p>
                    <div className="text-3xl font-bold mb-6 text-yellow-600">₹999 <span className="text-sm font-normal text-gray-400">/ year</span></div>

                    <ul className="space-y-4 mb-8">
                        <li className="flex items-center gap-2 font-bold text-gray-800"><Check size={18} className="text-green-500" /> 20% OFF All Consultations</li>
                        <li className="flex items-center gap-2 font-bold text-gray-800"><Check size={18} className="text-green-500" /> Priority Support Badge</li>
                        <li className="flex items-center gap-2"><Check size={18} className="text-green-500" /> 1 Free Follow-up / mo</li>
                        <li className="flex items-center gap-2"><Check size={18} className="text-green-500" /> Zero Cancellation Fees</li>
                    </ul>

                    {currentPlan === 'gold' ? (
                        <button disabled className="w-full bg-yellow-100 text-yellow-700 py-3 rounded-xl font-bold border border-yellow-200">Current Plan</button>
                    ) : (
                        <button onClick={() => handleSubscribe('gold')} className="w-full bg-yellow-500 text-white py-3 rounded-xl font-bold hover:bg-yellow-600 transition shadow-lg shadow-yellow-200">
                            {loading ? 'Processing...' : 'Get Gold Access'}
                        </button>
                    )}
                </div>
            </div>

            <div className="text-center mt-12 text-gray-400 text-sm">
                * Prices are inclusive of taxes. Membership is non-refundable. Simulated Payment Gateway.
            </div>
        </div>
    );
};

export default MembershipPage;

