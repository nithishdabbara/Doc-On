import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LogOut, FileText, CheckCircle, Clock, DollarSign, Phone, MapPin, Calendar, UploadCloud, TestTube, Loader2 } from 'lucide-react';

const LabDashboard = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [labName, setLabName] = useState('');

    // Result Entry Modal
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [results, setResults] = useState([]); // [{ parameter: 'Hb', value: '', unit: '', range: '' }]

    const [activeTab, setActiveTab] = useState('bookings'); // bookings | profile | earnings
    const [profile, setProfile] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [financials, setFinancials] = useState(null);

    // OCR State
    const [ocrLoading, setOcrLoading] = useState(false);
    // File Upload State
    const [uploading, setUploading] = useState(false);
    const [reportFile, setReportFile] = useState(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const token = sessionStorage.getItem('token');
            const formData = new FormData();
            formData.append('report', file);
            formData.append('bookingId', selectedBooking._id);
            await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/labs/assistant/upload-report`, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setReportFile(file);
            // Refresh bookings
            const labId = sessionStorage.getItem('labId');
            const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/labs/assistant/bookings?labId=${labId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setBookings(res.data);
            setSelectedBooking(null);
            setReportFile(null);
        } catch (err) {
            console.error('Upload failed', err);
            alert('Report upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'earnings') {
            const labId = sessionStorage.getItem('labId');
            const token = sessionStorage.getItem('token');
            axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/labs/financials?labId=${labId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => setFinancials(res.data)).catch(console.error);
        }
    }, [activeTab]);



    useEffect(() => {
        const labId = sessionStorage.getItem('labId');
        const name = sessionStorage.getItem('labName');
        const token = sessionStorage.getItem('token');

        if (!token) {
            navigate('/lab/login'); // Fixed route from /lab-login
            return;
        }
        setLabName(name);

        // Fetch Bookings
        axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/labs/assistant/bookings?labId=${labId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => setBookings(res.data))
            .catch(err => {
                console.error("Error fetching bookings:", err);
                if (err.response?.status === 401) navigate('/lab/login');
            });

        // Fetch Profile
        axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/labs/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => setProfile(res.data))
            .catch(console.error);

    }, [navigate]);

    const updateStatus = async (bookingId, newStatus) => {
        try {
            const token = sessionStorage.getItem('token');
            await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/labs/assistant/booking/${bookingId}/status`,
                { status: newStatus },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            // Refresh
            const labId = sessionStorage.getItem('labId');
            const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/labs/assistant/bookings?labId=${labId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setBookings(res.data);
            alert(`Status updated to: ${newStatus.replace('_', ' ')}`);

        } catch (err) {
            console.error("Status Update Failed", err);
            alert("Failed to update status");
        }
    };

    const handleProcess = (booking) => {
        // Initialize dynamic form based on Test names (Simple logic for demo)
        // If CBC -> Hb, RBC. If Lipid -> Cholesterol.
        // We'll just generic fields for now + auto-populate

        const testName = booking.testIds?.[0]?.name || 'General Test';
        let initialResults = [];

        if (testName.includes('Blood')) {
            initialResults = [
                { parameter: 'Hemoglobin', value: '', unit: 'g/dL', range: '13-17' },
                { parameter: 'WBC Count', value: '', unit: '/cumm', range: '4000-11000' },
                { parameter: 'Platelet Count', value: '', unit: '/cumm', range: '1.5-4.5 Lakhs' }
            ];
        } else {
            initialResults = [
                { parameter: 'Test Result', value: '', unit: 'units', range: '0-100' }
            ];
        }

        setResults(initialResults);
        setSelectedBooking(booking);
    };

    const handleResultChange = (index, field, val) => {
        const newRes = [...results];
        newRes[index][field] = val;
        setResults(newRes);
    };

    const submitResults = async () => {
        try {
            const token = sessionStorage.getItem('token'); // Changed from localStorage to sessionStorage
            await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/labs/results`, {
                bookingId: selectedBooking._id,
                results
            }, { headers: { 'Authorization': `Bearer ${token}` } }); // Changed header key

            alert('Report Generated & Sent!');
            setSelectedBooking(null);
            // Refresh
            const labId = sessionStorage.getItem('labId');
            const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/labs/assistant/bookings?labId=${labId}`, { // Updated endpoint
                headers: { 'Authorization': `Bearer ${token}` } // Changed header key
            });
            setBookings(res.data);
        } catch (err) {
            alert('Failed to submit results');
            console.error(err);
        }
    };

    const handleSaveProfile = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const res = await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/labs/profile`, profile, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setProfile(res.data);
            setIsEditing(false);
            alert('Profile Updated Successfully');
        } catch (err) {
            alert('Update Failed');
        }
    };

    // AI OCR Auto-Fill
    const handleAutoFill = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setOcrLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const token = sessionStorage.getItem('token');
            const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/labs/analyze-report`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Expecting structured result from LabAI: { "Hemoglobin": "14", ... }
            const ocrData = res.data;

            // Map OCR data to our existing results structure
            // If the key matches or is close, update value
            const newRes = [...results].map(item => {
                // Simple exact match logic for demo (LabAI should return normalized keys)
                // or we check if key exists in ocrData
                const foundKey = Object.keys(ocrData).find(k => k.toLowerCase().includes(item.parameter.toLowerCase()) || item.parameter.toLowerCase().includes(k.toLowerCase()));

                if (foundKey) {
                    return { ...item, value: ocrData[foundKey] };
                }
                return item;
            });

            setResults(newRes);
            alert("Auto-Filled from Report Image!");

        } catch (err) {
            console.error("OCR Failed", err);
            alert("AI Auto-Fill Failed. Please try manual entry.");
        } finally {
            setOcrLoading(false);
        }
    };

    const handleLogout = () => {
        sessionStorage.clear();
        navigate('/lab/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Lab Assistant Dashboard</h1>
                    <p className="text-teal-600 font-medium">{labName}</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('bookings')}
                        className={`px-4 py-2 rounded-lg font-bold transition ${activeTab === 'bookings' ? 'bg-teal-100 text-teal-700' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        Bookings
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-4 py-2 rounded-lg font-bold transition ${activeTab === 'profile' ? 'bg-teal-100 text-teal-700' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('earnings')}
                        className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 ${activeTab === 'earnings' ? 'bg-teal-100 text-teal-700' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <DollarSign size={18} /> Earnings
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-red-500 hover:text-red-700 font-bold border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition"
                    >
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="bg-white rounded-xl shadow-sm p-8 max-w-4xl mx-auto animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Lab Profile Details</h2>
                        {!isEditing ? (
                            <button onClick={() => setIsEditing(true)} className="bg-teal-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-teal-700">
                                Edit Settings
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button onClick={() => setIsEditing(false)} className="bg-gray-500 text-white px-4 py-2 rounded-lg font-bold">
                                    Cancel
                                </button>
                                <button onClick={handleSaveProfile} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700">
                                    Save Changes
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Read Only Fields */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-xs font-bold text-gray-500 uppercase">Lab ID</label>
                            <p className="font-mono text-gray-800 mt-1">{profile._id}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                            <p className="text-gray-800 mt-1">{profile.email}</p>
                        </div>

                        {/* Editable Fields */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Lab Name</label>
                            <input
                                disabled={!isEditing}
                                value={profile.name || ''}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                className={`w-full border p-2 rounded-lg ${isEditing ? 'bg-white border-teal-500' : 'bg-gray-50 border-gray-200'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Contact Number</label>
                            <input
                                disabled={!isEditing}
                                value={profile.contactNumber || ''}
                                onChange={(e) => setProfile({ ...profile, contactNumber: e.target.value })}
                                className={`w-full border p-2 rounded-lg ${isEditing ? 'bg-white border-teal-500' : 'bg-gray-50 border-gray-200'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Address</label>
                            <input
                                disabled={!isEditing}
                                value={profile.address || ''}
                                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                className={`w-full border p-2 rounded-lg ${isEditing ? 'bg-white border-teal-500' : 'bg-gray-50 border-gray-200'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">City</label>
                            <input
                                disabled={!isEditing}
                                value={profile.city || ''}
                                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                                className={`w-full border p-2 rounded-lg ${isEditing ? 'bg-white border-teal-500' : 'bg-gray-50 border-gray-200'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">District</label>
                            <input
                                disabled={!isEditing}
                                value={profile.district || ''}
                                onChange={(e) => setProfile({ ...profile, district: e.target.value })}
                                className={`w-full border p-2 rounded-lg ${isEditing ? 'bg-white border-teal-500' : 'bg-gray-50 border-gray-200'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">State</label>
                            <input
                                disabled={!isEditing}
                                value={profile.state || ''}
                                onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                                className={`w-full border p-2 rounded-lg ${isEditing ? 'bg-white border-teal-500' : 'bg-gray-50 border-gray-200'}`}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Earnings Tab */}
            {activeTab === 'earnings' && (
                <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-teal-100 flex items-center gap-4">
                            <div className="p-4 bg-teal-50 rounded-full text-teal-600">
                                <DollarSign size={32} />
                            </div>
                            <div>
                                <p className="text-gray-500 font-bold uppercase text-xs">Net Revenue (85%)</p>
                                <h3 className="text-3xl font-bold text-gray-800">₹{financials?.earnings?.toLocaleString() || 0}</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="p-4 bg-purple-50 rounded-full text-purple-600">
                                <CheckCircle size={32} />
                            </div>
                            <div>
                                <p className="text-gray-500 font-bold uppercase text-xs">Completed Tests</p>
                                <h3 className="text-3xl font-bold text-gray-800">{financials?.completedCount || 0}</h3>
                            </div>
                        </div>
                    </div>

                    {/* History */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-4 border-b font-bold text-gray-700 bg-gray-50">Recent Transactions</div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Date</th>
                                        <th className="px-6 py-3 text-left">Patient / Tests</th>
                                        <th className="px-6 py-3 text-right">Net Amount</th>
                                        <th className="px-6 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {financials?.history?.length > 0 ? financials.history.map((tx) => (
                                        <tr key={tx._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-3 text-gray-600">{new Date(tx.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-3">
                                                <div className="font-bold text-gray-800">{tx.patientName}</div>
                                                <div className="text-xs text-gray-500">{tx.testNames}</div>
                                            </td>
                                            <td className="px-6 py-3 text-right font-bold text-teal-600">+₹{tx.amount}</td>
                                            <td className="px-6 py-3 text-center">
                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Settled</span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="text-center py-6 text-gray-400">No earnings record found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
                <div className="space-y-4">
                    {bookings.length === 0 ? (
                        <div className="bg-white p-12 rounded-xl shadow-sm text-center">
                            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="text-gray-400" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">No Bookings Found</h3>
                            <p className="text-gray-500">New appointments will appear here.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                            <div className="grid grid-cols-12 bg-gray-50 p-4 border-b text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <div className="col-span-3">Patient</div>
                                <div className="col-span-4">Collection Info (Privacy Protected)</div>
                                <div className="col-span-2">Tests</div>
                                <div className="col-span-1">Status</div>
                                <div className="col-span-2 text-center">Action</div>
                            </div>
                            {bookings.map(booking => (
                                <div key={booking._id} className={`grid grid-cols-12 p-4 border-b last:border-0 items-center transition ${booking.isCritical ? 'bg-red-50 border-l-4 border-l-red-500' : 'hover:bg-gray-50'}`}>
                                    <div className="col-span-3">
                                        <div className="font-bold text-gray-800 flex items-center gap-2">
                                            {booking.patientName}
                                            {booking.isCritical && (
                                                <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider animate-pulse">
                                                    CRITICAL
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                            <Phone size={12} /> {booking.patientPhone}
                                        </div>
                                    </div>
                                    <div className="col-span-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs px-2 py-0.5 rounded border ${booking.collectionType === 'home' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                                {booking.collectionType === 'home' ? 'Home Collection' : 'Lab Visit'}
                                            </span>
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                <Calendar size={12} /> {new Date(booking.scheduledDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-1">
                                            <MapPin size={14} className="mt-0.5 text-gray-400 shrink-0" />
                                            <span className="truncate block">{booking.address || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="flex flex-wrap gap-1">
                                            {booking.testIds.map(t => (
                                                <span key={t._id} className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-md border border-teal-100">
                                                    {t.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="col-span-1">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            booking.status === 'report_generated' ? 'bg-purple-100 text-purple-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {booking.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="col-span-2 flex justify-center gap-2">
                                        {booking.status !== 'report_generated' ? (
                                            <>
                                                {booking.status === 'scheduled' && (
                                                    <button
                                                        onClick={() => updateStatus(booking._id, 'sample_collected')}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        title="Mark Sample Collected"
                                                    >
                                                        <div className="flex items-center gap-1 font-bold text-xs">
                                                            <TestTube size={16} /> Collect
                                                        </div>
                                                    </button>
                                                )}

                                                {booking.status === 'sample_collected' && (
                                                    <button
                                                        onClick={() => updateStatus(booking._id, 'processing')}
                                                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                                        title="Mark as Processing"
                                                    >
                                                        <div className="flex items-center gap-1 font-bold text-xs">
                                                            <Loader2 size={16} /> Process
                                                        </div>
                                                    </button>
                                                )}

                                                {(booking.status === 'processing' || booking.status === 'sample_collected') && (
                                                    <button
                                                        onClick={() => handleProcess(booking)}
                                                        className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition tooltip-trigger"
                                                        title="Generate & Upload Report"
                                                    >
                                                        <div className="flex items-center gap-1 font-bold text-xs">
                                                            <UploadCloud size={16} /> Report
                                                        </div>
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <a
                                                href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${booking.reportUrl}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                title="View Report"
                                            >
                                                <FileText size={18} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Entry Modal */}
            {selectedBooking && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl animate-fade-in">
                        <h2 className="text-xl font-bold mb-4">Process Report: {selectedBooking.patientName}</h2>

                        {/* Option A: File Upload */}
                        <div className="mb-6 border-b pb-6">
                            <label className="block text-sm font-bold mb-2 text-teal-700">Option A: Upload PDF Report (Recommended)</label>
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                            />
                            {uploading && <p className="text-sm text-blue-500 mt-2 font-medium">Uploading...</p>}
                            {reportFile && <p className="text-sm text-green-600 mt-2 font-bold flex items-center gap-1">✅ PDF Uploaded & Ready</p>}
                        </div>

                        {/* Option B: Manual Entry + AI Automation */}
                        {!reportFile && (
                            <div className="mb-6 opacity-80">
                                <div className="flex justify-between items-end mb-2">
                                    <label className="block text-sm font-bold text-gray-500">Option B: Manual Data Entry</label>

                                    {/* AI OCR Button */}
                                    <label className="cursor-pointer text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-100 flex items-center gap-1 transition-colors">
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleAutoFill}
                                            disabled={ocrLoading}
                                        />
                                        {ocrLoading ? 'Scanning...' : '✨ Auto-Fill with AI (Scan Image)'}
                                    </label>
                                </div>
                                <div className="space-y-3">
                                    {results.map((res, idx) => (
                                        <div key={idx} className="grid grid-cols-4 gap-4 items-center">
                                            <div className="font-medium text-sm text-gray-600">{res.parameter}</div>
                                            <input
                                                className="border p-2 rounded col-span-1"
                                                placeholder="Value"
                                                value={res.value}
                                                onChange={(e) => handleResultChange(idx, 'value', e.target.value)}
                                            />
                                            <div className="text-sm text-gray-500">{res.unit}</div>
                                            <div className="text-xs text-gray-400">Ref: {res.range}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setSelectedBooking(null)} className="px-4 py-2 border rounded font-medium text-gray-600">Cancel</button>
                            <button
                                onClick={submitResults}
                                disabled={!reportFile && !results[0].value}
                                className={`px-6 py-2 rounded font-bold text-white transition ${reportFile || results[0].value ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'
                                    }`}
                            >
                                {reportFile ? 'Link PDF & Finish' : 'Generate & Finish'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabDashboard;

