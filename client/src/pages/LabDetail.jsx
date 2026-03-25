import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Star, Home, ShoppingCart, ArrowLeft, Loader2, CheckCircle, CreditCard, X, ShieldCheck, Calendar as CalendarIcon, FileText, Download, Phone, Mail } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const LabDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Data State
    const [lab, setLab] = useState(null);
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Cart & Selection
    const [cart, setCart] = useState([]);
    const [showBookingModal, setShowBookingModal] = useState(false);

    // Payment State
    const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(null);
    const [notification, setNotification] = useState(null);

    // Booking Form
    const [bookingDate, setBookingDate] = useState('');
    const [collectionType, setCollectionType] = useState('walk_in');
    const [address, setAddress] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Lab Details
                const labRes = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/labs/public/${id}`);
                setLab(labRes.data);

                // Fetch All Tests (In a real app, we might filter by what the lab offers)
                const testsRes = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/labs/tests`);
                setTests(testsRes.data);
            } catch (err) {
                console.error("Failed to load data", err);
                alert("Lab not found");
                navigate('/diagnostics');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    // --- Helpers ---
    const toggleTest = (test) => {
        const exists = cart.find(t => t._id === test._id);
        if (exists) {
            setCart(cart.filter(t => t._id !== test._id));
        } else {
            // Ensure price is a number
            const safeTest = { ...test, standardPrice: Number(test.standardPrice) || 0 };
            setCart([...cart, safeTest]);
        }
    };

    const loadRazorpay = (src = "https://checkout.razorpay.com/v1/checkout.js") => {
        return new Promise(resolve => {
            const script = document.createElement("script");
            script.src = src;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    // --- Booking Logic ---
    const handleBook = async () => {
        try {
            const token = sessionStorage.getItem('token') || localStorage.getItem('token');
            if (!token) return alert('Please Login First');
            if (!bookingDate) return alert('Please select a date');

            setIsPaymentProcessing(true);

            // 1. Load Razorpay
            const isLoaded = await loadRazorpay();
            if (!isLoaded) {
                setIsPaymentProcessing(false);
                return alert("Razorpay SDK failed to load. Check internet.");
            }

            // 2. Create Order
            const amount = cart.reduce((acc, t) => acc + t.standardPrice, 0);
            if (amount <= 0) {
                setIsPaymentProcessing(false);
                return alert("Total amount must be greater than 0");
            }

            const orderRes = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/payment/create-order`, { amount });
            const order = orderRes.data;

            // 3. Open Checkout
            const options = {
                key: "rzp_test_RyumrLyiKMk7oo",
                amount: order.amount,
                currency: "INR",
                name: "DocOn Healthcare",
                description: `Payment for ${lab.name}`,
                image: "https://cdn-icons-png.flaticon.com/512/3063/3063823.png",
                order_id: order.id,
                handler: async function (response) {
                    try {
                        // 4. Verify & Save
                        const verifyRes = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/payment/verify`, response);

                        if (verifyRes.data.status === 'success') {
                            const payload = {
                                labId: lab._id,
                                testIds: cart.map(t => t._id),
                                date: bookingDate,
                                collectionType,
                                address: collectionType === 'home' ? address : lab.address,
                                totalAmount: amount,
                                paymentId: response.razorpay_payment_id
                            };

                            await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/labs/book`, payload, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });

                            // Capture Cart Details before clearing
                            const bookedTests = [...cart];
                            const paidAmount = amount;

                            setPaymentSuccess({
                                txnId: response.razorpay_payment_id,
                                amount: paidAmount,
                                tests: bookedTests,
                                date: bookingDate,
                                labName: lab.name
                            });
                            setCart([]);
                            setShowBookingModal(false);
                        }
                    } catch (err) {
                        alert("Payment Verification Failed: " + err.message);
                    } finally {
                        setIsPaymentProcessing(false);
                    }
                },
                prefill: {
                    name: "User",
                    email: "user@example.com",
                    contact: "9999999999"
                },
                theme: { color: "#2563eb" },
                modal: { ondismiss: () => setIsPaymentProcessing(false) }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (err) {
            setIsPaymentProcessing(false);
            console.error("Booking Error", err);
            alert("Payment Initiation Failed");
        }
    };

    const generateInvoice = () => {
        if (!paymentSuccess) return;

        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.setTextColor(15, 118, 110); // Teal
        doc.text("DocOn Healthcare", 20, 20);

        doc.setFontSize(14);
        doc.setTextColor(100);
        doc.text("Lab Booking Invoice", 20, 30);

        doc.line(20, 35, 190, 35);

        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(`Lab: ${paymentSuccess.labName}`, 20, 45);
        doc.text(`Booking Date: ${new Date().toLocaleDateString()}`, 20, 50);
        doc.text(`Transaction ID: ${paymentSuccess.txnId}`, 20, 55);
        doc.text(`Scheduled Date: ${new Date(paymentSuccess.date).toLocaleDateString()}`, 20, 60);

        const tableData = paymentSuccess.tests.map(t => [t.name, `Rs. ${t.standardPrice}`]);
        autoTable(doc, {
            startY: 70,
            head: [['Test Name', 'Price']],
            body: [
                ...tableData,
                ['Total Paid', `Rs. ${paymentSuccess.amount}`]
            ],
            theme: 'striped',
            headStyles: { fillColor: [15, 118, 110] }
        });

        doc.save(`Invoice_${paymentSuccess.txnId}.pdf`);
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-teal-600" size={48} /></div>;
    if (!lab) return null;

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-teal-200">
            {/* Premium Header */}
            <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900 pb-24 pt-8 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="max-w-7xl mx-auto relative z-10">
                    <button
                        onClick={() => navigate('/diagnostics', { state: location.state })}
                        className="flex items-center gap-2 text-teal-100/80 hover:text-white transition font-medium mb-6 bg-white/10 px-4 py-2 rounded-full w-max backdrop-blur-md border border-white/20"
                    >
                        <ArrowLeft size={18} /> Back to Directory
                    </button>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight">{lab.name}</h1>
                            <div className="flex flex-wrap items-center gap-4 text-teal-100">
                                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 backdrop-blur-md font-medium text-sm">
                                    <MapPin size={16} className="text-teal-300" /> {lab.address}, {lab.city}
                                </span>
                                {lab.contactNumber && (
                                    <span className="flex flex-auto lg:flex-none items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 backdrop-blur-md font-medium text-sm">
                                        <Phone size={16} className="text-teal-300" /> {lab.contactNumber}
                                    </span>
                                )}
                                {lab.email && (
                                    <span className="flex flex-auto lg:flex-none items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 backdrop-blur-md font-medium text-sm">
                                        <Mail size={16} className="text-teal-300" /> {lab.email}
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5 bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/30 backdrop-blur-md text-amber-200 font-bold text-sm">
                                    <Star size={16} className="fill-amber-400" /> {lab.rating || '4.8'} Rating
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {lab.isHomeCollectionAvailable && (
                                <span className="px-4 py-2 bg-emerald-500/20 text-emerald-100 border border-emerald-500/30 rounded-xl text-sm font-bold flex items-center gap-2 backdrop-blur-md shadow-lg shadow-emerald-900/50">
                                    <Home size={16} className="text-emerald-400" /> Home Sample Col.
                                </span>
                            )}
                            <span className="px-4 py-2 bg-blue-500/20 text-blue-100 border border-blue-500/30 rounded-xl text-sm font-bold flex items-center gap-2 backdrop-blur-md shadow-lg shadow-blue-900/50">
                                <ShieldCheck size={16} className="text-blue-400" /> NABL Certified
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 -mt-20 relative z-20">

                {/* Left: Test Catalog */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white/90 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-xl shadow-teal-900/5 border border-white">
                        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Diagnostic Tests</h2>
                            <p className="text-slate-400 font-medium text-sm">{tests.length} tests available</p>
                        </div>

                        <div className="space-y-10">
                            {Object.entries(tests.reduce((acc, test) => {
                                const spec = test.specialty || 'Comprehensive Packages';
                                if (!acc[spec]) acc[spec] = [];
                                acc[spec].push(test);
                                return acc;
                            }, {})).map(([specialty, specialtyTests]) => (
                                <div key={specialty}>
                                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-gradient-to-b from-teal-400 to-emerald-500 rounded-full"></div>
                                        {specialty}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {specialtyTests.map(test => {
                                            const isSelected = cart.find(t => t._id === test._id);
                                            // Mock fake discount calculation for UI feel
                                            const originalPrice = Math.round(test.standardPrice * 1.4); 
                                            const discountPercent = Math.round(((originalPrice - test.standardPrice) / originalPrice) * 100);

                                            return (
                                                <div
                                                    key={test._id}
                                                    onClick={() => toggleTest(test)}
                                                    className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between overflow-hidden isolate ${isSelected ? 'border-teal-500 bg-teal-50/50 shadow-md shadow-teal-500/10' : 'border-slate-100 hover:border-teal-300 hover:shadow-xl hover:shadow-teal-900/5 bg-white'
                                                        }`}
                                                >
                                                    {isSelected && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-50 rounded-bl-full -z-10"></div>}
                                                    
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className={`font-bold pr-8 leading-tight ${isSelected ? 'text-teal-900' : 'text-slate-800'}`}>{test.name}</h4>
                                                            <div className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-teal-500 border-teal-500 text-white shadow-md shadow-teal-500/40 transform scale-110' : 'border-slate-200 text-transparent'}`}>
                                                                <CheckCircle size={14} className={isSelected ? 'block' : 'hidden'} />
                                                            </div>
                                                        </div>
                                                        
                                                        <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">{test.description || 'Standard diagnostic test protocol with advanced imaging/reporting.'}</p>
                                                        
                                                        <div className="flex gap-2 mb-4">
                                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 font-semibold flex items-center gap-1">
                                                                <FileText size={10} /> Fast Report
                                                            </span>
                                                            {test.collectionType === 'home' && lab.isHomeCollectionAvailable ?
                                                                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-100 font-semibold flex items-center gap-1"><Home size={10} /> Home</span> :
                                                                <span className="text-[10px] bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-100 font-semibold flex items-center gap-1"><MapPin size={10} /> Visit</span>
                                                            }
                                                        </div>
                                                    </div>

                                                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-end justify-between">
                                                        <div>
                                                            <p className="text-[10px] text-slate-400 font-medium mb-0.5 line-through">₹{originalPrice}</p>
                                                            <div className={`text-xl font-black tracking-tight ${isSelected ? 'text-teal-700' : 'text-slate-900'}`}>₹{test.standardPrice}</div>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                                                            {discountPercent}% OFF
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Premium E-commerce Sticky Cart */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 bg-white rounded-3xl shadow-2xl shadow-teal-900/10 border border-slate-100 overflow-hidden flex flex-col max-h-[calc(100vh-8rem)]">
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white shrink-0">
                            <h2 className="text-xl font-black mb-1 flex items-center gap-2 tracking-tight">
                                <ShoppingCart className="text-teal-400" /> Cart Summary
                            </h2>
                            <p className="text-slate-400 text-sm font-medium">{cart.length} Test{cart.length !== 1 ? 's' : ''} Selected</p>
                        </div>

                        {cart.length === 0 ? (
                            <div className="flex-1 p-8 text-center flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                                    <ShoppingCart size={32} />
                                </div>
                                <h3 className="text-slate-500 font-bold mb-1">Your cart is empty</h3>
                                <p className="text-sm text-slate-400">Add diagnostic tests from the catalog to proceed.</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                {cart.map(item => (
                                    <div key={item._id} className="flex justify-between items-start group">
                                        <div className="flex-1 pr-4">
                                            <div className="font-bold text-slate-800 text-sm leading-tight mb-1">{item.name}</div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                {item.collectionType === 'home' && lab.isHomeCollectionAvailable ? 'Home Col.' : 'Lab Visit'}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <span className="font-black text-slate-800">₹{item.standardPrice}</span>
                                            <button 
                                                onClick={() => toggleTest(item)} 
                                                className="text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="p-6 bg-slate-50 shrink-0 border-t border-slate-100">
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-slate-500 text-sm font-medium">
                                    <span>Subtotal</span>
                                    <span>₹{cart.reduce((a, c) => a + c.standardPrice, 0)}</span>
                                </div>
                                <div className="flex justify-between text-emerald-600 font-bold text-sm">
                                    <span>Platform Fee</span>
                                    <span>FREE</span>
                                </div>
                                <div className="flex justify-between items-end pt-4 border-t border-slate-200">
                                    <span className="text-slate-600 font-bold">Total Amount</span>
                                    <span className="text-3xl font-black text-teal-800 tracking-tighter">₹{cart.reduce((a, c) => a + c.standardPrice, 0)}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowBookingModal(true)}
                                disabled={cart.length === 0}
                                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-4 rounded-2xl font-black tracking-wide hover:from-teal-700 hover:to-emerald-700 shadow-xl shadow-teal-600/20 transform transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                            >
                                Secure Checkout <ArrowLeft className="rotate-180" size={18} />
                            </button>

                            <p className="text-[10px] text-center text-slate-400 mt-4 font-bold flex items-center justify-center gap-1 uppercase tracking-widest">
                                <ShieldCheck size={14} className="text-emerald-500" /> 256-Bit Encrypted Payment
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Booking Modal (Glassmorphism) */}
            {showBookingModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6 overflow-y-auto">
                    <div className="bg-white rounded-[2rem] w-full max-w-4xl overflow-hidden shadow-2xl animate-fade-up flex flex-col md:flex-row relative">
                        {/* Abstract Decor */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal-400 opacity-20 blur-3xl rounded-full pointer-events-none"></div>
                        
                        {/* Left: Schedule & Select */}
                        <div className="w-full md:w-5/12 bg-slate-50 p-6 md:p-8 flex flex-col border-r border-slate-100 z-10">
                            <h3 className="font-black text-2xl text-slate-800 mb-6 tracking-tight flex items-center gap-2">
                                <CalendarIcon className="text-teal-500" /> Schedule Test
                            </h3>
                            
                            <div className="flex-1 flex flex-col">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                    Select Appointment Date
                                </label>
                                <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-sm mb-8 custom-datepicker-wrapper">
                                    <DatePicker
                                        selected={bookingDate ? new Date(bookingDate) : null}
                                        onChange={(date) => setBookingDate(date)}
                                        minDate={new Date()}
                                        inline
                                        calendarClassName="!w-full !border-0 !font-sans"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right: Fulfillment & Pay */}
                        <div className="w-full md:w-7/12 bg-white p-6 md:p-8 flex flex-col relative z-10">
                            <button 
                                onClick={() => setShowBookingModal(false)}
                                className="absolute top-6 right-6 w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-colors"
                            >
                                <X size={16} />
                            </button>
                            
                            <h3 className="font-black text-2xl text-slate-800 mb-8 tracking-tight opacity-0 md:opacity-100 select-none">Checkout Details</h3>

                            <div className="space-y-6 flex-1 flex flex-col">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Collection Method</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setCollectionType('walk_in')}
                                            className={`p-4 rounded-2xl border-2 font-bold transition-all flex flex-col items-center gap-2 ${collectionType === 'walk_in' ? 'border-teal-500 bg-teal-50 text-teal-800 shadow-md shadow-teal-500/10' : 'border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            <MapPin size={24} className={collectionType === 'walk_in' ? 'text-teal-600' : 'text-slate-400'} />
                                            Visit Lab Centre
                                        </button>

                                        {lab.isHomeCollectionAvailable ? (
                                            <button
                                                onClick={() => setCollectionType('home')}
                                                disabled={cart.some(t => t.collectionType === 'lab')}
                                                className={`p-4 rounded-2xl border-2 font-bold transition-all flex flex-col items-center gap-2 ${cart.some(t => t.collectionType === 'lab') ? 'opacity-40 cursor-not-allowed bg-slate-50' :
                                                    collectionType === 'home' ? 'border-teal-500 bg-teal-50 text-teal-800 shadow-md shadow-teal-500/10' : 'border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <Home size={24} className={collectionType === 'home' ? 'text-teal-600' : 'text-slate-400'} />
                                                Home Sample Pickup
                                            </button>
                                        ) : (
                                            <div className="p-4 border-2 border-slate-100 bg-slate-50 rounded-2xl text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                                                <X size={20} className="text-slate-300" />
                                                <span className="text-xs font-bold leading-tight">Home Pickup Form<br/>Not Supported</span>
                                            </div>
                                        )}
                                    </div>
                                    {collectionType === 'home' && cart.some(t => t.collectionType === 'lab') && (
                                        <p className="text-xs text-rose-600 mt-2 font-bold bg-rose-50 p-2.5 rounded-lg border border-rose-100 flex items-center gap-2">
                                            ⚠️ Cart contains imaging or complex 'Visit Only' tests.
                                        </p>
                                    )}
                                </div>

                                {collectionType === 'home' && (
                                    <div className="animate-fade-in relative">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Service Address</label>
                                        <textarea
                                            placeholder="Enter your complete home address for pickup..."
                                            className="w-full bg-white border-2 border-slate-200 p-4 rounded-2xl focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none font-medium text-slate-700 resize-none h-28 shadow-inner shadow-slate-100"
                                            onChange={(e) => setAddress(e.target.value)}
                                            value={address}
                                        ></textarea>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <div className="flex justify-between items-end mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <span className="text-slate-500 font-bold">Total Amount Due</span>
                                    <span className="text-3xl font-black text-slate-800 tracking-tighter">₹{cart.reduce((a, c) => a + c.standardPrice, 0)}</span>
                                </div>
                                <button
                                    onClick={handleBook}
                                    disabled={isPaymentProcessing}
                                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-slate-800 shadow-xl shadow-slate-900/20 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-3"
                                >
                                    {isPaymentProcessing ? <Loader2 className="animate-spin" /> : <CreditCard size={22} className="text-teal-400" />}
                                    {isPaymentProcessing ? 'Processing Transaction...' : 'Pay via Razorpay'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Payment Success Modal */}
            {paymentSuccess && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-lg flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-10 rounded-[2rem] shadow-2xl shadow-teal-900/40 text-center max-w-sm w-full animate-bounce-in relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-teal-400 to-emerald-500"></div>
                        
                        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                            <div className="absolute inset-0 border-4 border-emerald-100 rounded-full animate-ping opacity-50"></div>
                            <CheckCircle size={48} className="text-emerald-500 relative z-10" />
                        </div>
                        
                        <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Booking Confirmed</h2>
                        <p className="text-slate-500 font-medium mb-8">Your test has been scheduled and labs notified.</p>
                        
                        <div className="bg-slate-50 p-5 rounded-2xl mb-8 border border-slate-100">
                            <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-200">
                                <span className="text-slate-400 text-sm font-bold">Ref ID</span> 
                                <span className="font-mono font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">{paymentSuccess.txnId.slice(-8)}</span>
                            </div>
                            <div className="flex justify-between items-center text-lg">
                                <span className="text-slate-500 font-bold">Amount Paid</span> 
                                <span className="font-black text-slate-900">₹{paymentSuccess.amount}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={generateInvoice}
                                className="w-full border-2 border-slate-200 text-slate-600 hover:border-teal-500 hover:text-teal-700 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                <Download size={18} /> Download Receipt
                            </button>
                            <button 
                                onClick={() => { setPaymentSuccess(null); navigate('/patient/dashboard'); }} 
                                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all font-sans"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabDetail;

