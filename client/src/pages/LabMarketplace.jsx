import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, TestTube, Home, Calendar, ShoppingCart, Star, CreditCard, CheckCircle, Loader2, X, Mic, MicOff, Phone, Mail } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const LabMarketplace = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // State
    const [states, setStates] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [selectedState, setSelectedState] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [labs, setLabs] = useState([]);

    useEffect(() => {
        // Fetch Catalog
        axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/labs/tests`).then(res => setTests(res.data));

        // Fetch States and Restore Navigation State
        axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/labs/states`).then(res => {
            if (res.data && res.data.length > 0) {
                setStates(res.data);
            } else {
                setStates(['Andhra Pradesh', 'Telangana', 'Karnataka']);
            }

            // Restore from History State (if back button was used)
            if (location.state?.selectedState) {
                const { selectedState: restoredState, selectedDistrict: restoredDistrict } = location.state;
                setSelectedState(restoredState);

                // Fetch districts for restored state
                axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/labs/districts?state=${restoredState}`)
                    .then(districtRes => {
                        setDistricts(districtRes.data);
                        // If district was also selected, fetch labs
                        if (restoredDistrict) {
                            setSelectedDistrict(restoredDistrict);
                            axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/labs/centres?district=${restoredDistrict}`)
                                .then(labRes => setLabs(labRes.data))
                                .catch(err => console.error(err));
                        }
                    })
                    .catch(err => console.error(err));
            }
        });
    }, [location.state]);

    const handleStateChange = (state) => {
        setSelectedState(state);
        setSelectedDistrict('');
        setLabs([]);

        axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/labs/districts?state=${state}`)
            .then(res => setDistricts(res.data))
            .catch(err => console.error(err));
    };

    const fetchLabs = (district) => {
        setSelectedDistrict(district);
        axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/labs/centres?district=${district}`)
            .then(res => setLabs(res.data))
            .catch(err => console.error(err));
    };

    const toggleTest = (test) => {
        if (cart.find(t => t._id === test._id)) {
            setCart(cart.filter(t => t._id !== test._id));
        } else {
            setCart([...cart, test]);
        }
    };

    const handleBook = async () => {
        try {
            const token = sessionStorage.getItem('token') || localStorage.getItem('token');
            if (!token) return alert('Please Login First');

            // 1. Load Razorpay SDK
            const isLoaded = await loadRazorpay();
            if (!isLoaded) return alert("Razorpay SDK failed to load. Check internet.");

            setIsPaymentProcessing(true);

            // 2. Create Order on Backend
            const amount = cart.reduce((acc, t) => acc + t.standardPrice, 0);
            const orderRes = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/create-order`, { amount });
            const order = orderRes.data;

            // 3. Open Razorpay Checkout
            const options = {
                key: "rzp_test_RyumrLyiKMk7oo", // Public Key (Safe to expose)
                amount: order.amount,
                currency: "INR",
                name: "DocOn Healthcare",
                description: `Payment for ${selectedLab.name}`,
                image: "https://cdn-icons-png.flaticon.com/512/3063/3063823.png", // Logo
                order_id: order.id,
                handler: async function (response) {
                    try {
                        // 4. Verify Payment on Backend
                        const verifyRes = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/verify-payment`, response);

                        if (verifyRes.data.success) {
                            // 5. Save Booking (Only after success)
                            const payload = {
                                labId: selectedLab._id,
                                testIds: cart.map(t => t._id),
                                date: bookingDate,
                                collectionType,
                                address: collectionType === 'home' ? address : selectedLab.address,
                                totalAmount: amount,
                                paymentId: response.razorpay_payment_id
                            };

                            await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/labs/book`, payload, {
                                headers: { 'x-auth-token': token }
                            });

                            setPaymentSuccess({ txnId: response.razorpay_payment_id });
                            setCart([]);
                            setSelectedLab(null);

                            // 6. Notification
                            setShowNotification({
                                type: 'email',
                                message: `✅ Payment Successful! ID: ${response.razorpay_payment_id}`
                            });
                            setTimeout(() => setShowNotification(null), 5000);
                        }
                    } catch (err) {
                        alert("Payment Verification Failed: " + err.message);
                    } finally {
                        setIsPaymentProcessing(false);
                        setShowBookingModal(false);
                    }
                },
                prefill: {
                    name: "User Name", // Ideally from user profile
                    email: "user@example.com",
                    contact: "9999999999"
                },
                theme: {
                    color: "#2563eb"
                },
                modal: {
                    ondismiss: function () {
                        setIsPaymentProcessing(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (err) {
            setIsPaymentProcessing(false);
            console.error(err);
            alert("Payment Initiation Failed");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-teal-200">
            {/* Ethereal Hero Section */}
            <div className="relative pt-24 pb-32 overflow-hidden bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-900 border-b border-teal-950/50">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center md:text-left flex flex-col items-center md:items-start">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-800/50 border border-teal-700/50 text-teal-200 text-xs font-bold mb-6 backdrop-blur-sm">
                        <Star size={12} className="text-amber-400" /> 
                        Trusted by 50,000+ Patients
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
                        Diagnostic Excellence,<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-emerald-300">Delivered to You.</span>
                    </h1>
                    <p className="text-lg text-teal-100/80 max-w-2xl font-medium leading-relaxed mb-8">
                        Explore our curated marketplace of certified diagnostic laboratories. Book comprehensive test packages securely and get accurate results directly to your digital vault.
                    </p>
                </div>
            </div>

            {/* Floating Filter Ribbon */}
            <div className="max-w-5xl mx-auto px-6 -mt-12 relative z-20">
                <div className="bg-white/90 backdrop-blur-xl border border-white shadow-2xl shadow-teal-900/10 rounded-3xl p-4 md:p-6 flex flex-col md:flex-row gap-4 items-center">
                    
                    <div className="flex-1 w-full relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <MapPin size={18} className="text-teal-600 group-focus-within:text-teal-800 transition-colors" />
                        </div>
                        <select
                            className="w-full bg-white/50 border-2 border-slate-100 text-slate-700 font-semibold rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all appearance-none cursor-pointer"
                            value={selectedState}
                            onChange={(e) => handleStateChange(e.target.value)}
                        >
                            <option value="" className="text-slate-400">Search by State...</option>
                            {states.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="w-px h-12 bg-slate-200 hidden md:block"></div>

                    <div className="flex-1 w-full relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-teal-600">
                            <Search size={18} className="group-focus-within:text-teal-800 transition-colors" />
                        </div>
                        <select
                            className={`w-full bg-white/50 border-2 border-slate-100 font-semibold rounded-2xl py-4 pl-12 pr-4 transition-all appearance-none cursor-pointer focus:outline-none ${!selectedState ? 'opacity-50 cursor-not-allowed text-slate-400' : 'text-slate-700 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10'}`}
                            value={selectedDistrict}
                            onChange={(e) => fetchLabs(e.target.value)}
                            disabled={!selectedState}
                        >
                            <option value="">Select District</option>
                            {districts.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Step 2: Labs Grid */}
            <div className="max-w-7xl mx-auto px-6 pt-16 mt-8">
                {selectedState && !selectedDistrict && (
                    <div className="text-center py-20 animate-fade-in transition-all duration-500">
                        <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <MapPin size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Select a District</h3>
                        <p className="text-slate-500 mt-2">Filter down to see certified diagnostic centres near you in {selectedState}.</p>
                    </div>
                )}

                {selectedDistrict && labs.length === 0 && (
                    <div className="text-center py-20 animate-fade-in transition-all duration-500">
                        <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">No Labs Found</h3>
                        <p className="text-slate-500 mt-2">We couldn't find any registered diagnostic centres in {selectedDistrict}.</p>
                    </div>
                )}

                {selectedDistrict && labs.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <span className="w-2 h-8 bg-teal-500 rounded-full inline-block"></span>
                            Verified Centres in {selectedDistrict}
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {labs.map((lab, i) => (
                                <div 
                                    key={lab._id} 
                                    className="group relative bg-white border-2 border-slate-100 rounded-3xl p-6 hover:border-teal-400 transition-all duration-300 hover:shadow-2xl hover:shadow-teal-900/10 cursor-pointer overflow-hidden isolate"
                                    onClick={() => navigate(`/lab/${lab._id}`, { state: { selectedState, selectedDistrict } })}
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full translate-x-16 -translate-y-16 group-hover:bg-teal-100 transition-colors -z-10"></div>
                                    
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-slate-50 text-slate-600 p-3 rounded-2xl group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                                            <TestTube size={24} />
                                        </div>
                                        <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-xs font-bold border border-amber-200/50 shadow-sm">
                                            <Star size={12} className="fill-amber-400 text-amber-500" /> 
                                            {lab.rating || '4.8'}
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-xl text-slate-800 mb-2 leading-tight group-hover:text-teal-900">{lab.name}</h3>
                                    
                                    <div className="text-sm text-slate-500 flex flex-col gap-2 mb-6">
                                        <p className="flex items-center gap-1.5 line-clamp-2">
                                            <MapPin size={14} className="shrink-0 text-slate-400" /> {lab.address}
                                        </p>
                                        <p className="flex items-center gap-1.5 leading-none">
                                            <Phone size={14} className="shrink-0 text-slate-400" /> {lab.contactNumber || 'Contact N/A'}
                                        </p>
                                        {lab.email && (
                                            <p className="flex items-center gap-1.5 truncate leading-none">
                                                <Mail size={14} className="shrink-0 text-slate-400" /> {lab.email}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 mt-auto pt-4 border-t border-slate-100">
                                        {lab.isHomeCollectionAvailable && (
                                            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 border border-emerald-100/50">
                                                <Home size={12} /> Home Collection
                                            </span>
                                        )}
                                    </div>
                                    
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default LabMarketplace;

