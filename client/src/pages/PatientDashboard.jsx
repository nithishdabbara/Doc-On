import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, FileText, Bot, Send, User, Star, MapPin, Phone, X, Mail, Search, Video, Edit, CheckCircle, Crown, Shield, Activity as ActivityIcon, TestTube, Loader2, Clock, Download, Trash2, AlertTriangle } from 'lucide-react';
import Chatbot from '../components/Chatbot';
import ChatComponent from '../components/ChatComponent';
import PremiumDashboardTab from '../components/PremiumDashboardTab';

// --- VISUALIZATION ---
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PatientDashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [user, setUser] = useState(JSON.parse(sessionStorage.getItem('user') || '{}'));
    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, appointments, trends, ai
    const [isAiMinimized, setIsAiMinimized] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [submitStatus, setSubmitStatus] = useState('idle'); // idle, submitting, success, error

    const [ratingModal, setRatingModal] = useState(null); // { apptId, doctorName }
    const [isChatOpen, setIsChatOpen] = useState(false); // Deprecated but keeping for fallback? No, using activeTab='ai'
    const [aiInitialQuery, setAiInitialQuery] = useState('');
    const [aiInitialAttachment, setAiInitialAttachment] = useState(null);

    // New State for Detailed Appointment View
    const [apptSubTab, setApptSubTab] = useState('upcoming');
    const [historyFilter, setHistoryFilter] = useState('completed');
    const [dateFilter, setDateFilter] = useState('');
    const [selectedAppt, setSelectedAppt] = useState(null);
    const [loadingAppts, setLoadingAppts] = useState(false);

    // Rescheduling State
    const [reschedulingAppt, setReschedulingAppt] = useState(null);
    const [newDate, setNewDate] = useState('');
    const [rescheduleStatus, setRescheduleStatus] = useState('idle');

    // Trends State
    const [vitalsData, setVitalsData] = useState([]);
    const [loadingVitals, setLoadingVitals] = useState(false);

    const handleRescheduleSubmit = async (e) => {
        e.preventDefault();
        setRescheduleStatus('loading');
        try {
            const token = sessionStorage.getItem('token');
            await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/patients/appointments/${reschedulingAppt._id}/reschedule`,
                { date: newDate },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setRescheduleStatus('success');
            setTimeout(() => {
                setReschedulingAppt(null); // Close modal
                setRescheduleStatus('idle'); // Reset status
                setNewDate('');
                fetchAppointments(); // Refresh list
            }, 1500);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to reschedule. Slot might be busy.");
            setRescheduleStatus('idle');
        }
    };

    const navigate = useNavigate();

    const handleLogout = () => {
        sessionStorage.clear();
        navigate('/login');
    };
    const [showDigitizeModal, setShowDigitizeModal] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = sessionStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/patients/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                sessionStorage.setItem('user', JSON.stringify({ ...res.data, type: 'patient' }));
                setUser(res.data);
                if (res.data.name) sessionStorage.setItem('userName', res.data.name);
            } catch (err) {
                console.error('Failed to fetch user', err);
                if (err.response && (err.response.status === 401 || err.response.status === 400)) {
                    sessionStorage.removeItem('token');
                    sessionStorage.removeItem('user');
                    navigate('/login');
                }
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        if (user.name) {
            fetchAppointments();
            if (user.id || user._id) fetchVitals(user.id || user._id);
        }
    }, [user]);

    const fetchAppointments = async () => {
        setLoadingAppts(true);
        try {
            const token = sessionStorage.getItem('token');
            const resApt = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/patients/appointments-by-id/${user.id || user._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setAppointments(resApt.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingAppts(false);
        }
    };

    const fetchVitals = async (id) => {
        setLoadingVitals(true);
        try {
            const token = sessionStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/patients/vitals-history/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setVitalsData(res.data);
        } catch (err) {
            console.error("Error fetching vitals", err);
        } finally {
            setLoadingVitals(false);
        }
    };

    const getFilteredAppointments = () => {
        const now = new Date();
        return appointments.filter(apt => {
            const aptDate = new Date(apt.date);

            // Date Filter Check
            if (dateFilter) {
                const filterDate = new Date(dateFilter);
                // Compare only date parts (YYYY-MM-DD)
                if (
                    aptDate.getFullYear() !== filterDate.getFullYear() ||
                    aptDate.getMonth() !== filterDate.getMonth() ||
                    aptDate.getDate() !== filterDate.getDate()
                ) {
                    return false;
                }
            }

            if (apptSubTab === 'upcoming') {
                // If date filter is active, ignore the "now" constraint slightly or keep it?
                // Usually "upcoming" means future. User might filter for a specific future date.
                // But generally "upcoming" means >= now.
                return (apt.status === 'scheduled') && (aptDate >= now);
            } else {
                // History Logic
                if (historyFilter === 'completed') {
                    return apt.status === 'completed';
                } else {
                    // Cancelled or Missed (No Show)
                    const s = apt.status ? apt.status.toLowerCase() : '';
                    return s === 'cancelled' || s === 'no_show' || (s === 'scheduled' && aptDate < now);
                }
            }
        }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first
    };

    const cancelAppointment = async (id, reason) => {
        try {
            const token = sessionStorage.getItem('token');
            await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/patients/appointments/${id}/cancel`, { reason }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert('Appointment Cancelled');
            setSelectedAppt(null);
            fetchAppointments(); // Refresh list
        } catch (err) {
            alert('Error cancelling appointment');
        }
    };

    const submitRating = async (e) => {
        e.preventDefault();
        const rating = parseInt(e.target.rating.value);
        const review = e.target.review.value;
        setSubmitStatus('submitting');
        try {
            const token = sessionStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/doctors/appointments/${ratingModal.apptId}/rate`,
                { rating, review },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setSubmitStatus('success');
            setTimeout(() => {
                setRatingModal(null);
                setSubmitStatus('idle');
                fetchAppointments();
            }, 2000);
        } catch (err) {
            alert('Failed to submit rating');
            setSubmitStatus('idle');
        }
    };

    const handleAnalyze = (record) => {
        const query = `Analyze this ${record.isVirtual ? 'consultation note' : 'medical record'}: "${record.title}". Date: ${new Date(record.date).toDateString()}. ${record.content ? `Content: ${record.content}` : 'Review the attached report.'}`;
        setAiInitialQuery(query);

        if (record.attachments && record.attachments.length > 0) {
            setAiInitialAttachment(record.attachments[0]);
        } else {
            setAiInitialAttachment(null);
        }

        setActiveTab('ai');
    };

    // ...

    return (
        <div className="min-h-[85vh] flex flex-col">
            <div className="container animate-fade flex-1" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
                {/* ... */}

                {ratingModal && (
                    <div className="modal-overlay">
                        <div className="modal-content animate-fade-up" style={{ maxWidth: '400px' }}>
                            {submitStatus === 'success' ? (
                                <div className="flex flex-col items-center justify-center py-6 text-center animate-fade-in">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                        <span className="text-2xl text-green-600">✓</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-800 mb-2">Thank You!</h2>
                                    <p className="text-gray-500">Your feedback has been submitted.</p>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-xl mb-4">Rate Dr. {ratingModal.doctorName}</h2>
                                    <form onSubmit={submitRating} className="flex flex-col gap-4">
                                        {/* ... form fields ... */}
                                        <div>
                                            <label className="block text-sm mb-1">Rating (1-5)</label>
                                            <select name="rating" className="input-field">
                                                <option value="5">⭐⭐⭐⭐⭐ (Excellent)</option>
                                                <option value="4">⭐⭐⭐⭐ (Good)</option>
                                                <option value="3">⭐⭐⭐ (Average)</option>
                                                <option value="2">⭐⭐ (Poor)</option>
                                                <option value="1">⭐ (Terrible)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm mb-1">Review (Optional)</label>
                                            <textarea
                                                id="review-text"
                                                name="review"
                                                className="input-field mb-2"
                                                rows="3"
                                                placeholder="How was your experience?"
                                            ></textarea>

                                            {/* Suggestions */}
                                            <div className="flex flex-wrap gap-2">
                                                {['Friendly Staff', 'Clean Clinic', 'Good Treatment', 'Wait time was short', 'Highly Recommended'].map(tag => (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => {
                                                            const textarea = document.getElementById('review-text');
                                                            const currentVal = textarea.value;
                                                            textarea.value = currentVal ? `${currentVal}, ${tag}` : tag;
                                                        }}
                                                        className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1"
                                                    >
                                                        + {tag}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 justify-end mt-2">
                                            <button type="button" onClick={() => setRatingModal(null)} className="btn btn-secondary" disabled={submitStatus === 'submitting'}>Cancel</button>
                                            <button type="submit" className="btn btn-primary" disabled={submitStatus === 'submitting'}>
                                                {submitStatus === 'submitting' ? 'Submitting...' : 'Submit Rating'}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                )}



                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                            Welcome, {user.name?.split(' ')[0]}
                            {user.subscription?.tier === 'gold' && (
                                <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full border border-yellow-200 flex items-center gap-1">
                                    <Crown size={12} fill="currentColor" /> Gold Member
                                </span>
                            )}
                            {user.subscription?.tier === 'silver' && (
                                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full border border-gray-300 flex items-center gap-1">
                                    <Shield size={12} /> Silver Member
                                </span>
                            )}
                        </h1>
                        <p className="text-gray-500">Manage your health journey here.</p>
                    </div>
                    {(!user.subscription?.tier || user.subscription?.tier === 'free') && (
                        <button onClick={() => navigate('/membership')} className="text-sm font-bold text-yellow-600 hover:text-yellow-700 underline flex items-center gap-1 animate-pulse">
                            <Crown size={14} /> Upgrade to DocOn Plus
                        </button>
                    )}
                </div>

                {/* Navigation Tabs */}
                <div className="flex flex-wrap gap-4 mb-8">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-primary text-white shadow-lg shadow-teal-200' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                    >
                        <ActivityIcon size={18} /> Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('appointments')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'appointments' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Calendar size={18} /> My Appointments
                    </button>
                    <button
                        onClick={() => setActiveTab('records')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'records' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                    >
                        <FileText size={18} /> Medical Records
                    </button>
                    <button
                        onClick={() => setActiveTab('ai')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'ai' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Bot size={18} /> AI Health Assistant
                    </button>
                    <button
                        onClick={() => setActiveTab('labs')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'labs' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                    >
                        <FileText size={18} /> Lab Reports
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                    >
                        <User size={18} /> Profile & Settings
                    </button>




                    {/* AI Assistant Tab - Render directly to allow Chatbot to handle Full Screen */}
                    {activeTab === 'ai' && (
                        <Chatbot
                            isOpen={true}
                            onClose={() => { setActiveTab('appointments'); setAiInitialQuery(''); setAiInitialAttachment(null); }}
                            isEmbedded={false}
                            initialMessage={aiInitialQuery}
                            initialAttachment={aiInitialAttachment}
                            context={aiInitialQuery ? 'record_review' : 'symptom_check'}
                            isMinimized={isAiMinimized}
                            onToggleMinimize={() => setIsAiMinimized(!isAiMinimized)}
                        />
                    )}


                    <button
                        onClick={() => navigate('/search-doctors')}
                        className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-200 shadow-lg hover:shadow-xl hover:scale-105 transition-all ml-auto"
                    >
                        <Search size={20} /> Find Doctors
                    </button>
                </div >

                <div className="flex gap-4">
                    {/* Dashboard Tab */}
                    {activeTab === 'dashboard' && (
                        <div className="w-full">
                            <PremiumDashboardTab user={user} appointments={appointments} navigate={navigate} setActiveTab={setActiveTab} />
                        </div>
                    )}

                    {/* Appointments Tab */}
                    {activeTab === 'appointments' && (
                        <div className="flex gap-4 flex-col md:flex-row">
                            <div className="card h-fit flex-1" style={{ minHeight: '500px' }}>
                                <div className="flex items-center gap-2 mb-4 border-b pb-2">
                                    <Calendar color="var(--secondary)" />
                                    <h2 className="text-xl font-bold">My Appointments</h2>
                                </div>

                                {/* Sub Tabs */}
                                <div className="flex flex-col gap-3 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setApptSubTab('upcoming'); setDateFilter(''); }}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${apptSubTab === 'upcoming' ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}
                                        >
                                            Upcoming
                                        </button>
                                        <button
                                            onClick={() => setApptSubTab('history')}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${apptSubTab === 'history' ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}
                                        >
                                            History
                                        </button>
                                    </div>

                                    {/* History Filters */}
                                    {apptSubTab === 'history' && (
                                        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-200 animate-fade-in">
                                            <div className="flex bg-white rounded-lg p-1 border shadow-sm">
                                                <button
                                                    onClick={() => setHistoryFilter('completed')}
                                                    className={`px-3 py-1 text-xs font-bold rounded transition-colors ${historyFilter === 'completed' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                                                >
                                                    Completed Treatment
                                                </button>
                                                <button
                                                    onClick={() => setHistoryFilter('cancelled')}
                                                    className={`px-3 py-1 text-xs font-bold rounded transition-colors ${historyFilter === 'cancelled' ? 'bg-red-100 text-red-700' : 'text-gray-500 hover:bg-gray-50'}`}
                                                >
                                                    Cancelled / No Show
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2 ml-auto">
                                                <span className="text-xs font-bold text-gray-400 uppercase">Filter Date:</span>
                                                <input
                                                    type="date"
                                                    className="text-xs p-1.5 border rounded bg-white shadow-sm focus:ring-2 focus:ring-blue-100 outline-none"
                                                    value={dateFilter}
                                                    onChange={(e) => setDateFilter(e.target.value)}
                                                />
                                                {dateFilter && (
                                                    <button onClick={() => setDateFilter('')} className="text-gray-400 hover:text-red-500">
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                {loadingAppts ? (
                                    <p className="text-gray-500 text-center py-8">Loading appointments...</p>
                                ) : (
                                    <div className="space-y-3">
                                        {getFilteredAppointments().length === 0 ? (
                                            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed text-gray-400">
                                                <Calendar size={32} className="mx-auto mb-2 opacity-20" />
                                                <p className="italic">No {apptSubTab === 'history' ? `${historyFilter} ` : ''}appointments found{dateFilter ? ' for this date' : ''}.</p>
                                            </div>
                                        ) : (
                                            getFilteredAppointments().map(apt => (
                                                <div
                                                    key={apt._id}
                                                    onClick={() => setSelectedAppt(apt)}
                                                    className="p-4 border rounded-xl hover:shadow-md transition-shadow cursor-pointer bg-white group"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors">
                                                                {apt.doctorId?.name ? (apt.doctorId.name.toLowerCase().startsWith('dr') ? apt.doctorId.name : `Dr. ${apt.doctorId.name}`) : 'Unknown'}
                                                            </div>
                                                            <div className="text-sm text-blue-500 font-medium mb-1">{apt.doctorId?.specialization}</div>
                                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                                <Calendar size={12} /> {new Date(apt.date).toLocaleDateString('en-GB')} at {new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${apt.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                                                apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                    'bg-red-100 text-red-700'
                                                                }`}>
                                                                {apt.status}
                                                            </div>
                                                            {/* Payment Status Badge */}
                                                            {apt.paymentStatus === 'paid' && (
                                                                <div className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-50 text-teal-600 border border-teal-100 flex items-center gap-1">
                                                                    <CheckCircle size={10} /> Paid
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex gap-2 mt-3">
                                                        {apt.type === 'video' && apt.status === 'scheduled' && apt.meetingLink && (
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    try {
                                                                        const token = sessionStorage.getItem('token');
                                                                        await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/patients/appointments/${apt._id}/join`, {}, {
                                                                            headers: { 'Authorization': `Bearer ${token}` }
                                                                        });
                                                                    } catch (err) {
                                                                        console.error("Failed to join", err);
                                                                    }

                                                                    const roomName = apt.meetingLink.split('/').pop();
                                                                    navigate(`/meeting/${roomName}`);
                                                                }}
                                                                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-purple-200 shadow-md"
                                                            >
                                                                <Video size={14} /> Join
                                                            </button>
                                                        )}
                                                        {apt.status === 'scheduled' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/search`); // fallback if doctorId isn't fully populated
                                                                    if (apt.doctorId && apt.doctorId._id) {
                                                                        navigate(`/doctor/${apt.doctorId._id}`, { state: { reschedulingApptId: apt._id } });
                                                                    }
                                                                }}
                                                                className={`px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors ${apt.type === 'video' ? 'w-auto' : 'w-full justify-center'}`}
                                                            >
                                                                <Edit size={14} /> Reschedule
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Details Panel (Desktop) or Modal */}
                            {selectedAppt && (
                                <div className="card flex-1 h-fit border-l-4 border-l-blue-500 animate-fade-in relative">
                                    <button onClick={() => setSelectedAppt(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                                        <X size={20} />
                                    </button>

                                    <h3 className="text-xl font-bold mb-6">Appointment Details</h3>

                                    <div className="space-y-6">
                                        {/* Doctor Info */}
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                                {selectedAppt.doctorId?.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-lg">{selectedAppt.doctorId?.name?.toLowerCase().startsWith('dr') ? selectedAppt.doctorId?.name : `Dr. ${selectedAppt.doctorId?.name}`}</div>
                                                <div className="text-sm text-gray-500">{selectedAppt.doctorId?.specialization}</div>
                                                <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                                    <MapPin size={14} /> {selectedAppt.doctorId?.address || 'Clinic Address'}
                                                </div>
                                                {selectedAppt.doctorId?.phone && (
                                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                                        <Phone size={14} /> {selectedAppt.doctorId.phone}
                                                    </div>
                                                )}
                                                {selectedAppt.doctorId?.email && (
                                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                                        <Mail size={14} /> {selectedAppt.doctorId.email}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <hr />

                                        {/* Purpose */}
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-700 mb-2">Purpose of Visit</h4>
                                            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm">
                                                {selectedAppt.reasonForVisit || 'No reason provided.'}
                                            </p>
                                        </div>

                                        {/* Result (If Completed) */}
                                        {selectedAppt.status === 'completed' && (
                                            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                                <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                                                    <FileText size={16} /> Doctor's Prescription & Notes
                                                </h4>
                                                <p className="text-gray-800 text-sm mb-3">
                                                    {selectedAppt.treatmentNotes || 'No notes added.'}
                                                </p>

                                                {selectedAppt.doctorAttachments?.length > 0 && (
                                                    <div className="border-t border-green-200 pt-2 mt-2">
                                                        <span className="text-xs font-bold text-green-700 block mb-1">Prescriptions / Reports:</span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedAppt.doctorAttachments.map((url, i) => (
                                                                <a key={i} href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${url}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1.5 bg-white border border-green-200 rounded text-xs font-medium text-green-700 hover:shadow-sm">
                                                                    <FileText size={12} /> View Document {i + 1}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Rating */}
                                                {!selectedAppt.rating && (
                                                    <div className="mt-4 pt-3 border-t border-green-200 text-center">
                                                        <button onClick={() => setRatingModal({ apptId: selectedAppt._id, doctorName: selectedAppt.doctorId?.name })} className="text-sm font-bold text-yellow-600 hover:underline">
                                                            ★ Rate Experience
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Payment Info */}
                                        {selectedAppt.paymentId && (
                                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-4 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <span className="font-bold text-gray-500 block text-[10px] uppercase tracking-wider">Payment Verification</span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="font-mono text-xs text-gray-800">{selectedAppt.paymentId}</span>
                                                            <div className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-teal-50 text-teal-600 border border-teal-100 flex items-center gap-1">
                                                                <CheckCircle size={8} /> PAID
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/patients/appointments/${selectedAppt._id}/invoice`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-2.5 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-sm flex items-center gap-2 text-xs font-bold"
                                                    >
                                                        <Download size={14} /> Receipt
                                                    </a>
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        {selectedAppt.status === 'scheduled' && (
                                            <div className="mt-auto pt-6 border-t space-y-4">
                                                <div className="h-[300px]">
                                                    <ChatComponent
                                                        roomId={selectedAppt._id}
                                                        senderId={user._id || user.id}
                                                        senderRole="patient"
                                                        receiverId={selectedAppt.doctorId?._id || selectedAppt.doctorId}
                                                        receiverRole="doctor"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const reason = prompt('Please enter a reason for cancellation:');
                                                        if (reason) cancelAppointment(selectedAppt._id, reason);
                                                    }}
                                                    className="w-full py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium"
                                                >
                                                    Cancel Appointment
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ... existing records tab ... */}

                    {/* Lab Reports Tab */}
                    {activeTab === 'labs' && (
                        <div className="" style={{ flex: 1 }}>
                            <LabReportsList user={user} />
                        </div>
                    )}

                    {/* Medical Records (Enhanced) */}
                    {activeTab === 'records' && (
                        <div className="card" style={{ flex: 1 }}>
                            <div className="flex items-center gap-2 mb-4">
                                <FileText color="var(--accent)" />
                                <h2 className="text-xl">Medical Records</h2>
                                <button
                                    onClick={() => setShowDigitizeModal(true)}
                                    className="ml-auto px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 hover:scale-105 transition-transform"
                                >
                                    📷 Digitize Old Report
                                </button>
                            </div>

                            {/* List */}
                            <RecordList user={user} appointments={appointments} onAnalyze={handleAnalyze} />
                        </div>
                    )}


                    {/* Profile Settings */}
                    {activeTab === 'profile' && (
                        <div className="card" style={{ flex: 1 }}>
                            <h2 className="text-xl mb-6">Profile Settings</h2>

                            <ProfileForm user={user} setUser={setUser} />

                            {/* Password Security Section */}
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <Shield className="text-teal-600" size={20} />
                                    <h3 className="font-semibold">Security & Password</h3>
                                </div>

                                <p className="text-sm text-gray-500 mb-4">
                                    {user.isGoogleAuth
                                        ? "You signed in with Google. You can set a password here to login with email next time."
                                        : "Update your account password here."}
                                </p>

                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const newPass = e.target.newPass.value;
                                    if (newPass.length < 6) return alert("Password must be at least 6 characters");

                                    try {
                                        const token = sessionStorage.getItem('token');
                                        await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/patients/me`,
                                            { password: newPass },
                                            { headers: { 'Authorization': `Bearer ${token}` } }
                                        );
                                        alert("Password updated successfully! You can now login with email.");
                                        e.target.reset();
                                    } catch (err) {
                                        alert("Failed to update password");
                                    }
                                }} className="space-y-4 max-w-md">
                                    <div>
                                        <label className="text-sm text-gray-500">New Password</label>
                                        <input name="newPass" type="password" className="input-field" placeholder="Enter new password" required />
                                    </div>
                                    <button type="submit" className="btn btn-primary btn-sm">
                                        Update Password
                                    </button>
                                </form>
                            </div>

                            <div className="border-t mt-8 pt-6">
                                <button onClick={() => {
                                    sessionStorage.clear();
                                    window.location.href = '/';
                                }} className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 w-full">
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>



                {showDigitizeModal && (
                    <DigitizeReportModal
                        onClose={() => setShowDigitizeModal(false)}
                        onUploadSuccess={() => { window.location.reload(); }}
                    />
                )}

                {/* Reschedule Modal */}
                {
                    reschedulingAppt && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                                <h2 className="text-xl font-bold mb-4">Reschedule Appointment</h2>
                                <p className="text-sm text-gray-500 mb-4">
                                    Current: <b>{new Date(reschedulingAppt.date).toLocaleString()}</b> with Dr. {reschedulingAppt.doctorId?.name}
                                </p>

                                {rescheduleStatus === 'success' ? (
                                    <div className="text-center text-green-600 font-bold py-4">
                                        <CheckCircle size={48} className="mx-auto mb-2" />
                                        Rescheduled Successfully!
                                    </div>
                                ) : (
                                    <form onSubmit={handleRescheduleSubmit}>
                                        <label className="block text-sm font-bold mb-2">Select New Date & Time</label>
                                        <input
                                            type="datetime-local"
                                            required
                                            className="w-full p-2 border rounded-lg mb-6"
                                            min={new Date().toISOString().slice(0, 16)}
                                            value={newDate}
                                            onChange={(e) => setNewDate(e.target.value)}
                                        />
                                        <div className="flex justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setReschedulingAppt(null)}
                                                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-bold"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={rescheduleStatus === 'loading'}
                                                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {rescheduleStatus === 'loading' ? 'Checking...' : 'Confirm Change'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    )
                }
            </div >

            {/* AI Assistant - Rendered OUTSIDE the container to fix fixed positioning */}
            {
                activeTab === 'ai' && (
                    <Chatbot
                        isOpen={true}
                        onClose={() => { setActiveTab('appointments'); setAiInitialQuery(''); setAiInitialAttachment(null); }}
                        isEmbedded={false}
                        initialMessage={aiInitialQuery}
                        initialAttachment={aiInitialAttachment}
                        context={aiInitialQuery ? 'record_review' : 'symptom_check'}
                        isMinimized={isAiMinimized}
                        onToggleMinimize={() => setIsAiMinimized(!isAiMinimized)}
                    />
                )
            }
        </div>
    );
};

const RecordList = ({ user, appointments, onAnalyze }) => {
    const [records, setRecords] = useState([]);

    useEffect(() => {
        const fetchRecords = async () => {
            const userId = user._id || user.id;
            if (!userId || userId.length !== 24) {
                console.warn("Invalid User ID for records fetch:", userId);
                return;
            }

            let combinedRecords = [];

            // 1. Fetch Standard Medical Records
            try {
                const token = sessionStorage.getItem('token');
                const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/medical/patient/${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                combinedRecords = [...res.data];
            } catch (err) {
                console.error("Failed to fetch medical records", err);
            }

            // 2. Merge Completed Appointment Notes (Virtual Records)
            const noteRecords = appointments
                .filter(a => a.status === 'completed' && a.treatmentNotes)
                .map(a => ({
                    _id: a._id,
                    title: `Consultation Note - ${a.doctorId?.name || 'Doctor'}`,
                    type: 'prescription',
                    date: a.date,
                    uploadedBy: 'Doctor',
                    isVirtual: true,
                    content: a.treatmentNotes,
                    doctorName: a.doctorId?.name,
                    attachments: a.doctorAttachments || [],
                    reason: a.reasonForVisit
                }));

            combinedRecords = [...combinedRecords, ...noteRecords];

            // 3. Sort by Date Descending
            combinedRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

            setRecords(combinedRecords);
        };
        fetchRecords();
    }, [user, appointments]);

    const [viewNote, setViewNote] = useState(null);

    return (
        <div>
            {records.length === 0 ? <p>No records found.</p> : (
                <ul className="space-y-3">
                    {records.map(rec => (
                        <li key={rec._id} className="p-4 border rounded-xl bg-white shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
                            <div>
                                <div className="font-bold text-gray-800 flex items-center gap-2">
                                    {rec.title}
                                    {rec.isVirtual && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase">Note</span>}
                                </div>

                                {rec.reason && (
                                    <div className="text-sm text-gray-600 italic mt-0.5 mb-1">
                                        Purpose: {rec.reason}
                                    </div>
                                )}

                                <div className="text-xs text-gray-400 uppercase font-medium tracking-wide flex items-center gap-2">
                                    {rec.type} • {new Date(rec.date).toLocaleDateString()}
                                    {rec.attachments && rec.attachments.length > 0 && (
                                        <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 normal-case">
                                            <FileText size={10} /> {rec.attachments.length} File{rec.attachments.length > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                                {/* <div className="text-xs text-blue-600 mt-0.5">Uploaded by: {rec.uploadedBy}</div> */}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => onAnalyze(rec)}
                                    className="btn btn-sm bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200 flex items-center gap-1"
                                >
                                    <Bot size={14} /> Analyze
                                </button>
                                {rec.isVirtual ? (
                                    <button
                                        onClick={() => setViewNote(rec)}
                                        className="btn btn-sm bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
                                    >
                                        View Note
                                    </button>
                                ) : (
                                    <a href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${rec.fileUrl}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">
                                        View File
                                    </a>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* Simple Modal for Viewing Notes */}
            {viewNote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
                        <button onClick={() => setViewNote(null)} className="absolute top-4 right-4 text-gray-400 hover:text-black"><X size={20} /></button>

                        <h3 className="text-xl font-bold mb-1 pr-8 text-gray-800">{viewNote.title}</h3>
                        <p className="text-xs text-gray-400 mb-4">{new Date(viewNote.date).toLocaleString()}</p>

                        {viewNote.reason && (
                            <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <span className="text-xs font-bold text-blue-800 block mb-1 uppercase">Purpose of Visit</span>
                                <p className="text-sm text-blue-900">{viewNote.reason}</p>
                            </div>
                        )}

                        <div className="mb-4">
                            <span className="text-xs font-bold text-gray-500 block mb-1 uppercase">Doctor's Note</span>
                            <div className="bg-gray-50 p-4 rounded-xl border text-gray-800 text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
                                {viewNote.content}
                            </div>
                        </div>

                        {viewNote.attachments && viewNote.attachments.length > 0 && (
                            <div className="mb-6">
                                <span className="text-xs font-bold text-gray-500 block mb-2 uppercase">Attachments & Reports</span>
                                <div className="grid grid-cols-2 gap-2">
                                    {viewNote.attachments.map((url, i) => (
                                        <a
                                            key={i}
                                            href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${url}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-2 p-3 bg-white border rounded-lg hover:shadow-md hover:border-blue-400 transition-all group"
                                        >
                                            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-500 group-hover:bg-red-100 transition-colors">
                                                <FileText size={16} />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="text-sm font-medium text-gray-700 truncate">Document {i + 1}</div>
                                                <div className="text-xs text-blue-500 font-medium">Click to View</div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end pt-2 border-t">
                            <button onClick={() => setViewNote(null)} className="btn btn-primary w-full md:w-auto px-8">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ProfileForm = ({ user, setUser }) => {
    const navigate = useNavigate();
    const handleLogout = () => {
        sessionStorage.clear();
        navigate('/login');
    };
    const [isEditing, setIsEditing] = useState(false);
    const [status, setStatus] = useState('idle');
    const fileInputRef = useRef(null);

    // Initial state handling nested address
    const getInitialState = (u) => {
        let formattedDob = '';
        try {
            if (u.dob) {
                formattedDob = new Date(u.dob).toISOString().split('T')[0];
            }
        } catch (e) {
            console.error("Invalid DOI:", u.dob);
        }

        return {
            name: u.name || '',
            phone: u.phone || '',
            email: u.email || '', // Read only
            dob: formattedDob,
            gender: u.gender || '',
            bloodGroup: u.bloodGroup || '',
            timezone: u.timezone || '(UTC+05:30) Asia/Kolkata',
            extraPhone: u.extraPhone || '',
            language: (u.languages && u.languages.length > 0) ? u.languages[0] : 'English',
            profilePhoto: u.profilePhoto || '',
            // Address Breakdown
            houseNumber: u.address?.houseNumber || '',
            colony: u.address?.colony || '',
            city: u.address?.city || '',
            state: u.address?.state || '',
            country: u.address?.country || 'India',
            pincode: u.address?.pincode || ''
        };
    };

    const [formData, setFormData] = useState(getInitialState(user));

    useEffect(() => {
        setFormData(getInitialState(user));
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/upload`, formData);
            const fullUrl = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${res.data.fileUrl}`;
            setFormData({ ...formData, profilePhoto: fullUrl });
        } catch (err) {
            console.error(err);
            alert('Image upload failed');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('saving');
        try {
            const token = sessionStorage.getItem('token');

            // Reconstruct payload to match backend schema
            const payload = {
                ...formData,
                languages: [formData.language],
                address: {
                    houseNumber: formData.houseNumber,
                    colony: formData.colony,
                    city: formData.city,
                    state: formData.state,
                    country: formData.country,
                    pincode: formData.pincode
                }
            };

            await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/patients/me`, payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Fetch updated user to sync state
            const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/patients/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            sessionStorage.setItem('user', JSON.stringify({ ...res.data, type: 'patient' }));
            setUser(res.data);

            setStatus('success');
            setTimeout(() => {
                setStatus('idle');
                setIsEditing(false); // Switch to View Mode
            }, 1000);
        } catch (err) {
            console.error(err);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    // View Mode (Profile Display)
    if (!isEditing) {
        return (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 animate-fade">
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                    <h3 className="text-xl font-bold text-gray-800">Accounts</h3>
                    <div className="flex gap-4">
                        <button
                            onClick={() => navigate('/diagnostics')}
                            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2 shadow-sm"
                        >
                            <span className="text-xl">🧪</span> Book Lab Test
                        </button>
                        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition shadow-sm">
                            Logout
                        </button>
                    </div>
                </div>

                {/* Success Message */}
                {status === 'success' && (
                    <div className="bg-green-50 text-green-700 p-3 rounded mb-4 text-center font-medium border border-green-200">
                        Changes saved successfully!
                    </div>
                )}

                {/* Profile Section */}
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                    {/* Avatar Mock */}
                    <div className="flex-shrink-0">
                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-4xl font-bold overflow-hidden border-2 border-white shadow-md">
                            {user.profilePhoto ? (
                                <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                user.name ? user.name[0].toUpperCase() : 'U'
                            )}
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Name</label>
                            <div className="text-gray-800 font-medium text-lg">{user.name}</div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Email</label>
                            <div className="text-gray-800">{user.email}</div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Phone</label>
                            <div className="text-gray-800">{user.phone || '-'}</div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Date of Birth</label>
                            <div className="text-gray-800">{user.dob ? new Date(user.dob).toLocaleDateString('en-GB') : '-'}</div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Gender</label>
                            <div className="text-gray-800">{user.gender || '-'}</div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Blood Group</label>
                            <div className="text-gray-800">{user.bloodGroup || '-'}</div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Timezone</label>
                            <div className="text-gray-800">{user.timezone || '(UTC+05:30) Asia/Kolkata'}</div>
                        </div>
                    </div>
                </div>

                {/* Address Section */}
                <div className="mb-8">
                    <h4 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Address</h4>
                    <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-700">
                        {user.address && typeof user.address === 'object' ? (
                            <p>
                                {[
                                    user.address.houseNumber,
                                    user.address.colony,
                                    user.address.city,
                                    user.address.state,
                                    user.address.country,
                                    user.address.pincode
                                ].filter(Boolean).join(', ')}
                            </p>
                        ) : (
                            <p className="italic text-gray-500">No address added yet.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Edit Mode
    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 animate-fade">
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <h3 className="text-xl font-bold text-gray-800">Edit Profile</h3>
                <div>
                    <button type="button" onClick={() => setIsEditing(false)} className="mx-4 text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
                    <button
                        type="submit"
                        disabled={status === 'saving'}
                        className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded font-semibold shadow-sm transition-all disabled:opacity-50"
                    >
                        {status === 'saving' ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="flex gap-8 mb-8 items-start">
                {/* Avatar Upload */}
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-4xl font-bold overflow-hidden border-2 border-dashed border-gray-400">
                        {formData.profilePhoto ? (
                            <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover opacity-80" />
                        ) : (
                            <div className="flex flex-col items-center">
                                <span>+</span>
                                <span className="text-[10px] uppercase font-bold">Photo</span>
                            </div>
                        )}
                    </div>
                    {/* Fallback File Input */}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="mt-2 text-sm text-gray-500"
                    />
                </div>

                <div className="flex-1 space-y-8">
                    {/* Section 1: Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="label">Name*</label>
                            <input name="name" value={formData.name} onChange={handleChange} className="input-field" required />
                        </div>
                        <div>
                            <label className="label">Phone Number</label>
                            <input name="phone" value={formData.phone} onChange={handleChange} className="input-field" placeholder="+91" />
                        </div>
                        <div>
                            <label className="label">Date of Birth</label>
                            <input name="dob" type="date" value={formData.dob} onChange={handleChange} className="input-field" />
                        </div>
                        <div>
                            <label className="label">Blood Group</label>
                            <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="input-field">
                                <option value="">Select</option>
                                <option value="A+">A+</option> <option value="A-">A-</option>
                                <option value="B+">B+</option> <option value="B-">B-</option>
                                <option value="O+">O+</option> <option value="O-">O-</option>
                                <option value="AB+">AB+</option> <option value="AB-">AB-</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Gender</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className="input-field">
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Timezone</label>
                            <select name="timezone" value={formData.timezone} onChange={handleChange} className="input-field">
                                <option value="(UTC+05:30) Asia/Kolkata">(UTC+05:30) Asia/Kolkata</option>
                                <option value="(UTC-05:00) Eastern Time">(UTC-05:00) Eastern Time</option>
                                <option value="(UTC+00:00) UTC">(UTC+00:00) UTC</option>
                            </select>
                        </div>
                    </div>

                    {/* Section 2: Address */}
                    <div>
                        <h4 className="text-gray-700 font-bold mb-4 border-b pb-2">Address</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="col-span-1">
                                <label className="label">House No / Street</label>
                                <input name="houseNumber" value={formData.houseNumber} onChange={handleChange} className="input-field" />
                            </div>
                            <div className="col-span-2">
                                <label className="label">Colony / Locality</label>
                                <input name="colony" value={formData.colony} onChange={handleChange} className="input-field" />
                            </div>
                            <div>
                                <label className="label">City</label>
                                <input name="city" value={formData.city} onChange={handleChange} className="input-field" />
                            </div>
                            <div>
                                <label className="label">State</label>
                                <input name="state" value={formData.state} onChange={handleChange} className="input-field" />
                            </div>
                            <div>
                                <label className="label">Country</label>
                                <select name="country" value={formData.country} onChange={handleChange} className="input-field">
                                    <option value="India">India</option>
                                    <option value="USA">USA</option>
                                    <option value="UK">UK</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Pincode</label>
                                <input name="pincode" value={formData.pincode} onChange={handleChange} className="input-field" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>

    );
};


// OCR Modal Component
const DigitizeReportModal = ({ onClose, onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setResult(null);
    };

    const handleScan = async () => {
        if (!file) return;
        setProcessing(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = sessionStorage.getItem('token');
            const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/ocr/extract`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setResult(res.data);
        } catch (err) {
            console.error(err);
            alert("OCR Failed. Please try a clearer image.");
        } finally {
            setProcessing(false);
        }
    };

    const handleSave = async () => {
        if (!result || !file) return;

        const title = `Digitized Report - ${new Date().toLocaleDateString()}`;
        const description = `Extracted Metadata:\n${result.extractedData.map(d => `${d.testName}: ${d.value}`).join('\n')}\n\nRaw Text:\n${result.rawText}`;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('type', 'report');
        formData.append('description', description);

        // We need patientId if storing for self. content logic handles it.
        try {
            const token = sessionStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/records/upload`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            alert('Record Saved Successfully!');
            onUploadSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Failed to save record.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2"><div className="p-1 bg-white/20 rounded"><FileText size={20} /></div> Digitize Physical Report</h3>
                    <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full"><X size={20} /></button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {!result ? (
                        <div className="text-center py-8 space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gray-50">
                                <input type="file" onChange={handleFileChange} accept="image/*" className="hidden" id="ocr-upload" />
                                <label htmlFor="ocr-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
                                        <FileText size={32} />
                                    </div>
                                    <span className="text-lg font-bold text-gray-700">Click to Upload Image</span>
                                    <span className="text-sm text-gray-500">Supports JPG, PNG (Max 5MB)</span>
                                </label>
                            </div>

                            {file && (
                                <div className="animate-fade-in">
                                    <p className="font-bold text-gray-800 mb-4">Selected: {file.name}</p>
                                    <button
                                        onClick={handleScan}
                                        disabled={processing}
                                        className="btn btn-primary px-8 py-3 text-lg w-full md:w-auto shadow-xl shadow-blue-200"
                                    >
                                        {processing ? 'Scanning with AI...' : '🔍 Start OCR Scan'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                                    <CheckCircle size={18} /> Extraction Successful
                                </h4>
                                <p className="text-sm text-green-700">{result.summary}</p>
                            </div>

                            <div className="space-y-2">
                                <h5 className="font-bold text-gray-700">Digital Values Found:</h5>
                                {result.extractedData.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {result.extractedData.map((d, i) => (
                                            <div key={i} className="flex justify-between p-3 bg-gray-50 border rounded-lg">
                                                <span className="text-gray-600 font-medium">{d.testName}</span>
                                                <span className="font-bold text-blue-600">{d.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">No structured values identified confidently. Raw text saved.</p>
                                )}
                            </div>

                            <div>
                                <h5 className="font-bold text-gray-700 mb-2">Raw Text Preview:</h5>
                                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded h-32 overflow-y-auto whitespace-pre-wrap font-mono">
                                    {result.rawText}
                                </div>
                            </div>

                            <button onClick={handleSave} className="btn btn-primary w-full py-3 shadow-lg shadow-blue-200">
                                💾 Save Digital Record
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;

// New Component: Lab Reports Tab
const LabReportsList = ({ user }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Scheduled'); // Scheduled, Completed, Documents, Cancelled
    const [showCancelModal, setShowCancelModal] = useState(null); // stores booking ID to cancel
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLabs = async () => {
            try {
                const token = sessionStorage.getItem('token');
                const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/labs/patient/bookings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setBookings(res.data);
            } catch (err) {
                console.error("Failed to fetch lab bookings", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLabs();
        fetchLabs();
    }, []);

    const initiateCancel = (bookingId) => {
        setShowCancelModal(bookingId);
    };

    const confirmCancel = async () => {
        if (!showCancelModal) return;
        const bookingId = showCancelModal;

        try {
            const token = sessionStorage.getItem('token');
            await axios.delete(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/labs/booking/${bookingId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Update UI locally
            setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'cancelled' } : b));
            setShowCancelModal(null);
        } catch (err) {
            console.error("Cancellation failed", err);
            alert("Failed to cancel booking. It may already be processed.");
            setShowCancelModal(null);
        }
    };

    const filteredBookings = bookings.filter(b => {
        if (filter === 'Documents') return b.status === 'report_generated' || b.status === 'completed';
        if (filter === 'Completed') return b.status === 'report_generated' || b.status === 'completed';
        if (filter === 'Scheduled') return ['scheduled', 'sample_collected', 'processing'].includes(b.status);
        return b.status === filter.toLowerCase();
    });

    // Stepper Helper
    const getStepStatus = (currentStatus, step) => {
        const steps = ['scheduled', 'sample_collected', 'processing', 'report_generated'];
        const currentIndex = steps.indexOf(currentStatus === 'completed' ? 'report_generated' : currentStatus);
        const stepIndex = steps.indexOf(step);

        if (currentIndex >= stepIndex) return 'completed';
        if (currentIndex === stepIndex - 1) return 'next';
        return 'pending';
    };

    return (
        <div className="card h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-teal-100 rounded-lg text-teal-700">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Lab Reports & Bookings</h2>
                        <p className="text-xs text-gray-500">Track diagnostics & download reports</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/diagnostics')}
                    className="px-4 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 flex items-center gap-2 transition shadow-lg shadow-teal-100"
                >
                    + Book Lab Test
                </button>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-2 border-b mb-4 overflow-x-auto pb-2">
                {['Scheduled', 'Completed', 'Documents', 'Cancelled'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition ${filter === tab ? 'bg-teal-100 text-teal-700' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {loading ? (
                <p className="text-center text-gray-500 py-10">Loading Report History...</p>
            ) : filteredBookings.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed text-gray-400 flex-1">
                    <p>No records found in '{filter}'</p>
                </div>
            ) : (
                <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                    {filteredBookings.map(book => (
                        <div key={book._id} className="p-5 border rounded-xl hover:shadow-md transition bg-white group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="font-bold text-gray-800 text-lg group-hover:text-teal-700 transition">
                                        {book.labId?.name || 'Unknown Lab'}
                                    </div>
                                    <div className="text-sm text-gray-500 mb-1 font-medium">
                                        {book.tests?.map(t => t.name).join(', ')}
                                    </div>
                                    <div className="text-[11px] text-gray-500 flex flex-wrap gap-x-3 gap-y-1 mb-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                        {book.labId?.contactNumber && <span className="flex items-center gap-1 text-teal-700"><Phone size={10} /> {book.labId.contactNumber}</span>}
                                        {book.labId?.email && <span className="flex items-center gap-1 text-blue-600"><Mail size={10} /> {book.labId.email}</span>}
                                        {book.labId?.address && <span className="flex items-center gap-1 text-gray-600"><MapPin size={10} /> {book.labId.address}</span>}
                                    </div>
                                    <div className="text-xs text-gray-400 flex gap-3 mt-2">
                                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(book.scheduledDate).toLocaleDateString()}</span>
                                        <span className="flex items-center gap-1"><MapPin size={12} /> {book.collectionType === 'home' ? 'Home Collection' : 'Lab Visit'}</span>
                                        <span className="font-mono text-gray-500">ID: {book._id.slice(-6).toUpperCase()}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    {/* Document Tab Specific Action */}
                                    {filter === 'Documents' ? (
                                        book.reportUrl ? (
                                            <a
                                                href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${book.reportUrl}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-100"
                                            >
                                                <Download size={16} /> Download PDF
                                            </a>
                                        ) : <span className="text-xs text-gray-400 italic">Processing...</span>
                                    ) : (
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${book.status === 'report_generated' || book.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                book.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {book.status.replace('_', ' ')}
                                            </span>
                                                {book.status !== 'cancelled' && (
                                                    <a
                                                        href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/labs/booking/${book._id}/invoice`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-[10px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 mt-1 bg-teal-50 px-2 py-1 rounded border border-teal-100 hover:bg-teal-100 transition"
                                                    >
                                                        <Download size={10} /> Download Receipt
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                            {/* Stepper for Active Bookings */}
                            {filter !== 'Documents' && (
                                <div className="mt-4 pt-4 border-t">
                                    {['scheduled', 'sample_collected', 'processing', 'report_generated'].includes(book.status) || book.status === 'completed' ? (
                                        <div className="flex items-center justify-between relative">
                                            {/* Progress Bar Background */}
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 rounded-full -z-10"></div>

                                            {/* Steps */}
                                            {[
                                                { id: 'scheduled', label: 'Booked', icon: Calendar },
                                                { id: 'sample_collected', label: 'Collected', icon: TestTube },
                                                { id: 'processing', label: 'Processing', icon: Loader2 },
                                                { id: 'report_generated', label: 'Report Ready', icon: FileText }
                                            ].map((step, idx) => {
                                                const status = getStepStatus(book.status, step.id);
                                                const Icon = step.icon;
                                                return (
                                                    <div key={step.id} className="flex flex-col items-center gap-1 bg-white px-2">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${status === 'completed' ? 'bg-teal-600 border-teal-600 text-white' :
                                                            status === 'pending' ? 'bg-white border-gray-200 text-gray-300' : 'bg-white border-gray-300 text-gray-500'
                                                            }`}>
                                                            {status === 'completed' ? <CheckCircle size={14} /> : <Icon size={14} />}
                                                        </div>
                                                        <span className={`text-[10px] font-bold uppercase ${status === 'completed' ? 'text-teal-700' : 'text-gray-400'}`}>
                                                            {step.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded text-center">
                                            Booking Cancelled
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* View Report Button (if not in Documents tab but ready) */}
                            {filter !== 'Documents' && (book.status === 'report_generated' || book.status === 'completed') && book.reportUrl && (
                                <div className="mt-4 flex justify-end">
                                    <a
                                        href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${book.reportUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        📄 View & Download Report
                                    </a>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-bounce-in text-center">
                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Cancel Booking?</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Are you sure you want to cancel this scheduled test? This action cannot be undone.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setShowCancelModal(null)}
                                className="px-4 py-3 rounded-xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                            >
                                Keep Booking
                            </button>
                            <button
                                onClick={confirmCancel}
                                className="px-4 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200 transition"
                            >
                                Yes, Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

