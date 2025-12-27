import { useState, useEffect } from 'react';
import api from '../utils/api';

const MedicalRecords = ({ patientId, isDoctorView = false }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [type, setType] = useState('Report');

    useEffect(() => {
        fetchRecords();
    }, [patientId]); // Re-fetch if patientId changes

    const fetchRecords = async () => {
        try {
            let res;
            if (isDoctorView && patientId) {
                res = await api.get(`/records/patient/${patientId}`);
            } else {
                res = await api.get('/records');
            }
            setRecords(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !title) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('type', type);

        if (isDoctorView && patientId) {
            formData.append('patientId', patientId);
        }

        try {
            await api.post('/records/upload', formData);
            // Reset form
            setFile(null);
            setTitle('');
            setUploading(false);
            // Refresh list
            fetchRecords();
        } catch (err) {
            console.error(err);
            setUploading(false);
            alert('Upload failed. Please check file type/size.');
        }
    };

    const deleteRecord = async (id) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;
        try {
            await api.delete(`/records/${id}`);
            setRecords(records.filter(r => r._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6">
            {/* Upload Section */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-bold mb-4">📤 Upload New Document</h3>
                <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Blood Test Report"
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full p-2 border rounded"
                        >
                            <option value="Report">Lab Report</option>
                            <option value="Prescription">Prescription</option>
                            <option value="X-Ray">X-Ray / Scan</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="w-full md:w-64">
                        <label className="block text-sm font-medium text-gray-700 mb-1">File (PDF/Image)</label>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="w-full text-sm text-gray-500
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-full file:border-0
                              file:text-sm file:font-semibold
                              file:bg-blue-50 file:text-blue-700
                              hover:file:bg-blue-100"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={uploading}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300 h-10"
                    >
                        {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                </form>
            </div>

            {/* Records Grid */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-bold mb-4">
                    {isDoctorView ? '📂 Patient Medical Records' : '📂 My Medical Records'}
                </h3>
                {loading ? (
                    <p>Loading records...</p>
                ) : records.length === 0 ? (
                    <p className="text-gray-500">No records found. Upload one above!</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {records.map(record => (
                            <div key={record._id} className="border rounded-lg p-4 hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${record.type === 'Prescription' ? 'bg-green-100 text-green-800' :
                                        record.type === 'X-Ray' ? 'bg-purple-100 text-purple-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                        {record.type}
                                    </span>
                                    <button onClick={() => deleteRecord(record._id)} className="text-red-400 hover:text-red-600">
                                        ×
                                    </button>
                                </div>
                                <h4 className="font-bold truncate">{record.title}</h4>
                                <p className="text-xs text-gray-500 mb-4">{new Date(record.date).toLocaleDateString()}</p>

                                <a
                                    href={`http://localhost:5000${record.fileUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-center bg-gray-50 hover:bg-gray-100 text-blue-600 font-medium py-2 rounded border border-gray-200"
                                >
                                    👀 View Document
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MedicalRecords;
