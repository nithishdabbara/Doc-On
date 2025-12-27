import { useState, useEffect } from 'react';
import api from '../utils/api';

const AdminVerifyPanel = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        loadPendingDoctors();
    }, []);

    const loadPendingDoctors = async () => {
        try {
            const res = await api.get('/users/admin/doctors-management');
            setDoctors(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const verifyDoctor = async (id) => {
        try {
            await api.put(`/users/admin/verify/${id}`);
            setMsg('Doctor verified successfully!');
            loadPendingDoctors(); // Refresh list
            setTimeout(() => setMsg(''), 3000);
        } catch (err) {
            console.error(err);
            setMsg('Failed to verify doctor.');
        }
    };

    if (loading) return <div>Loading pending verifications...</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow mt-6">
            <h2 className="text-xl font-bold mb-4">Pending Doctor Verifications</h2>
            {msg && <div className="bg-green-100 text-green-700 p-2 rounded mb-4">{msg}</div>}

            {doctors.length === 0 ? (
                <p className="text-gray-500">No pending verifications.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Name / Email
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    NMC Details
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    License Proof
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {doctors.map(doc => (
                                <tr key={doc._id}>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <div className="flex items-center">
                                            <div className="ml-3">
                                                <p className="text-gray-900 font-bold whitespace-no-wrap">
                                                    {doc.name}
                                                </p>
                                                <p className="text-gray-600 whitespace-no-wrap">{doc.email}</p>
                                                <p className="text-gray-500 text-xs mt-1">{doc.specialization}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <p className="font-mono font-bold text-gray-900">ID: {doc.medicalLicense || 'N/A'}</p>
                                        {doc.registrationYear && <p className="text-xs text-gray-600">Year: {doc.registrationYear}</p>}
                                        {doc.stateMedicalCouncil && <p className="text-xs text-gray-600">Council: {doc.stateMedicalCouncil}</p>}

                                        {doc.medicalLicense && (
                                            <a
                                                href="https://www.nmc.org.in/information-desk/indian-medical-register/"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded inline-flex items-center gap-1 mt-2 border border-blue-200"
                                            >
                                                🏛️ Verify on NMC Portal
                                            </a>
                                        )}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {doc.licenseProof ? (
                                            <a
                                                href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${doc.licenseProof}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline flex items-center gap-1"
                                            >
                                                📄 View Certificate
                                            </a>
                                        ) : (
                                            <span className="text-gray-400 italic">No upload</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {doc.isVerified ? (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                ✅ Verified
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => verifyDoctor(doc._id)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-xs shadow transition duration-150 ease-in-out transform hover:scale-105"
                                            >
                                                🛡️ Approve Details
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminVerifyPanel;
