import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Star, Calendar, Clock, Award, Phone, Mail, Building, Upload, X, CheckCircle, AlertCircle, Sun, Moon, Cloud, Video, Stethoscope, Shield, FileText } from 'lucide-react';

const DoctorDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const reschedulingApptId = location.state?.reschedulingApptId;
    const [doctor, setDoctor] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [slots, setSlots] = useState([]);
    const [bookedSlots, setBookedSlots] = useState([]); // Doctor's busy slots
    const [myAppts, setMyAppts] = useState([]); // Patient's own schedule

    // Booking Modal State
    const [showBookModal, setShowBookModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [reason, setReason] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [bookingStatus, setBookingStatus] = useState('idle'); // idle, processing, success, error
    const [errorMessage, setErrorMessage] = useState('');
    const [apptType, setApptType] = useState('in-person'); // 'in-person' | 'video'
    const [step, setStep] = useState('details'); // details, payment
    const [bookedApptId, setBookedApptId] = useState(null);

    // ... (useEffect hooks remain same) ...

    useEffect(() => {
        const fetchDoctor = async () => {
            try {
                const docRes = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/doctors/${id}`);
                setDoctor(docRes.data);

                const revRes = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/doctors/${id}/reviews`);
                setReviews(revRes.data);
            } catch (err) {
                console.error(err);
                alert('Failed to load doctor details');
            } finally {
                setLoading(false);
            }
        };
        fetchDoctor();
    }, [id]);

    useEffect(() => {
        const fetchBookedSlots = async () => {
            if (doctor && selectedDate) {
                try {
                    const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/doctors/${doctor._id}/booked-slots?date=${selectedDate}`);
                    setBookedSlots(res.data.map(d => new Date(d).toISOString()));
                } catch (err) {
                    console.error("Error fetching slots", err);
                }
            }
        };

        const fetchMyAppointments = async () => {
            const userStr = sessionStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                try {
                    const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/patients/appointments/${user.name}`);
                    setMyAppts(res.data.filter(a => a.status === 'scheduled'));
                } catch (err) {
                    console.error("Error fetching my schedule", err);
                }
            }
        };

        if (doctor) {
            setSlots(getSlotsForDate(selectedDate));
            fetchBookedSlots();
            fetchMyAppointments();
        }
    }, [selectedDate, doctor]);

    // ... (Time Slot Logic remains same) ...
    const parseTimeStr = (timeStr) => {
        if (!timeStr) return null;
        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) return null;
        let [_, h, m, period] = match;
        let hours = parseInt(h, 10);
        if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
        if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
        return { hours, minutes: parseInt(m, 10) };
    };

    const getSlotsForDate = (dateStr) => {
        const slots = [];
        const selected = new Date(dateStr);
        const now = new Date();

        let startH = 9, startM = 0;
        let endH = 17, endM = 0;

        if (doctor?.availability) {
            const parts = doctor.availability.split('-').map(s => s.trim());
            if (parts.length === 2) {
                const s = parseTimeStr(parts[0]);
                const e = parseTimeStr(parts[1]);
                if (s && e) {
                    startH = s.hours;
                    startM = s.minutes;
                    endH = e.hours;
                    endM = e.minutes;
                }
            }
        }

        let currentH = startH;
        let currentM = startM;
        let loops = 0;

        while (loops < 48) {
            if (currentH > endH || (currentH === endH && currentM >= endM)) break;
            if (currentH >= 24) break;

            const slot = new Date(selected);
            slot.setHours(currentH, currentM, 0, 0);

            if (selected.toDateString() === now.toDateString()) {
                if (slot > now) slots.push(slot);
            } else {
                slots.push(slot);
            }

            currentM += 30;
            if (currentM >= 60) {
                currentM = 0;
                currentH++;
            }
            loops++;
        }
        return slots;
    };


    const handleSlotClick = (slotDate) => {
        const userStr = sessionStorage.getItem('user');
        if (!userStr) {
            // Redirect to Patient Signup if not logged in
            sessionStorage.setItem('signupMessage', "Assuming you need to register? If not, please Login 💃");
            navigate('/patient/signup');
            return;
        }
        setSelectedSlot(slotDate);
        setBookingStatus('idle'); // Reset Status
        setErrorMessage('');
        setReason('');
        setApptType('in-person'); // Default to in-person
        setAttachments([]);
        setStep('details');
        setShowBookModal(true);
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        const uploadedUrls = [];

        try {
            const token = sessionStorage.getItem('token');
            for (let file of files) {
                const user = JSON.parse(sessionStorage.getItem('user') || '{}');
                const formData = new FormData();
                formData.append('file', file);
                formData.append('type', 'report');
                formData.append('title', file.name);
                formData.append('patientId', user.id || user._id);

                // Use the CORRECT Medical Record Endpoint
                const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/records/upload`, formData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                // Correctly construct URL from record response
                uploadedUrls.push(`/uploads/${res.data.record.fileUrl}`);
            }
            setAttachments([...attachments, ...uploadedUrls]);
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || 'Error uploading files';
            alert('Upload Error: ' + msg);
        } finally {
            setUploading(false);
            e.target.value = ''; // Reset input to allow re-selection
        }
    };

    const loadScript = (src) => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = src;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleConfirmReschedule = async () => {
        setBookingStatus('processing');
        setErrorMessage('');
        try {
            const token = sessionStorage.getItem('token');
            const res = await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/patients/appointments/${reschedulingApptId}/reschedule`, {
                date: selectedSlot.toISOString()
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setBookingStatus('success');
        } catch (err) {
            console.error("Reschedule Error:", err);
            setBookingStatus('error');
            setErrorMessage(err.response?.data?.message || "Failed to reschedule.");
        }
    };

    const handleRazorpayPayment = async () => {
        setBookingStatus('processing');
        setErrorMessage('');

        try {
            const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");

            if (!res) {
                throw new Error("Razorpay SDK failed to load. Check internet connection.");
            }

            // 1. Fetch Key & Create Order
            const { data: { key } } = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/payment/key`);

            const orderRes = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/payment/create-order`, {
                amount: doctor.consultationFee
            });

            if (!orderRes.data || !key) {
                throw new Error("Server communication failed. Please try again.");
            }

            const { amount, id: order_id, currency } = orderRes.data;

            const options = {
                key: key,
                amount: amount.toString(),
                currency: currency,
                name: "DocOn Healthcare",
                description: `Consultation with Dr. ${doctor.name}`,
                order_id: order_id,
                handler: async function (response) {
                    try {
                        const data = {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                        };

                        // 2. Verify Payment
                        const result = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/payment/verify`, data);

                        if (result.data.status === 'success' || result.data.success) {
                            confirmBooking(response.razorpay_payment_id, response.razorpay_order_id);
                        } else {
                            throw new Error("Payment verification failed");
                        }
                    } catch (verifyErr) {
                        console.error("Verification Error", verifyErr);
                        setBookingStatus('error');
                        setErrorMessage("Payment verification failed. Please contact support.");
                    }
                },
                modal: {
                    ondismiss: function () {
                        setBookingStatus('idle');
                        setErrorMessage('Payment cancelled.');
                    }
                },
                prefill: {
                    name: sessionStorage.getItem('userName') || "Patient Name",
                    email: "patient@example.com",
                    contact: "9999999999",
                },
                theme: {
                    color: "#2563eb",
                },
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();

        } catch (err) {
            console.error("Payment Error:", err);
            setBookingStatus('error');
            setErrorMessage(err.response?.data?.message || err.message || "Could not initiate payment.");
        }
    };

    const confirmBooking = async (razorpayPaymentId, razorpayOrderId) => {
        // Note: No e.preventDefault() as it is not always form event now
        setBookingStatus('processing');
        const userStr = sessionStorage.getItem('user');
        const user = JSON.parse(userStr);

        try {
            const token = sessionStorage.getItem('token');
            const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/patients/book`, {
                doctorId: doctor._id,
                patientId: user.id || user._id,
                patientName: user.name || "Valued Patient",
                slotStart: selectedSlot.toISOString(),
                date: selectedSlot,
                reason: reason,
                attachments: attachments,
                type: apptType,
                paymentStatus: 'paid',
                paymentId: razorpayPaymentId,
                orderId: razorpayOrderId
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Success Transition
            console.log("Booking API Response:", res.data);
            if (res.data.appointmentId) {
                setBookedApptId(res.data.appointmentId);
            }
            setBookingStatus('success');
            // Note: Auto-redirect removed so user can download receipt

        } catch (err) {
            console.error("Booking Error:", err);
            setBookingStatus('error');
            setErrorMessage(err.response?.data?.message || `Payment Successful but Booking Confirmation Failed. Payment ID: ${razorpayPaymentId}`);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Doctor Profile...</div>;
    if (!doctor) return <div className="p-8 text-center">Doctor not found.</div>;

    return (
        <div className="container mx-auto py-8 px-4 animate-fade">
            <button onClick={() => navigate(-1)} className="mb-4 text-gray-500 hover:text-black">
                &larr; Back to Search
            </button>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Profile Side */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-lg p-6 border flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-4xl text-blue-600 font-bold shrink-0">
                            {doctor.name[0]}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900">{doctor.name}</h1>
                            <p className="text-xl text-blue-600 font-medium mb-2">{doctor.specialization}</p>

                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-4">
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full">
                                    <Award size={16} className="text-orange-500" />
                                    <span>{doctor.experience || 'Experience Not Listed'}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full">
                                    <Star size={16} className="text-yellow-500" />
                                    <span>{doctor.averageRating?.toFixed(1) || 'New'} ({doctor.totalRatings} Reviews)</span>
                                </div>
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full">
                                    <Building size={16} className="text-purple-500" />
                                    <span>{doctor.medicalCouncil || 'Medical Council Verified'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="block text-gray-500 text-sm">Consultation Fee</span>
                            <span className="block text-2xl font-bold text-green-600">₹{doctor.consultationFee}</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow p-6 border">
                        <h3 className="text-xl font-bold mb-4">About & Contact</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <MapPin className="text-gray-400 mt-1" />
                                <div>
                                    <p className="font-semibold">Hospital / Clinic</p>
                                    <p className="text-gray-600">{doctor.address}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="text-gray-400" />
                                <div>
                                    <p className="font-semibold">Email</p>
                                    <p className="text-gray-600">{doctor.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="text-gray-400" />
                                <div>
                                    <p className="font-semibold">Phone</p>
                                    <p className="text-gray-600">{doctor.phone || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="text-gray-400" />
                                <div>
                                    <p className="font-semibold">Availability</p>
                                    <p className="text-gray-600">{doctor.availability || '9:00 AM - 5:00 PM'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow p-6 border">
                        <h3 className="text-xl font-bold mb-4">Patient Reviews</h3>
                        {reviews.length === 0 ? (
                            <p className="text-gray-500 italic">No reviews yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {reviews.map(rev => (
                                    <div key={rev._id} className="border-b pb-4 last:border-0">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-bold">{rev.maskedName}</span>
                                            <div className="flex text-yellow-400">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={14} fill={i < rev.rating ? "currentColor" : "none"} className={i < rev.rating ? "" : "text-gray-200"} />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-gray-600">{rev.review}</p>
                                        <p className="text-xs text-gray-400 mt-1">{new Date(rev.date).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Booking Side */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-lg p-6 border sticky top-4">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Calendar className="text-blue-600" /> {reschedulingApptId ? 'Reschedule Appointment' : 'Book Appointment'}
                        </h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                            <input
                                type="date"
                                className="w-full p-2 border rounded-lg"
                                value={selectedDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={e => setSelectedDate(e.target.value)}
                                onClick={(e) => {
                                    if (!sessionStorage.getItem('user')) {
                                        e.preventDefault();
                                        sessionStorage.setItem('signupMessage', "Assuming you need to register? If not, please Login 💃");
                                        navigate('/patient/signup');
                                    }
                                }}
                            />
                        </div>

                        <p className="text-sm font-semibold mb-2">Available Slots ({slots.length})</p>

                        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                            {slots.length === 0 ? (
                                <div className="col-span-2 flex flex-col items-center justify-center py-8 text-center animate-fade-in">
                                    <div className="relative mb-3">
                                        <Calendar size={48} className="text-gray-300" />
                                        <div className="absolute -top-1 -right-1 w-full h-full flex items-center justify-center">
                                            <div className="w-[120%] h-[2px] bg-red-400 rotate-45 transform origin-center rounded-full"></div>
                                        </div>
                                    </div>
                                    <p className="text-gray-500 font-medium mb-1">No slots available for today</p>
                                    <p className="text-xs text-gray-400 mb-4">Dr. {doctor.name.split(' ')[0]} is fully booked.</p>

                                    <button
                                        onClick={() => {
                                            const next = new Date(selectedDate);
                                            next.setDate(next.getDate() + 1);
                                            setSelectedDate(next.toISOString().split('T')[0]);
                                        }}
                                        className="btn btn-primary w-full py-2 text-sm bg-sky-500 hover:bg-sky-600 border-none"
                                    >
                                        Next availability on {(() => {
                                            const d = new Date(selectedDate);
                                            d.setDate(d.getDate() + 1);
                                            return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
                                        })()}
                                    </button>
                                </div>
                            ) : (
                                (() => {
                                    // Helper to group slots
                                    const grouped = {
                                        'Morning': slots.filter(s => s.getHours() < 12),
                                        'Afternoon': slots.filter(s => s.getHours() >= 12 && s.getHours() < 17),
                                        'Evening': slots.filter(s => s.getHours() >= 17)
                                    };

                                    return Object.entries(grouped).map(([period, periodSlots]) => {
                                        if (periodSlots.length === 0) return null;

                                        let PeriodIcon = Sun;
                                        if (period === 'Afternoon') PeriodIcon = Cloud;
                                        if (period === 'Evening') PeriodIcon = Moon;

                                        return (
                                            <div key={period} className="animate-fade-in">
                                                <div className="flex items-center gap-2 mb-3 text-gray-700 font-medium">
                                                    <PeriodIcon size={18} className={period === 'Evening' ? 'text-indigo-400' : 'text-orange-400'} />
                                                    {period} ({periodSlots.length} slots)
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {periodSlots.map((slot, i) => {
                                                        const isBooked = bookedSlots.includes(slot.toISOString());
                                                        const myConflict = myAppts.find(a => {
                                                            const aDate = new Date(a.date);
                                                            return aDate.getTime() === slot.getTime();
                                                        });
                                                        const isMyConflict = !!myConflict;

                                                        return (
                                                            <button
                                                                key={i}
                                                                onClick={() => !isBooked && !isMyConflict && handleSlotClick(slot)}
                                                                disabled={isBooked || isMyConflict}
                                                                className={`py-2 px-1 text-sm border rounded-lg transition-all text-center relative ${isBooked
                                                                    ? 'bg-gray-50 text-gray-300 cursor-not-allowed border-gray-100'
                                                                    : isMyConflict
                                                                        ? 'bg-orange-50 text-orange-400 border-orange-200 cursor-not-allowed'
                                                                        : 'hover:bg-blue-500 hover:text-white border-blue-200 text-blue-600 font-semibold'
                                                                    }`}
                                                            >
                                                                {slot.getHours() > 12 ? slot.getHours() - 12 : slot.getHours() === 0 ? 12 : slot.getHours()}:{slot.getMinutes() === 0 ? '00' : slot.getMinutes()} {slot.getHours() >= 12 ? 'PM' : 'AM'}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    });
                                })()
                            )}
                        </div>
                        <div className="mt-4 text-xs text-center text-gray-500 border-t pt-4">
                            Secure Payment Protected
                        </div>
                    </div>
                </div>
            </div>
            {/* Booking Modal */}
            {showBookModal && selectedSlot && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl modal-content relative">
                        {/* Success View */}
                        {bookingStatus === 'success' ? (
                            <div className="p-12 flex flex-col items-center justify-center text-center animate-fade-in">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                                    <CheckCircle size={48} className="text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">{reschedulingApptId ? 'Reschedule Confirmed!' : 'Booking Confirmed!'}</h2>
                                <p className="text-gray-500 mb-6">Your appointment with Dr. {doctor.name} has been {reschedulingApptId ? 'rescheduled' : 'scheduled'}.</p>

                                {bookedApptId && !reschedulingApptId && (
                                    <a
                                        href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/patients/appointments/${bookedApptId}/invoice`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mb-8 px-6 py-3 bg-white border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 text-gray-700 rounded-xl flex items-center gap-2 font-bold transition-all"
                                    >
                                        <FileText size={20} className="text-red-500" /> Download Receipt (PDF)
                                    </a>
                                )}

                                <button
                                    onClick={() => navigate('/patient/dashboard')}
                                    className="text-blue-600 hover:text-blue-800 font-bold underline"
                                >
                                    Go to Dashboard
                                </button>
                            </div>
                        ) : step === 'payment' ? (
                            /* Razorpay Payment Interface */
                            <div className="animate-fade-in flex flex-col h-full bg-white rounded-xl">
                                <div className="p-4 border-b flex items-center gap-2 bg-gray-50 rounded-t-xl">
                                    <button onClick={() => { setStep('details'); setBookingStatus('idle'); }} className="text-gray-500 hover:text-black transition-colors">
                                        &larr;
                                    </button>
                                    <h3 className="text-xl font-bold text-gray-800">Secure Payment</h3>
                                </div>
                                <div className="p-8 flex flex-col justify-between h-full">
                                    <div>
                                        {/* Order Summary */}
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-sm mb-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                                    <span className="text-2xl">🏥</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Consultation With</p>
                                                    <h4 className="font-bold text-gray-800 text-lg">Dr. {doctor.name}</h4>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center text-sm text-gray-600">
                                                    <span>Consultation Fee</span>
                                                    <span className="font-mono font-medium">₹{doctor.consultationFee}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm text-gray-600">
                                                    <span>Booking Charges</span>
                                                    <span className="text-green-600 font-medium">Free</span>
                                                </div>
                                                <hr className="border-blue-200" />
                                                <div className="flex justify-between items-center text-xl font-bold text-blue-700">
                                                    <span>Total Payable</span>
                                                    <span>₹{doctor.consultationFee}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-xl text-sm font-medium border border-green-100">
                                                <Shield size={18} />
                                                Secured by Razorpay (UPI, GPay, PhonePe, Cards)
                                            </div>
                                            <div className="grid grid-cols-4 gap-2 mt-2">
                                                {['UPI / QR', 'GPay', 'PhonePe', 'Cards'].map((method) => (
                                                    <button
                                                        key={method}
                                                        onClick={handleRazorpayPayment}
                                                        className="text-[10px] font-bold border border-gray-200 py-2 rounded bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm flex justify-center items-center"
                                                        title={`Pay via ${method}`}
                                                    >
                                                        {method}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleRazorpayPayment}
                                        disabled={bookingStatus === 'processing'}
                                        className="w-full bg-[#3399cc] hover:bg-[#287aa3] text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-3 text-lg transform hover:-translate-y-1"
                                    >
                                        {bookingStatus === 'processing' ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Processing Payment...
                                            </>
                                        ) : (
                                            <>
                                                <span>Pay ₹{doctor.consultationFee}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Regular Booking Form */
                            <>
                                <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                                    <div className="flex-1 mr-4">
                                        <h3 className="text-xl font-bold mb-1">Complete Booking</h3>
                                        {/* Smart Slot Switcher */}
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-blue-600" />
                                            <span className="text-sm font-medium text-gray-700">
                                                {selectedSlot.toLocaleDateString()}
                                            </span>
                                            <span className="text-gray-400">|</span>
                                            <select
                                                className={`text-sm font-bold border-none bg-transparent focus:ring-0 cursor-pointer ${bookingStatus === 'error' ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}
                                                value={selectedSlot.toISOString()}
                                                onChange={(e) => {
                                                    setSelectedSlot(new Date(e.target.value));
                                                    setBookingStatus('idle'); // Reset error on change
                                                    setErrorMessage('');
                                                }}
                                            >
                                                {slots.map((slot, i) => {
                                                    const isBooked = bookedSlots.includes(slot.toISOString());
                                                    const myConflict = myAppts.find(a => new Date(a.date).getTime() === slot.getTime());
                                                    const isMyConflict = !!myConflict;
                                                    const timeLabel = `${slot.getHours()}:${slot.getMinutes() === 0 ? '00' : slot.getMinutes()}`;

                                                    // Disable if booked or conflict (unless it's the currently selected one which might be the cause of error, but we want to allow switching AWAY from it)
                                                    const isDisabled = (isBooked || isMyConflict) && slot.getTime() !== selectedSlot.getTime();

                                                    return (
                                                        <option key={i} value={slot.toISOString()} disabled={isDisabled}>
                                                            {timeLabel} {isBooked ? '(Boooked)' : isMyConflict ? '(Your Appt)' : ''}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowBookModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                                </div>

                                <form onSubmit={(e) => { e.preventDefault(); reschedulingApptId ? handleConfirmReschedule() : setStep('payment'); }} className="p-6 space-y-4">
                                    {bookingStatus === 'error' && (
                                        <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
                                            <AlertCircle size={16} />
                                            {errorMessage}
                                        </div>
                                    )}

                                    {/* Appt Type Toggle */}
                                    <div className="bg-gray-100 p-1 rounded-lg flex mb-3">
                                        <button
                                            type="button"
                                            className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${apptType === 'in-person' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                            onClick={() => setApptType('in-person')}
                                        >
                                            <Building size={16} /> In-Clinic
                                        </button>
                                        <button
                                            type="button"
                                            className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${apptType === 'video' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                            onClick={() => setApptType('video')}
                                        >
                                            <Video size={16} /> Video Consult
                                        </button>
                                    </div>

                                    {/* Triage / Suitability Guide */}
                                    <div className={`text-xs p-3 rounded-lg mb-4 border ${apptType === 'video' ? 'bg-purple-50 border-purple-100 text-purple-800' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
                                        <div className="font-bold flex items-center gap-1 mb-1">
                                            {apptType === 'video' ? <Video size={14} /> : <Stethoscope size={14} />}
                                            {apptType === 'video' ? 'Suitable for Remote Consultation:' : 'Recommended for Physical Examination:'}
                                        </div>
                                        {apptType === 'video' ? (
                                            <ul className="list-disc list-inside space-y-0.5 opacity-90 pl-1">
                                                <li>General illness (Fever, Cold, Flu, Sore Throat)</li>
                                                <li>Pediatric & Women's Health (Consultations)</li>
                                                <li>Skin issues, Mental Health, & Lifestyle advice</li>
                                                <li><b>Reports Review</b> & Follow-ups</li>
                                                <li className="text-red-600 font-bold list-none mt-1 flex items-center gap-1">
                                                    <AlertCircle size={10} /> Not for Emergencies or Severe Injuries
                                                </li>
                                            </ul>
                                        ) : (
                                            <ul className="list-disc list-inside space-y-0.5 opacity-90 pl-1">
                                                <li>Physical Injuries, Trauma, or Severe Pain</li>
                                                <li>Conditions requiring hands-on examination</li>
                                                <li>Emergency symptoms (Breathing trouble, Chest pain)</li>
                                                <li>Immediate Lab Work or Imaging</li>
                                            </ul>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold mb-1">Reason for Visit <span className="text-red-500">*</span></label>
                                        <textarea
                                            required
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            rows="3"
                                            placeholder="Briefly describe your symptoms or reason for consultation..."
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                        ></textarea>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold mb-1">Attach Reports / X-Rays (Private)</label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                                            <input
                                                type="file"
                                                multiple
                                                className="hidden"
                                                id="file-upload"
                                                onChange={handleFileUpload}
                                            />
                                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                                <Upload className="text-gray-400 mb-2" />
                                                <span className="text-sm text-blue-600 font-medium">Click to Upload Files</span>
                                                <span className="text-xs text-gray-500 mt-1">Images or PDF (Max 5MB)</span>
                                            </label>
                                        </div>
                                        {attachments.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {attachments.map((url, idx) => (
                                                    <div key={idx} className="text-xs text-green-600 flex items-center gap-1">
                                                        <CheckCircle size={12} /> File {idx + 1} Uploaded
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {uploading && <p className="text-xs text-blue-500 mt-1 animate-pulse">Uploading...</p>}
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={uploading}
                                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-lg shadow-lg transition-all flex justify-center items-center gap-2"
                                        >
                                            {reschedulingApptId ? "Confirm New Time" : <>Proceed to Payment <span className="text-blue-200">(&rarr;)</span></>}
                                        </button>
                                        <p className="text-xs text-center text-gray-400 mt-3">
                                            Your data is encrypted and shared only with Dr. {doctor.name}.
                                        </p>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorDetails;

