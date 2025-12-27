import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';
import MedicalRecords from './MedicalRecords';

const AdminPatientList = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    // Doctor Record Managment Modal State
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [showRecordsModal, setShowRecordsModal] = useState(false);

    // Get search term from URL
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('search') || '';

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const res = await api.get('/users/admin/patients');
            setPatients(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    // Filter patients based on search query
    const filteredPatients = patients.filter(patient => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            patient.name.toLowerCase().includes(query) ||
            patient.email.toLowerCase().includes(query) ||
            (patient.profile?.phone && patient.profile.phone.includes(query))
        );
    });

    const openRecords = (patientId) => {
        setSelectedPatientId(patientId);
        setShowRecordsModal(true);
    };

    const closeRecords = () => {
        setShowRecordsModal(false);
        setSelectedPatientId(null);
    };

    if (loading) return (
        <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <>
            <div className="bg-white/90 backdrop-blur-lg border border-white/50 p-6 rounded-2xl shadow-xl mt-6 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">
                        Registered Patients
                        {searchQuery && <span className="text-blue-600 ml-2">(Searching: "{searchQuery}")</span>}
                    </h2>
                    <div className="text-sm text-gray-500">
                        Showing {filteredPatients.length} of {patients.length} patients
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Details
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPatients.length > 0 ? (
                                filteredPatients.map(patient => (
                                    <tr key={patient._id} className="hover:bg-blue-50/50 transition duration-150">
                                        <td className="px-5 py-5 border-b border-gray-100 bg-white/50 text-sm">
                                            <p className="text-gray-900 font-bold">{patient.name}</p>
                                            <p className="text-gray-500 text-xs">{patient.email}</p>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-100 bg-white/50 text-sm">
                                            <p className="text-gray-900">{patient.profile?.phone || 'N/A'}</p>
                                            <p className="text-gray-500 text-xs w-48 truncate">{patient.profile?.address || 'N/A'}</p>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-100 bg-white/50 text-sm">
                                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                                                Age: {patient.profile?.age || '-'}
                                            </span>
                                            <span className="ml-2 bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded">
                                                {patient.profile?.gender || '-'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-100 bg-white/50 text-sm">
                                            {/* Action Buttons */}
                                            <button
                                                onClick={() => openRecords(patient._id)}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1 px-3 rounded shadow transition"
                                            >
                                                📂 Manage Records
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-5 py-10 text-center text-gray-500">
                                        No patients found matching "{searchQuery}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Records Modal */}
            {showRecordsModal && selectedPatientId && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeRecords}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                        Manage Patient Records
                                    </h3>
                                    <button onClick={closeRecords} className="text-gray-400 hover:text-gray-500 text-2xl font-bold">
                                        &times;
                                    </button>
                                </div>
                                <div className="mt-2">
                                    <MedicalRecords patientId={selectedPatientId} isDoctorView={true} />
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button type="button" onClick={closeRecords} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminPatientList;
