import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Star, MapPin, Building, Phone, Clock, DollarSign, Award, X, Upload } from 'lucide-react';

const DoctorProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showBookModal, setShowBookModal] = useState(false);

    // Booking State
    const [bookDate, setBookDate] = useState('');
    const [bookTime, setBookTime] = useState('');
    const [reason, setReason] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const fetchDoctor = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/doctors/public`);
                const doc = res.data.find(d => d._id === id);
                setDoctor(doc);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchDoctor();
    }, [id]);

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        const uploadedUrls = [];

        try {
            const token = sessionStorage.getItem('token');
            // Upload each file
            for (let file of files) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('type', 'report'); // Category
                formData.append('title', file.name);

                // We use the record upload endpoint to create a proper medical record
                const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/records/upload`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` }
                });
                // recordRoutes returns { record: { fileUrl: 'filename' } }
                // We construct the full path
                uploadedUrls.push(`/uploads/${res.data.record.fileUrl}`);
            }
            setAttachments([...attachments, ...uploadedUrls]);
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || 'Error uploading files';
            alert('Upload Error: ' + msg);
        } finally {
            setUploading(false);
        }
    };

    const handleBook = async (e) => {
        e.preventDefault();
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user) return alert('Please login to book.');

        // Combine Date & Time
        const appointmentDate = new Date(`${bookDate}T${bookTime}`);

        try {
            await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/patients/book`, {
                doctorId: doctor._id,
                patientId: user.id || user._id, // Handle different ID fields if inconsistent
                patientName: user.name,
                date: appointmentDate,
                reason: reason,
                attachments: attachments
            });
            alert('Appointment Booked Successfully!');
            setShowBookModal(false);
            // Reset Form
            setReason('');
            setAttachments([]);
        } catch (err) {
            alert(err.response?.data?.message || 'Booking Failed');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Profile...</div>;
    if (!doctor) return <div className="p-8 text-center">Doctor not found.</div>;

    return (
        <div className="container py-8 animate-fade">
            <button onClick={() => navigate(-1)} className="text-blue-600 mb-4 hover:underline">← Back</button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Bio Card */}
                <div className="col-span-1">
                    <div className="card text-center sticky top-24">
                        <div className="w-32 h-32 bg-blue-100 rounded-full mx-auto flex items-center justify-center text-4xl mb-4 text-blue-600 font-bold">
                            {doctor.name.charAt(0)}
                        </div>
                        <h1 className="text-2xl font-bold mb-1">Dr. {doctor.name}</h1>
                        <p className="text-blue-600 font-medium mb-4">{doctor.specialization}</p>

                        <div className="flex justify-center gap-4 text-sm text-gray-600 mb-6">
                            <div className="flex flex-col items-center">
                                <span className="font-bold text-black">{doctor.experience || '5+'} Years</span>
                                <span>Experience</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="font-bold text-black flex items-center gap-1">
                                    {doctor.averageRating ? doctor.averageRating.toFixed(1) : 'New'} <Star size={12} fill="currentColor" className="text-yellow-500" />
                                </span>
                                <span>Rating</span>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded mb-4">
                            <p className="text-sm text-gray mb-1">Consultation Fee</p>
                            <p className="text-xl font-bold text-green-600">₹{doctor.consultationFee}</p>
                        </div>

                        <button
                            onClick={() => setShowBookModal(true)}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-200 transition-all"
                        >
                            Book Appointment
                        </button>
                    </div>
                </div>

                {/* Right Column: Details */}
                <div className="col-span-2 space-y-6">
                    {/* About */}
                    <div className="card">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Award className="text-blue-500" /> About Doctor
                        </h2>
                        <p className="text-gray-700 leading-relaxed">
                            Dr. {doctor.name} is a highly skilled {doctor.specialization} with over {doctor.experience || '5'} years of experience.
                            Dedicated to providing top-quality patient care and specialized treatments.
                            Registered with {doctor.medicalCouncil} (License: {doctor.licenseNumber}).
                        </p>
                    </div>

                    {/* Clinic Info */}
                    <div className="card">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Building className="text-blue-500" /> Clinic & Hospital Details
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <MapPin className="text-gray-400 mt-1" />
                                <div>
                                    <h3 className="font-bold text-gray-900">Clinic Address</h3>
                                    <p className="text-gray-600">{doctor.address}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="text-gray-400 mt-1" />
                                <div>
                                    <h3 className="font-bold text-gray-900">Contact</h3>
                                    <p className="text-gray-600">{doctor.phone}</p>
                                    <p className="text-gray-600">{doctor.email}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Clock className="text-gray-400 mt-1" />
                                <div>
                                    <h3 className="font-bold text-gray-900">Availability</h3>
                                    <p className="text-gray-600">Mon - Sat: 10:00 AM - 07:00 PM</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reviews Snippet */}
                    <div className="card">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Star className="text-yellow-500" /> Patient Feedback
                        </h2>
                        <div className="text-center py-6 bg-gray-50 rounded border border-dashed border-gray-300">
                            <p className="font-bold text-3xl mb-1">{doctor.averageRating ? doctor.averageRating.toFixed(1) : '0'}</p>
                            <div className="flex justify-center mb-2">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <Star key={i} size={20} className={i <= (doctor.averageRating || 0) ? "text-yellow-500" : "text-gray-300"} fill="currentColor" />
                                ))}
                            </div>
                            <p className="text-gray-500 text-sm">Based on {doctor.totalRatings || 0} reviews</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Modal */}
            {showBookModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl modal-content">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold">Book Dr. {doctor.name}</h3>
                            <button onClick={() => setShowBookModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleBook} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="input-field"
                                        value={bookDate}
                                        onChange={(e) => setBookDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Time</label>
                                    <select
                                        required
                                        className="input-field"
                                        value={bookTime}
                                        onChange={(e) => setBookTime(e.target.value)}
                                    >
                                        <option value="">Select Time</option>
                                        <option value="10:00">10:00 AM</option>
                                        <option value="11:00">11:00 AM</option>
                                        <option value="12:00">12:00 PM</option>
                                        <option value="14:00">02:00 PM</option>
                                        <option value="15:00">03:00 PM</option>
                                        <option value="16:00">04:00 PM</option>
                                        <option value="17:00">05:00 PM</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1">Reason for Visit <span className="text-red-500">*</span></label>
                                <textarea
                                    required
                                    className="input-field"
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
                                                ✓ File {idx + 1} Uploaded
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {uploading && <p className="text-xs text-blue-500 mt-1 animate-pulse">Uploading...</p>}
                            </div>

                            <div className="pt-2">
                                <button type="submit" disabled={uploading} className="w-full btn btn-primary py-3 text-lg shadow-lg">
                                    Confirm Booking
                                </button>
                                <p className="text-xs text-center text-gray-400 mt-3">
                                    By booking, you agree to share the above information with Dr. {doctor.name}.
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorProfile;

