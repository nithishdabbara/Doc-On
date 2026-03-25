import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Mail, Phone, MapPin, Award, FileText, Star, Calendar, Clock, User, ShieldCheck, ShieldAlert } from 'lucide-react';

const AdminDoctorDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch basic doctor details & verified status
                const token = sessionStorage.getItem('adminToken');
                const docRes = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/doctor-activity/${id}`, {
                    headers: { authorization: token }
                });
                setActivity(docRes.data);

                // We might need a separate endpoint for full static registration details if not included in activity
                // For now, let's assume the activity endpoint populates enough or we extend it.
                // Actually, let's fetch the full doctor object separately if needed, but let's check what doctor-activity returns.
                // It returns { stats, history }. It DOES NOT currently return the full doctor profile object (name, email etc).
                // I need to fetch the doctor's static profile too.

                // Let's rely on the dashboard passing data OR fetch it.
                // Better: Fetch it. Let's assume we can fetch basic doc info.
                // Since I don't have a specific "get doctor by id" for admin, I'll rely on what I have or create one.
                // Wait, I can probably use the doctor-activity endpoint to also return the doctor details.
                // I will update the backend to include `doctorDetails` in the response of `/doctor-activity/:id`.
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    // Temporary: Since I haven't updated the backend yet to return "doctorDetails" in the activity route,
    // I will do that in the next step.

    if (loading) return <div className="p-10 text-center">Loading Doctor Profile...</div>;
    if (!activity) return <div className="p-10 text-center text-red-500">Doctor not found.</div>;

    const { doctorDetails, stats, history } = activity;

    return (
        <div className="container animate-fade" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
            <button onClick={() => navigate('/admin/dashboard')} className="btn btn-secondary mb-6 text-sm">
                <ArrowLeft size={16} /> Back to Dashboard
            </button>

            <div className="grid grid-cols-2 gap-8">
                {/* Left Column: Registration Details (Static) */}
                <div className="card h-fit">
                    <div className="flex items-center gap-4 mb-6 border-b pb-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl">
                            {doctorDetails?.name?.charAt(0) || 'D'}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{doctorDetails?.name}</h1>
                            <p className="text-gray">{doctorDetails?.specialization}</p>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold mt-2 ${doctorDetails?.verificationStatus === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {doctorDetails?.verificationStatus === 'approved' ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                                {doctorDetails?.verificationStatus?.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <FileText size={18} className="text-blue-500" /> Registration Data
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <Award className="text-gray-400 mt-1" size={18} />
                            <div>
                                <p className="text-xs text-uppercase text-gray font-bold">License Number</p>
                                <p className="font-mono bg-gray-50 px-2 py-1 rounded border inline-block">{doctorDetails?.licenseNumber}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Mail className="text-gray-400 mt-1" size={18} />
                            <div>
                                <p className="text-xs text-uppercase text-gray font-bold">Email Address</p>
                                <p>{doctorDetails?.email}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Phone className="text-gray-400 mt-1" size={18} />
                            <div>
                                <p className="text-xs text-uppercase text-gray font-bold">Phone Number</p>
                                <p>{doctorDetails?.phone || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <MapPin className="text-gray-400 mt-1" size={18} />
                            <div>
                                <p className="text-xs text-uppercase text-gray font-bold">Address / Clinic</p>
                                <p>{doctorDetails?.address || 'Not Provided'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Award className="text-gray-400 mt-1" size={18} />
                            <div>
                                <p className="text-xs text-uppercase text-gray font-bold">Experience</p>
                                <p>{doctorDetails?.experience?.toString().toLowerCase().includes('year') ? doctorDetails?.experience : `${doctorDetails?.experience} Years`}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="text-gray-400 mt-1 font-bold">₹</div>
                            <div>
                                <p className="text-xs text-uppercase text-gray font-bold">Consultation Fee</p>
                                <p className="font-bold text-green-700">₹{doctorDetails?.consultationFee || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Platform Activity (Dynamic) */}
                <div className="space-y-6">
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="card bg-blue-50 border-blue-100 p-4 text-center">
                            <h3 className="text-blue-800 text-sm font-bold uppercase mb-1">Total Patients Treated</h3>
                            <p className="text-4xl font-bold text-blue-600">{stats?.totalTreated || 0}</p>
                        </div>
                        <div className="card bg-green-50 border-green-100 p-4 text-center">
                            <h3 className="text-green-800 text-sm font-bold uppercase mb-1">Average Rating</h3>
                            <div className="flex items-center justify-center gap-2">
                                <p className="text-4xl font-bold text-green-600">{stats?.averageRating || 0}</p>
                                <Star className="text-yellow-500 fill-yellow-500" size={24} />
                            </div>
                            <p className="text-xs text-green-700 mt-1">{stats?.totalRatings || 0} Reviews</p>
                        </div>
                    </div>

                    {/* History Feed */}
                    <div className="card">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <User size={18} className="text-purple-500" /> Recent Consultations
                        </h3>

                        {history && history.length > 0 ? (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                {history.map((item, idx) => (
                                    <div key={idx} className="border-b pb-3 last:border-0 last:pb-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-gray-800">{item.patientName || 'Unknown Patient'}</span>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                {new Date(item.date).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm mb-2">
                                            <span className={`px-2 py-0.5 rounded text-xs ${item.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {item.status}
                                            </span>
                                            {item.rating && (
                                                <span className="flex items-center text-yellow-600 text-xs font-bold">
                                                    <Star size={12} className="fill-yellow-600 mr-1" /> {item.rating}
                                                </span>
                                            )}
                                        </div>

                                        {item.review && (
                                            <div className="bg-gray-50 p-2 rounded text-sm italic text-gray-600 border-l-4 border-gray-300">
                                                "{item.review}"
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center py-8">No consultations recorded yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDoctorDetails;

