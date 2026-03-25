import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { FileText, X, Clock, Calendar, CheckCircle, AlertCircle, User, Phone, MapPin, Activity, Shield, Stethoscope, Video, Download, Sparkles, DollarSign } from 'lucide-react';
import ChatComponent from '../components/ChatComponent';
import DoctorDashboardOverview from '../components/DoctorDashboardOverview';
const DoctorDashboard = () => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, today, upcoming, history, profile
    const [treating, setTreating] = useState(null);
    const [notes, setNotes] = useState('');
    const [prescriptionFile, setPrescriptionFile] = useState([]);

    // Profile State
    const [user, setUser] = useState(JSON.parse(sessionStorage.getItem('user') || '{}'));
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({});

    // UI Action State (Control Full Screen Overlays)
    const [actionStatus, setActionStatus] = useState('idle'); // idle, preparing, completing, success_completed

    // Patient Modal State
    const [selectedPatient, setSelectedPatient] = useState(null); // The basic p object
    const [patientDetails, setPatientDetails] = useState(null); // { profile, records }
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Prescription State
    const [medications, setMedications] = useState([]);
    const [newMed, setNewMed] = useState({ name: '', dosage: '', frequency: '', duration: '' });

    const addMedication = () => {
        if (!newMed.name) return alert('Medicine Name is required');
        setMedications([...medications, { ...newMed }]);
        setNewMed({ name: '', dosage: '', frequency: '', duration: '' }); // Reset
    };

    const removeMedication = (index) => {
        setMedications(medications.filter((_, i) => i !== index));
    };

    // AI Assistant State
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState(null);
    const [financials, setFinancials] = useState(null);

    useEffect(() => {
        if (activeTab === 'financials') {
            fetchFinancials();
        }
    }, [activeTab]);

    const fetchFinancials = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/doctors/financials`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setFinancials(res.data);
        } catch (err) {
            console.error("Financials Fetch Error", err);
        }
    };

    const handleLogout = () => {
        sessionStorage.clear();
        navigate('/login');
    };

    const handleCheckInteractions = async () => {
        if (!notes) return alert("Please enter prescription notes first.");

        // Extract generic drug names using simple regex (assuming comma or newline separated for now)
        // Matches typical words: Aspirin, Warfarin, etc.
        const drugsRef = notes.match(/[a-zA-Z]+/g) || [];
        const uniqueDrugs = [...new Set(drugsRef)];

        if (uniqueDrugs.length < 2) return alert("Need at least 2 drugs to check interactions.");

        try {
            const token = sessionStorage.getItem('token');
            const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/doctors/check-interactions`,
                { drugs: uniqueDrugs },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setSafetyAlerts(res.data);
        } catch (err) {
            console.error(err);
            alert("Safety Check Failed");
        }
    };

    const notifiedIds = useRef(new Set());

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchProfile = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/doctors/me`, { headers: { 'Authorization': `Bearer ${token}` } });
                setUser(res.data);
                setProfileForm(res.data);
                sessionStorage.setItem('user', JSON.stringify({ ...res.data, type: 'doctor' }));
            } catch (e) { console.error('Failed to fetch profile', e); }
        };
        fetchProfile();

        // Request Notification Permission
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        fetchAppointments();

        // Poll for updates every 30s
        const interval = setInterval(() => {
            fetchAppointments(true);
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const fetchAppointments = async (isPolling = false) => {
        try {
            const token = sessionStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/doctors/appointments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const freshData = res.data;
            setAppointments(freshData);

            // Handle Notifications
            if (isPolling && Notification.permission === 'granted') {
                freshData.forEach(appt => {
                    // If arrived and NOT notified yet
                    if (appt.status === 'arrived' && !notifiedIds.current.has(appt._id)) {
                        new Notification("Patient Arrived", {
                            body: `${appt.patientName} is waiting for consultation.`,
                            icon: '/vite.svg' // Placeholder icon
                        });
                        notifiedIds.current.add(appt._id);
                    }
                });
            }
        } catch (err) {
            console.error("Error fetching appointments", err);
        }
    };

    const fetchPatientData = async (patientId) => {
        setLoadingDetails(true);
        try {
            const token = sessionStorage.getItem('token');
            if (!patientId) return;

            // 1. Fetch Records (Fixed URL)
            const resHistory = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/records/${patientId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // 2. Fetch Profile
            const resProfile = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/doctors/patient-profile/${patientId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setPatientDetails({
                records: resHistory.data,
                profile: resProfile.data
            });
        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 403) {
                alert('Access Denied: You can only view details for patients with an SCHEDULED appointment.');
            } else {
                alert('Could not fetch patient details.');
            }
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleViewPatient = (patient) => {
        if (!patient.patientId) return alert("This invalid appointment record has no patient data.");

        setSelectedPatient(patient);
        setPatientDetails(null); // Reset prev details
        
        // Mongoose populates patientId into an object. Extract the actual ID string.
        const idString = typeof patient.patientId === 'object' ? patient.patientId._id : patient.patientId;
        fetchPatientData(idString);
    };

    const handleCompleteTreatment = async () => {
        if (!treating || !notes) return alert('Please enter prescription notes.');
        setUploading(true);
        setActionStatus('completing'); // Show completion spinner

        try {
            const token = sessionStorage.getItem('token');
            const uploadedUrls = [];

            // 1. Upload Files
            if (prescriptionFile && prescriptionFile.length > 0) {
                for (let file of prescriptionFile) {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('type', 'prescription');
                    formData.append('title', `Doc Upload - ${new Date().toLocaleDateString()}`);
                    formData.append('patientId', treating.patientId);

                    const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/records/upload`, formData, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                    uploadedUrls.push(`/uploads/${res.data.record.fileUrl}`);
                }
            }

            // 2. Complete Appointment
            await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/doctors/appointments/${treating._id}/complete`,
                {
                    treatmentNotes: notes,
                    attachments: uploadedUrls
                },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            // Show Success Screen
            setActionStatus('success_completed');

            // Redirect/Reset after 2.5s
            setTimeout(() => {
                setTreating(null);
                setNotes('');
                setPrescriptionFile([]);
                setActionStatus('idle');
                setUploading(false);
                fetchAppointments(); // Refresh list to show as completed
            }, 2500);

        } catch (err) {
            console.error(err);
            alert('Error completing treatment. Ensure Patient ID is valid.');
            setUploading(false);
            setActionStatus('idle');
        }
    };

    const handleStatusUpdate = async (id, status) => {
        // Confirmation mostly needed for 'no_show', but 'arrived' can be instant or confirmed
        if (status === 'no_show' && !window.confirm(`Mark appointment as ${status}?`)) return;

        if (status === 'arrived') {
            setActionStatus('preparing'); // Show "Preparing Room" animation
        }

        try {
            const token = sessionStorage.getItem('token');

            // Artificial Delay if 'arrived' to show animation (2s)
            if (status === 'arrived') {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/doctors/appointments/${id}/status`,
                { status },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            fetchAppointments();
        } catch (err) {
            console.error(err);
            alert('Error updating status');
        } finally {
            setActionStatus('idle');
        }
    };

    const generatePrescription = async () => {
        if (!treating) return;

        // Use Backend PrescriptionAI (PDFKit)
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/doctors/generate-prescription`, {
                doctor: {
                    name: JSON.parse(sessionStorage.getItem('user')).name,
                    specialization: JSON.parse(sessionStorage.getItem('user')).specialization || 'General',
                    regNumber: JSON.parse(sessionStorage.getItem('user')).licenseNumber || 'Not Provided'
                },
                patient: {
                    name: treating.patientName,
                    age: treating.patientId?.dob ? (new Date().getFullYear() - new Date(treating.patientId.dob).getFullYear()).toString() : 'Not Provided',
                    gender: treating.patientId?.gender || 'Not Provided'
                },
                medications: medications.length > 0 ? medications : [],
                diagnosis: notes // Use notes as diagnosis/instructions
            }, {
                responseType: 'blob', // Important for PDF
                headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
            });

            // Create Blob Link to Download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Prescription_${treating.patientName}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

        } catch (err) {
            console.error("PDF Gen Failed", err);
            alert("Failed to generate PDF");
        }
    };

    // Tab Logic
    const getFilteredAppointments = () => {
        const todayStr = new Date().toDateString();

        return appointments.filter(appt => {
            const apptDateStr = new Date(appt.date).toDateString();
            const isActive = ['arrived', 'in_progress'].includes(appt.status);

            if (activeTab === 'today') {
                return (apptDateStr === todayStr && appt.status !== 'completed' && appt.status !== 'cancelled') || isActive;
            }
            if (activeTab === 'upcoming') {
                return new Date(appt.date) > new Date() && apptDateStr !== todayStr && appt.status === 'scheduled' && !isActive;
            }
            if (activeTab === 'history') {
                return ['completed', 'cancelled', 'no_show'].includes(appt.status);
            }
            return false;
        });
    };

    const filteredAppts = getFilteredAppointments();

    return (
        <div className="container animate-fade" style={{ paddingTop: '2rem' }}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Doctor Dashboard</h1>
                {treating && (
                    <button onClick={() => setTreating(null)} className="btn btn-secondary text-sm">
                        Exit Consultation
                    </button>
                )}
            </div>

            {/* If Treating, Show Treatment Area ONLY */}
            {treating ? (
                <div className="card border-2 border-blue-500 shadow-xl overflow-hidden animate-fade-in">
                    <div className="flex justify-between items-center mb-6 bg-blue-50 -m-6 p-6 border-b border-blue-100">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Treating: <span className="text-blue-600">{treating.patientName}</span></h2>
                            <p className="text-sm text-gray-500">Started at {new Date().toLocaleTimeString()}</p>
                        </div>
                        <button
                            onClick={() => handleViewPatient(treating)}
                            className="px-3 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 flex items-center gap-1 shadow-sm"
                        >
                            <User size={16} /> View Patient Profile
                        </button>
                    </div>

                    {/* Patient's Purpose & Files */}
                    <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                        <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                            <span className="bg-yellow-200 p-1 rounded">Reason for Visit</span>
                        </h4>
                        <p className="text-gray-800 mb-3 ml-1">{treating.reasonForVisit || 'No reason provided by patient.'}</p>

                        {treating.patientAttachments && treating.patientAttachments.length > 0 && (
                            <div className="border-t border-yellow-200 pt-3">
                                <span className="text-xs font-bold text-yellow-700 uppercase mb-2 block">Patient Uploads</span>
                                <div className="flex flex-wrap gap-2">
                                    {treating.patientAttachments.map((url, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <a href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${url}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1.5 bg-white border border-yellow-200 rounded text-xs font-medium text-yellow-700 hover:shadow-sm">
                                                <FileText size={14} /> View File {idx + 1}
                                            </a>
                                            {/* AI Analyze Button for Existing File - Mocked for now as we need actual file content or path on server handling */}
                                            {/* For this phase, we'll focus on the dedicated upload for AI to ensure file buffer is available */}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* AI Clinical Assistant Panel */}
                    <div className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-200 animate-fade-in">
                        <h4 className="font-bold text-indigo-800 mb-2 flex items-center gap-2">
                            AI Clinical Assistant
                        </h4>

                        <div className="flex gap-4 items-start">
                            {/* AI Input Area */}
                            <div className="flex-1">
                                <p className="text-xs text-indigo-600 mb-3">Upload a report (Blood Work, X-Ray) to get a clinical analysis and prescription suggestions.</p>
                                <div className="flex gap-2">
                                    <label className="cursor-pointer bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-100 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*,.pdf"
                                            onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (!file) return;

                                                setAiLoading(true);
                                                setAiResponse(null);

                                                try {
                                                    const formData = new FormData();
                                                    formData.append('file', file);
                                                    formData.append('role', 'doctor'); // Clinical Mode

                                                    // Updated Endpoint: Orchestrated AI
                                                    const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/doctors/analyze-document`, formData, {
                                                        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
                                                    });

                                                    setAiResponse(res.data);
                                                } catch (err) {
                                                    alert("AI Analysis Failed: " + (err.response?.data?.message || err.message));
                                                } finally {
                                                    setAiLoading(false);
                                                }
                                            }}
                                        />
                                        <Stethoscope size={16} /> Analyze Report
                                    </label>
                                </div>
                            </div>

                            {/* AI Output Area */}
                            <div className="flex-[2] bg-white rounded-lg border border-indigo-100 p-4 min-h-[100px]">
                                {aiLoading ? (
                                    <div className="flex items-center justify-center h-full text-indigo-400 gap-2">
                                        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                        Analyzing...
                                    </div>
                                ) : aiResponse ? (
                                    <div>
                                        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap mb-3">
                                            {aiResponse.message}
                                        </div>

                                        {aiResponse.suggestions && aiResponse.suggestions.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <span className="text-xs font-bold text-gray-500 uppercase block mb-2">Suggestions</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {aiResponse.suggestions.map((rtx, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => setNotes(prev => prev + (prev ? '\n' : '') + rtx)}
                                                            className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded border border-indigo-200 transition-colors flex items-center gap-1"
                                                        >
                                                            + Add {rtx.split(' - ')[0]}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-400 text-sm py-4">
                                        AI findings will appear here.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Chat Section */}
                        <div className="lg:col-span-1 h-[400px]">
                            <ChatComponent
                                roomId={treating._id}
                                senderId={JSON.parse(sessionStorage.getItem('user')).id || JSON.parse(sessionStorage.getItem('user'))._id}
                                senderRole="doctor"
                                receiverId={treating.patientId}
                                receiverRole="patient"
                            />
                        </div>

                        {/* Notes Section */}
                        <div className="lg:col-span-2">
                            {/* Medicine List Builder */}
                            <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <FileText size={16} /> Prescription Calculator
                                </label>

                                <div className="grid grid-cols-12 gap-2 mb-3">
                                    <div className="col-span-4">
                                        <input
                                            placeholder="Medicine (e.g. Dolo)"
                                            className="w-full text-sm p-2 border rounded"
                                            value={newMed.name}
                                            onChange={e => setNewMed({ ...newMed, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <input
                                            placeholder="Dose (500mg)"
                                            className="w-full text-sm p-2 border rounded"
                                            value={newMed.dosage}
                                            onChange={e => setNewMed({ ...newMed, dosage: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <input
                                            placeholder="Freq (1-0-1)"
                                            className="w-full text-sm p-2 border rounded"
                                            value={newMed.frequency}
                                            onChange={e => setNewMed({ ...newMed, frequency: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <button onClick={addMedication} className="w-full h-full bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700">
                                            Add
                                        </button>
                                    </div>
                                </div>

                                {medications.length > 0 && (
                                    <div className="space-y-2 mb-2">
                                        {medications.map((med, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-white p-2 border rounded text-xs">
                                                <div className="font-medium text-gray-800">
                                                    {idx + 1}. {med.name} <span className="text-gray-500">({med.dosage} | {med.frequency})</span>
                                                </div>
                                                <button onClick={() => removeMedication(idx)} className="text-red-500 hover:text-red-700"><X size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-bold text-gray-700">Prescription & Clinical Notes</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCheckInteractions}
                                        className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded flex items-center gap-1 hover:bg-red-100"
                                    >
                                        <AlertCircle size={12} /> Check Safety
                                    </button>
                                    <button
                                        onClick={generatePrescription}
                                        className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded flex items-center gap-1 hover:bg-green-100"
                                    >
                                        <Download size={12} /> Download PDF
                                    </button>
                                </div>
                            </div>
                            <textarea
                                className="input-field font-medium text-gray-700 resize-y min-h-[360px]"
                                placeholder="Enter diagnosis, prescription (e.g., Aspirin, Warfarin), or clinical notes..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            ></textarea>

                            {/* Safety Alert Box */}
                            {safetyAlerts && (
                                <div className={`mt-3 p-3 rounded-lg border ${safetyAlerts.safe ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'} animate-fade-in`}>
                                    <div className="flex items-start gap-2">
                                        {safetyAlerts.safe ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                        <div>
                                            <p className="font-bold text-sm">{safetyAlerts.message}</p>
                                            {!safetyAlerts.safe && (
                                                <ul className="list-disc ml-5 text-xs mt-1">
                                                    {safetyAlerts.interactions.map((i, idx) => (
                                                        <li key={idx}>
                                                            <span className="font-bold uppercase">{i.severity}</span>: {i.drug1} + {i.drug2} — {i.risk}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Attach Official Documents (Visible to Patient)</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-all cursor-pointer">
                            <input
                                type="file"
                                id="doc-upload"
                                multiple
                                className="hidden"
                                onChange={(e) => setPrescriptionFile([...e.target.files])}
                            />
                            <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                                    <FileText size={24} />
                                </div>
                                <span className="text-sm font-medium text-gray-600">
                                    {prescriptionFile && prescriptionFile.length > 0 ? (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-green-600 font-bold">{prescriptionFile.length} file(s) selected</span>
                                            <span className="text-xs text-gray-400">{Array.from(prescriptionFile).map(f => f.name).join(', ')}</span>
                                        </div>
                                    ) : "Click to upload X-Rays, Reports, or Lab Results (Multiple Allowed)"}
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                        <button onClick={() => setTreating(null)} className="btn btn-secondary px-6">Cancel</button>
                        <button className="btn btn-primary px-8 shadow-lg shadow-blue-200" onClick={handleCompleteTreatment}>
                            {uploading ? 'Uploading...' : 'Complete Treatment'}
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Tabs */}
                    <div className="flex gap-4 border-b mb-6 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`pb-3 px-4 font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'dashboard' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            <Activity size={16} /> Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('today')}
                            className={`pb-3 px-4 font-bold border-b-2 transition-colors ${activeTab === 'today' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Today's Appointments
                        </button>
                        <button
                            onClick={() => setActiveTab('upcoming')}
                            className={`pb-3 px-4 font-bold border-b-2 transition-colors ${activeTab === 'upcoming' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Upcoming
                        </button>
                        <button
                            onClick={() => setActiveTab('ai_assistant')}
                            className={`pb-3 px-4 font-bold border-b-2 transition-colors ${activeTab === 'ai_assistant' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'} flex items-center gap-2`}
                        >
                            <Sparkles size={16} /> AI Assistant
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`pb-3 px-4 font-bold border-b-2 transition-colors ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            History & Past
                        </button>
                        <button
                            onClick={() => setActiveTab('financials')}
                            className={`pb-3 px-4 font-bold border-b-2 transition-colors ${activeTab === 'financials' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'} flex items-center gap-2`}
                        >
                            <DollarSign size={16} /> Earnings
                        </button>
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`pb-3 px-4 font-bold border-b-2 transition-colors ${activeTab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'} flex items-center gap-2`}
                        >
                            <User size={16} /> Profile
                        </button>
                    </div>

                    {activeTab === 'profile' ? (
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 animate-fade-in relative max-w-3xl">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b">
                                <h3 className="text-xl font-bold text-gray-800">Doctor Profile Settings</h3>
                                <div className="flex gap-4">
                                    {!isEditingProfile ? (
                                        <>
                                            <button onClick={() => setIsEditingProfile(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2">
                                                Edit Profile
                                            </button>
                                            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2">
                                                Logout
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => { setIsEditingProfile(false); setProfileForm(user); }} className="text-gray-500 hover:text-gray-700 font-medium px-4 py-2">
                                                Cancel
                                            </button>
                                            <button onClick={async () => {
                                                try {
                                                    const res = await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/doctors/me`, profileForm, { headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` } });
                                                    setUser(res.data);
                                                    sessionStorage.setItem('user', JSON.stringify({ ...res.data, type: 'doctor' }));
                                                    setIsEditingProfile(false);
                                                } catch(err) { alert('Failed to save profile'); }
                                            }} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition">
                                                Save Changes
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold mb-1 block">Full Name</label>
                                    {isEditingProfile ? <input type="text" value={profileForm.name || ''} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full border rounded p-2" /> : <div className="text-gray-800 font-medium">{user.name}</div>}
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold mb-1 block">Specialization</label>
                                    {isEditingProfile ? <input type="text" value={user.specialization || ''} readOnly disabled className="w-full border rounded p-2 bg-gray-100 text-gray-500 cursor-not-allowed" title="Specialization cannot be changed after registration" /> : <div className="text-gray-800 font-medium">{user.specialization || 'Not Provided'}</div>}
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold mb-1 block">License Number</label>
                                    {isEditingProfile ? <input type="text" value={user.licenseNumber || ''} readOnly disabled className="w-full border rounded p-2 bg-gray-100 text-gray-500 cursor-not-allowed" title="License numbers cannot be changed after verification" /> : <div className="text-gray-800 font-medium">{user.licenseNumber || 'Not Provided'}</div>}
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold mb-1 block">Consultation Fee (₹)</label>
                                    {isEditingProfile ? <input type="number" value={profileForm.consultationFee || ''} onChange={e => setProfileForm({...profileForm, consultationFee: e.target.value})} className="w-full border rounded p-2" /> : <div className="text-gray-800 font-medium">₹{user.consultationFee || 500}</div>}
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold mb-1 block">Experience</label>
                                    {isEditingProfile ? <input type="text" value={profileForm.experience || ''} onChange={e => setProfileForm({...profileForm, experience: e.target.value})} className="w-full border rounded p-2" /> : <div className="text-gray-800 font-medium">{user.experience || 'Not Provided'}</div>}
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold mb-1 block">Phone Number</label>
                                    {isEditingProfile ? <input type="text" value={profileForm.phone || ''} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="w-full border rounded p-2" /> : <div className="text-gray-800 font-medium">{user.phone || 'Not Provided'}</div>}
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold mb-1 block">Availability (e.g. 9:00 AM - 5:00 PM)</label>
                                    {isEditingProfile ? <input type="text" value={profileForm.availability || ''} onChange={e => setProfileForm({...profileForm, availability: e.target.value})} className="w-full border rounded p-2" /> : <div className="text-gray-800 font-medium">{user.availability || 'Not Provided'}</div>}
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold mb-1 block">Clinic Address</label>
                                    {isEditingProfile ? <textarea value={profileForm.address || ''} onChange={e => setProfileForm({...profileForm, address: e.target.value})} className="w-full border rounded p-2" rows={2} /> : <div className="text-gray-800 font-medium">{user.address || 'Not Provided'}</div>}
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'financials' ? (
                        <div className="space-y-6 animate-fade-in">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-green-200 rounded-full text-green-700">
                                            <DollarSign size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-green-800 uppercase">Net Earnings</p>
                                            <h3 className="text-3xl font-bold text-gray-800">₹{financials?.earnings?.toLocaleString() || 0}</h3>
                                            <p className="text-xs text-green-700 mt-1">Platform fees (15%) deducted</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                                            <CheckCircle size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-500 uppercase">Settled Consultations</p>
                                            <h3 className="text-3xl font-bold text-gray-800">{financials?.completedCount || 0}</h3>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* History Table */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b bg-gray-50 font-bold text-gray-700">
                                    Recent Transactions
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-500">
                                            <tr>
                                                <th className="px-6 py-3 text-left">Date</th>
                                                <th className="px-6 py-3 text-left">Patient</th>
                                                <th className="px-6 py-3 text-right">Net Amount</th>
                                                <th className="px-6 py-3 text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {financials?.history?.length > 0 ? financials.history.map((tx) => (
                                                <tr key={tx._id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-3 text-gray-600">{new Date(tx.date).toLocaleDateString()}</td>
                                                    <td className="px-6 py-3 font-medium text-gray-800">{tx.patientName}</td>
                                                    <td className="px-6 py-3 text-right font-bold text-green-600">+₹{tx.amount}</td>
                                                    <td className="px-6 py-3 text-center">
                                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Settled</span>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="4" className="text-center py-6 text-gray-400">No recent transactions found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {activeTab === 'ai_assistant' ? (
                        <div className="card p-6 bg-white border border-indigo-100 rounded-xl shadow-sm animate-fade-in">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                                    <Sparkles className="text-indigo-600" /> AI Clinical Assistant
                                </h3>
                                <div className="text-sm text-gray-500">
                                    Upload X-Rays, MRIs, or Lab Reports for instant second opinions.
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left: Upload & Context */}
                                <div className="space-y-6">
                                    <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 text-center">
                                        <Activity className="mx-auto text-indigo-400 mb-3" size={48} />
                                        <h4 className="font-bold text-indigo-700 mb-2">Upload Medical Document</h4>
                                        <p className="text-sm text-indigo-600 mb-6">
                                            Supported formats: PNG, JPG, JPEG, PDF.
                                            <br />
                                            Analysis includes diagnosis suggestions and key findings.
                                        </p>

                                        <label className="btn btn-primary bg-indigo-600 border-indigo-600 hover:bg-indigo-700 w-full flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-200">
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*,.pdf"
                                                onChange={async (e) => {
                                                    const file = e.target.files[0];
                                                    if (!file) return;

                                                    setAiLoading(true);
                                                    setAiResponse(null);

                                                    try {
                                                        const formData = new FormData();
                                                        formData.append('file', file);
                                                        formData.append('role', 'doctor');

                                                        const res = await axios.post('/api/doctors/analyze-document', formData, {
                                                            headers: {
                                                                'Content-Type': 'multipart/form-data',
                                                                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                                                            }
                                                        });
                                                        setAiResponse(res.data);
                                                    } catch (err) {
                                                        alert("AI Analysis Failed: " + (err.response?.data?.message || err.message));
                                                    } finally {
                                                        setAiLoading(false);
                                                    }
                                                }}
                                            />
                                            {aiLoading ? 'Analyzing...' : <><FileText size={18} /> Select File to Analyze</>}
                                        </label>
                                    </div>

                                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Private Scratchpad</label>
                                        <textarea
                                            className="w-full h-32 p-3 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Jot down notes or paste AI suggestions here..."
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                        ></textarea>
                                    </div>
                                </div>

                                {/* Right: Results */}
                                <div className="bg-gray-50 rounded-xl border p-6 min-h-[400px] flex flex-col">
                                    <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">Analysis Results</h4>

                                    {aiLoading ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                                            <p>Processing image with DoctorAI...</p>
                                        </div>
                                    ) : aiResponse ? (
                                        <div className="space-y-4 animate-fade-in">
                                            <div className="prose prose-indigo max-w-none text-gray-800 bg-white p-4 rounded-lg border shadow-sm">
                                                {aiResponse.message}
                                            </div>

                                            {aiResponse.suggestions && aiResponse.suggestions.length > 0 && (
                                                <div>
                                                    <span className="text-xs font-bold text-gray-500 uppercase block mb-2">Clinical Suggestions</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {aiResponse.suggestions.map((s, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => setNotes(prev => prev + (prev ? '\n' : '') + s)}
                                                                className="text-xs bg-white border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm"
                                                            >
                                                                + {s}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 opacity-50">
                                            <Stethoscope size={64} className="mb-4" />
                                            <p>Upload a file to see AI insights.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'dashboard' ? (
                        <div className="w-full">
                            <DoctorDashboardOverview user={user} appointments={appointments} navigate={navigate} setActiveTab={setActiveTab} />
                        </div>
                    ) : (
                        <div className="card min-h-[400px]">
                            {filteredAppts.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>No appointments found in this tab.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredAppts.map(p => (
                                        <div key={p._id} className="border rounded-xl p-4 hover:shadow-md transition-shadow bg-white">
                                            <div className="flex justify-between items-start">
                                                <div onClick={() => handleViewPatient(p)} className="cursor-pointer group">
                                                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 flex items-center gap-2">
                                                        {p.patientName}
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase border ${p.status === 'completed' ? 'bg-green-50 text-green-600 border-green-200' :
                                                            p.status === 'cancelled' || p.status === 'no_show' ? 'bg-red-50 text-red-600 border-red-200' :
                                                                'bg-blue-50 text-blue-600 border-blue-200'
                                                            }`}>
                                                            {p.status}
                                                        </span>
                                                    </h3>
                                                    <div className="text-sm text-gray-500 flex items-center gap-4 mt-1">
                                                        <span className="flex items-center gap-1"><Clock size={14} /> {new Date(p.date).toLocaleString()}</span>
                                                        {p.reasonForVisit && <span className="flex items-center gap-1 text-gray-600"><Activity size={14} /> {p.reasonForVisit}</span>}
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    {activeTab !== 'history' && (
                                                        <>
                                                            {p.type === 'video' && p.meetingLink && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const roomName = p.meetingLink.split('/').pop();
                                                                        navigate(`/meeting/${roomName}`);
                                                                    }}
                                                                    className="btn bg-purple-50 text-purple-700 hover:bg-purple-100 py-1.5 px-3 text-sm h-8 flex items-center gap-1 border border-purple-200"
                                                                >
                                                                    <Video size={14} /> Start Call
                                                                </button>
                                                            )}

                                                            {(p.status === 'scheduled' || p.status === 'no_show') && activeTab === 'today' && p.type !== 'video' && (
                                                                <>
                                                                    <button onClick={() => handleStatusUpdate(p._id, 'arrived')} className="btn bg-blue-50 text-blue-700 hover:bg-blue-100 py-1.5 px-3 text-sm h-8">Mark Arrived</button>
                                                                    {p.status === 'scheduled' && (
                                                                        <button onClick={() => handleStatusUpdate(p._id, 'no_show')} className="btn bg-red-50 text-red-700 hover:bg-red-100 py-1.5 px-3 text-sm h-8">No Show</button>
                                                                    )}
                                                                </>
                                                            )}
                                                            {['arrived', 'in_progress', 'scheduled'].includes(p.status) && (p.status !== 'scheduled' || p.type === 'video') && (
                                                                <button onClick={() => setTreating(p)} className="btn btn-primary py-1.5 px-4 text-sm h-9 shadow-md animate-pulse">Start Consultation</button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {activeTab === 'history' && p.status === 'completed' && (
                                                <div className="mt-4 pt-3 border-t bg-gray-50 -mx-4 -mb-4 p-4 rounded-b-xl">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Treatment / Diagnosis</span>
                                                            <p className="text-sm text-gray-800">{p.treatmentNotes || 'No notes added.'}</p>
                                                        </div>
                                                        {p.doctorAttachments && p.doctorAttachments.length > 0 && (
                                                            <div>
                                                                <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Prescriptions & Files</span>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {p.doctorAttachments.map((url, i) => (
                                                                        <a key={i} href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${url}`} target="_blank" rel="noreferrer" className="text-xs bg-white border px-2 py-1 rounded text-blue-600 flex items-center gap-1 hover:shadow-sm">
                                                                            <FileText size={12} /> View File {i + 1}
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {activeTab === 'history' && p.status === 'cancelled' && (
                                                <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                                                    Cancelled Reason: {p.cancellationReason || 'Not Provided'}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )
            }

            {/* Patient Details Modal */}
            {
                selectedPatient && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <User className="text-blue-600" />
                                    {selectedPatient.patientName}
                                </h2>
                                <button onClick={() => setSelectedPatient(null)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 max-h-[70vh] overflow-y-auto">
                                {/* Current Appointment Context */}
                                <div className="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-100">
                                    <h4 className="font-bold text-blue-800 text-sm uppercase mb-2">Current Visit Purpose</h4>
                                    <p className="text-blue-900 font-medium">{selectedPatient.reasonForVisit || 'Not specified'}</p>
                                </div>

                                {loadingDetails ? (
                                    <div className="text-center py-8"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
                                ) : patientDetails ? (
                                    <div className="space-y-6">
                                        {/* Personal Details Hidden for Privacy */}
                                        {/* <div className="grid grid-cols-2 gap-4"> ... </div> */}

                                        {patientDetails.records.length > 0 && (
                                            <div>
                                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Shield size={16} /> Medical History ({patientDetails.records.length})</h4>
                                                <div className="space-y-2">
                                                    {patientDetails.records.slice(0, 3).map(rec => (
                                                        <div key={rec._id} className="text-sm border p-2 rounded bg-gray-50 flex justify-between items-center">
                                                            <div>
                                                                <div className="font-medium">{rec.title}</div>
                                                                <div className="text-gray-500 text-xs">{new Date(rec.date).toLocaleDateString()}</div>
                                                            </div>
                                                            <a
                                                                href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/uploads/${rec.fileUrl}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-white hover:underline text-xs bg-blue-600 px-2 py-1 rounded"
                                                            >
                                                                View
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Chat Interface */}
                                        {selectedPatient.status === 'scheduled' && (
                                            <div className="mt-8 pt-6 border-t border-gray-100">
                                                <h4 className="font-bold text-gray-800 mb-4">💬 Patient Message Board</h4>
                                                <div className="h-[300px] border rounded-lg overflow-hidden shadow-sm">
                                                    <ChatComponent
                                                        roomId={selectedPatient._id}
                                                        senderId={user._id || user.id}
                                                        senderRole="doctor"
                                                        receiverId={typeof selectedPatient.patientId === 'object' ? selectedPatient.patientId._id : selectedPatient.patientId}
                                                        receiverRole="patient"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-red-500 text-center">Failed to load profile details.</p>
                                )}
                            </div>
                            <div className="p-4 border-t bg-gray-50 flex justify-end">
                                <button onClick={() => setSelectedPatient(null)} className="btn btn-secondary py-2 px-6">Close</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* FULL SCREEN OVERLAYS: PREPARING ROOM */}
            {
                actionStatus === 'preparing' && (
                    <div className="fixed inset-0 z-[60] bg-blue-600 flex flex-col items-center justify-center text-white animate-fade-in">
                        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <Stethoscope size={48} className="text-white animate-bounce" />
                        </div>
                        <h2 className="text-3xl font-bold mb-2">Preparing Treatment Room...</h2>
                        <p className="text-blue-200">Retrieving patient records and initializing session.</p>
                    </div>
                )
            }

            {/* FULL SCREEN OVERLAYS: COMPLETING TREATMENT */}
            {
                (actionStatus === 'completing' || actionStatus === 'success_completed') && (
                    <div className="fixed inset-0 z-[60] bg-white flex flex-col items-center justify-center animate-fade-in">
                        {actionStatus === 'completing' ? (
                            <>
                                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Finalizing Treatment...</h2>
                                <p className="text-gray-500">Uploading prescriptions and updating records.</p>
                            </>
                        ) : (
                            <div className="text-center animate-pulse">
                                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle size={56} className="text-green-600" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">Treatment Completed!</h2>
                                <p className="text-gray-500 mb-6">Prescription sent to patient.</p>
                                <div className="flex items-center justify-center gap-2 text-blue-600 font-medium">
                                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    Returning to Dashboard...
                                </div>
                            </div>
                        )}
                    </div>
                )
            }
        </div >
    );
};

export default DoctorDashboard;

