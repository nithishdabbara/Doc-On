import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, Clock, User, Stethoscope, ArrowLeft, Star, X, MapPin, Mail, Phone, ChevronLeft, ChevronRight, TestTube, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [labBookings, setLabBookings] = useState([]);
    const [viewMode, setViewMode] = useState('consultations'); // 'consultations' or 'labs'
    const [filter, setFilter] = useState('today'); // 'today', 'upcoming', 'past'
    const [selectedDate, setSelectedDate] = useState(null); // Overrides filter if set
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [loading, setLoading] = useState(true);

    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const navigate = useNavigate();

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const token = sessionStorage.getItem('adminToken');
            if (!token) return navigate('/admin');

            const [resAppt, resLab] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/appointments`, { headers: { authorization: token } }),
                axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/lab-bookings`, { headers: { authorization: token } })
            ]);
            
            setAppointments(resAppt.data);
            setLabBookings(resLab.data);
        } catch (err) {
            console.error(err);
            alert('Failed to fetch schedules');
        } finally {
            setLoading(false);
        }
    };

    // --- Logic ---
    const getFilteredData = () => {
        const sourceData = viewMode === 'consultations' ? appointments : labBookings;
        const dateField = viewMode === 'consultations' ? 'date' : 'scheduledDate';

        if (selectedDate) {
            // Calendar Mode
            const selStr = selectedDate.toDateString();
            return sourceData.filter(item => new Date(item[dateField]).toDateString() === selStr);
        }

        const now = new Date();
        const todayStr = now.toDateString();

        return sourceData.filter(item => {
            const itemDate = new Date(item[dateField]);
            const itemDateStr = itemDate.toDateString();

            if (filter === 'today') {
                if (viewMode === 'consultations') {
                    return itemDateStr === todayStr && ['scheduled', 'arrived'].includes(item.status);
                } else {
                    return itemDateStr === todayStr && item.status !== 'cancelled';
                }
            } else if (filter === 'upcoming') {
                return itemDate > now && itemDateStr !== todayStr && ['scheduled'].includes(item.status);
            } else if (filter === 'past') {
                const isPastDate = itemDate < now && itemDateStr !== todayStr;
                const isFinalStatus = viewMode === 'consultations'
                    ? ['completed', 'cancelled', 'no_show', 'no-show'].includes(item.status)
                    : ['completed', 'report_generated', 'cancelled', 'sample_collected'].includes(item.status);
                return isPastDate || isFinalStatus;
            }
            return true;
        });
    };

    const filtered = getFilteredData();

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 text-blue-700';
            case 'arrived': return 'bg-purple-100 text-purple-700';
            case 'completed': return 'bg-green-100 text-green-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            case 'no_show': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // --- Calendar Helper ---
    const generateCalendar = () => {
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        const startDay = startOfMonth.getDay();
        const days = [];

        // Padding
        for (let i = 0; i < startDay; i++) days.push(null);
        // Days
        for (let i = 1; i <= endOfMonth.getDate(); i++) {
            days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
        }
        return days;
    };

    return (
        <div className="container animate-fade" style={{ paddingTop: '2rem' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Appointments Management</h1>
                    <p className="text-gray-500 text-sm">Monitor booking requests and history.</p>
                </div>
                <button onClick={() => navigate('/admin/dashboard')} className="btn btn-secondary">
                    <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">

                {/* LEFT SIDEBAR: Calendar & filters */}
                <div className="w-full lg:w-1/4 space-y-6">
                    {/* Calendar Widget */}
                    <div className="card p-4">
                        <div className="flex justify-between items-center mb-4">
                            <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-1 hover:bg-gray-100 rounded">
                                <ChevronLeft size={20} />
                            </button>
                            <span className="font-bold text-gray-700">
                                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </span>
                            <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-1 hover:bg-gray-100 rounded">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                        <div className="grid grid-cols-7 text-center text-xs font-bold text-gray-400 mb-2">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {generateCalendar().map((date, i) => (
                                <button
                                    key={i}
                                    disabled={!date}
                                    onClick={() => {
                                        if (date) {
                                            setSelectedDate(date);
                                            setFilter('custom'); // Clear tab selection logic
                                        }
                                    }}
                                    className={`h-8 w-8 rounded-full flex items-center justify-center text-sm transition-colors
                                        ${!date ? '' : date.toDateString() === selectedDate?.toDateString()
                                            ? 'bg-blue-600 text-white font-bold shadow-md'
                                            : date.toDateString() === new Date().toDateString()
                                                ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200'
                                                : 'hover:bg-gray-100 text-gray-700'
                                        }
                                    `}
                                >
                                    {date ? date.getDate() : ''}
                                </button>
                            ))}
                        </div>
                        {selectedDate && (
                            <button
                                onClick={() => { setSelectedDate(null); setFilter('today'); }}
                                className="mt-4 w-full text-xs text-red-500 hover:text-red-700 font-medium border border-red-100 rounded py-1 bg-red-50"
                            >
                                Clear Date Filter
                            </button>
                        )}
                    </div>
                </div>

                {/* RIGHT CONTENT: List */}
                <div className="w-full lg:w-3/4">
                    {/* View Mode Master Toggle */}
                    <div className="flex gap-2 mb-6 border-b border-gray-200 pb-4">
                        <button 
                            onClick={() => { setViewMode('consultations'); setSelectedDate(null); setFilter('today'); }}
                            className={`flex items-center gap-2 px-4 py-2 font-bold rounded-lg transition-all ${viewMode === 'consultations' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}
                        >
                            <Stethoscope size={18} /> Consultations
                        </button>
                        <button 
                            onClick={() => { setViewMode('labs'); setSelectedDate(null); setFilter('today'); }}
                            className={`flex items-center gap-2 px-4 py-2 font-bold rounded-lg transition-all ${viewMode === 'labs' ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}
                        >
                            <TestTube size={18} /> Lab Bookings
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
                        {['today', 'upcoming', 'past'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => { setFilter(tab); setSelectedDate(null); }}
                                className={`px-6 py-2 rounded-md font-medium capitalize transition-all text-sm ${filter === tab && !selectedDate
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Header Info */}
                    <div className="mb-4 text-sm font-bold text-gray-500 border-l-4 border-blue-500 pl-3 py-1 bg-white shadow-sm inline-block rounded-r-md">
                        {selectedDate
                            ? `Showing ${viewMode} for ${selectedDate.toLocaleDateString()}`
                            : `Showing ${filter} ${viewMode}`} ({filtered.length})
                    </div>

                    {/* Table */}
                    <div className="card w-full overflow-hidden min-h-[400px]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b">
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase">Time</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase">{viewMode === 'consultations' ? 'Doctor' : 'Lab Provider'}</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase">Patient</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase">Status</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm uppercase text-right">{viewMode === 'consultations' ? 'Consultation Fees' : 'Settlement'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr><td colSpan="5" className="p-8 text-center text-gray-500 animate-pulse">Loading {viewMode}...</td></tr>
                                    ) : filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="p-12 text-center text-gray-500">
                                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400 mx-auto">
                                                    <CalendarIcon size={32} />
                                                </div>
                                                <p>No {viewMode} found for this filter.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map(item => (
                                            <tr key={item._id} className={`hover:${viewMode === 'consultations' ? 'bg-blue-50/50' : 'bg-teal-50/50'} transition-colors group`}>
                                                <td className="p-4 whitespace-nowrap">
                                                    <div className="font-bold text-gray-800">{new Date(viewMode === 'consultations' ? item.date : item.scheduledDate).toLocaleDateString('en-GB')}</div>
                                                    {viewMode === 'consultations' && (
                                                        <div className="text-sm text-blue-600 flex items-center gap-1 mt-0.5">
                                                            <Clock size={12} /> {item.time}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    {viewMode === 'consultations' ? (
                                                        <button onClick={() => setSelectedAppointment(item)} className="text-left group/doc">
                                                            <div className="font-medium text-gray-900 group-hover/doc:text-blue-600 transition-colors underline decoration-dotted decoration-gray-300">
                                                                {item.doctor}
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-0.5">{item.specialization}</div>
                                                        </button>
                                                    ) : (
                                                        <div className="text-left">
                                                            <div className="font-medium text-gray-900">{item.labId?.name || 'Unknown Lab'}</div>
                                                            <div className="text-xs text-gray-500 mt-0.5 uppercase tracking-wider">{item.collectionType?.replace('_', ' ')} Collection</div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${viewMode === 'consultations' ? 'bg-indigo-100 text-indigo-600' : 'bg-teal-100 text-teal-600'}`}>
                                                            {viewMode === 'consultations' ? item.patient?.[0] : item.patientId?.name?.[0]}
                                                        </div>
                                                        <span className="font-medium text-gray-700">{viewMode === 'consultations' ? item.patient : item.patientId?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(item.status)}`}>
                                                        {item.status.replace('_', ' ')}
                                                    </span>
                                                    {viewMode === 'consultations' && ['completed'].includes(item.status) && (
                                                        item.rating ? (
                                                            <div className="mt-1 flex items-center text-yellow-500 text-xs" title={`Reviewed: "${item.review}"`}>
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star key={i} size={10} fill={i < item.rating ? "currentColor" : "none"} />
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="mt-1 text-xs text-gray-400 italic">Not Rated</div>
                                                        )
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="font-mono font-bold text-gray-700">₹{viewMode === 'consultations' ? item.amount : item.totalAmount}</div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inspect Doctor Modal */}
            {selectedAppointment && (
                <div className="modal-overlay">
                    <div className="modal-content animate-fade-up max-w-md">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold">Appointment Details</h2>
                            <button onClick={() => setSelectedAppointment(null)} className="text-gray-400 hover:text-black"><X size={24} /></button>
                        </div>

                        {/* Doctor Profile */}
                        <div className="flex items-center gap-4 mb-6 border-b pb-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
                                {selectedAppointment.doctorInfo?.name?.[0]}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{selectedAppointment.doctorInfo?.name.toLowerCase().startsWith('dr') ? selectedAppointment.doctorInfo?.name : `Dr. ${selectedAppointment.doctorInfo?.name}`}</h3>
                                <p className="text-blue-600 font-medium">{selectedAppointment.doctorInfo?.specialization}</p>
                                <div className="flex text-yellow-500 text-sm mt-1">
                                    <Star size={14} fill="currentColor" />
                                    <span className="text-gray-600 ml-1 font-bold">{(selectedAppointment.doctorInfo?.averageRating || 0)}</span>
                                    <span className="text-gray-400 ml-1">({selectedAppointment.doctorInfo?.totalRatings || 0} reviews)</span>
                                </div>
                                <div className="mt-1 text-sm font-bold text-green-600">
                                    Consultation Fee: ₹{selectedAppointment.amount || selectedAppointment.doctorInfo?.consultationFee || 500}
                                </div>
                            </div>
                        </div>

                        {/* Review Section (The Fix) */}
                        {selectedAppointment.rating > 0 && (
                            <div className="mb-6 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                <h4 className="text-sm font-bold text-yellow-800 mb-2 uppercase tracking-wide">Patient Review</h4>
                                <div className="flex text-yellow-500 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={16} fill={i < selectedAppointment.rating ? "currentColor" : "none"} />
                                    ))}
                                </div>
                                <p className="text-gray-700 italic">"{selectedAppointment.review || 'No written review'}"</p>
                            </div>
                        )}

                        <div className="space-y-3 text-sm text-gray-700">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Mail size={16} className="text-gray-400" />
                                <span>{selectedAppointment.doctorInfo?.email}</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Phone size={16} className="text-gray-400" />
                                <span>{selectedAppointment.doctorInfo?.phone || 'No phone'}</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <MapPin size={16} className="text-gray-400" />
                                <span>{selectedAppointment.doctorInfo?.address || 'No address'}</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Stethoscope size={16} className="text-gray-400" />
                                <span>{selectedAppointment.doctorInfo?.experience} years experience</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t flex justify-end">
                            <button onClick={() => setSelectedAppointment(null)} className="btn btn-primary">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAppointments;

