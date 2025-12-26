import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import PaymentModal from '../components/PaymentModal';

const BookAppointment = () => {
    const [doctors, setDoctors] = useState([]);
    const [formData, setFormData] = useState({
        doctorId: '',
        date: '',
        visitType: 'General Checkup',
        notes: ''
    });
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [visitType, setVisitType] = useState('checkup'); // New State

    // AI-Lite Filters
    const searchParams = new URLSearchParams(window.location.search);
    const urlSpecialty = searchParams.get('specialty');
    const urlUrgency = searchParams.get('urgency');

    useEffect(() => {
        if (urlUrgency === 'high') setVisitType('urgent');
    }, [urlUrgency]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const [selectedCity, setSelectedCity] = useState('');
    const [showPayment, setShowPayment] = useState(false);

    // Dynamic Fee Logic
    const [consultationFee, setConsultationFee] = useState(500);

    useEffect(() => {
        switch (formData.visitType) {
            case 'General Checkup':
            case 'Follow-up':
                setConsultationFee(500);
                break;
            case 'Consultation': // Video/Telemedicine
                setConsultationFee(1000);
                break;
            case 'Urgent':
                setConsultationFee(1500);
                break;
            default:
                setConsultationFee(500);
        }
    }, [formData.visitType]);

    // Fetch Doctors with Smart Search
    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                // Pass specialty & city to API for scoring
                let query = '?';
                if (urlSpecialty) query += `specialty=${urlSpecialty}&`;
                if (selectedCity) query += `city=${selectedCity}&`;

                const res = await api.get(`/users/doctors${query}`);
                setDoctors(res.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to load doctors');
                setLoading(false);
            }
        };
        fetchDoctors();
    }, [urlSpecialty, selectedCity]); // Re-fetch when city changes

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleBookClick = (e) => {
        e.preventDefault();
        setShowPayment(true);
    };

    const handlePaymentSuccess = async () => {
        setShowPayment(false);
        try {
            await api.post('/appointments', formData);
            // Optionally create an invoice record here or let backend do it
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.msg || 'Failed to book appointment');
        }
    };

    // ...

    return (
        <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-6">Book an Appointment</h2>
            {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}

            {showPayment && (
                <PaymentModal
                    amount={consultationFee}
                    onSuccess={handlePaymentSuccess}
                    onClose={() => setShowPayment(false)}
                />
            )}

            <form onSubmit={handleBookClick}>
                {/* Filter by Location */}
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Filter by City (Optional)</label>
                    <input
                        type="text"
                        placeholder="Type city name (e.g. Mumbai)"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Select Doctor</label>
                    <select
                        name="doctorId"
                        value={formData.doctorId}
                        onChange={onChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        required
                    >
                        <option value="">-- Select a Doctor --</option>
                        {doctors.map(doctor => (
                            <option key={doctor._id} value={doctor._id}>
                                {doctor.name} - {doctor.specialization} {doctor.hospitalName ? `(${doctor.hospitalName}, ${doctor.city})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Selected Doctor Location Preview */}
                {formData.doctorId && (() => {
                    const selectedDoc = doctors.find(d => d._id === formData.doctorId);
                    if (selectedDoc && selectedDoc.hospitalName) {
                        const mapQuery = encodeURIComponent(`${selectedDoc.hospitalName}, ${selectedDoc.clinicAddress || ''}, ${selectedDoc.city} `);
                        return (
                            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <h4 className="font-bold text-blue-900 flex items-center gap-2">
                                    🏥 {selectedDoc.hospitalName}
                                </h4>
                                <p className="text-sm text-blue-800">{selectedDoc.clinicAddress}, {selectedDoc.city}</p>
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
                                >
                                    📍 Get Directions on Google Maps
                                </a >
                            </div >
                        );
                    }
                    return null;
                })()}

                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Date & Time</label>
                    <input
                        type="datetime-local"
                        name="date"
                        value={formData.date}
                        onChange={onChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Visit Type</label>
                    <select
                        name="visitType"
                        value={formData.visitType}
                        onChange={onChange}
                        className="w-full p-2 border border-gray-300 rounded"
                    >
                        <option value="General Checkup">General Checkup (₹500)</option>
                        <option value="Follow-up">Follow-up (₹500)</option>
                        <option value="Consultation">Video Consultation (₹1000)</option>
                        <option value="Urgent">Urgent / Emergency (₹1500)</option>
                    </select>
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 mb-2">Notes (Optional)</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={onChange}
                        className="w-full p-2 border border-gray-300 rounded h-24"
                    ></textarea>
                </div>

                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 w-full transition">
                    Confirm Booking
                </button>
            </form >
        </div >
    );
};

export default BookAppointment;
