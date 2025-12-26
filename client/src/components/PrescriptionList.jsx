import { useState, useEffect } from 'react';
import api from '../utils/api';

const PrescriptionList = ({ patientId }) => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPrescriptions = async () => {
        try {
            const res = await api.get(`/prescriptions/patient/${patientId}`);
            setPrescriptions(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch prescriptions', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (patientId) fetchPrescriptions();
    }, [patientId]);

    if (loading) return <div>Loading records...</div>;
    if (prescriptions.length === 0) return <p className="text-gray-500">No prescription history found.</p>;

    return (
        <div className="space-y-4">
            {prescriptions.map(pres => (
                <div key={pres._id} className="bg-white p-4 rounded shadow border border-gray-200">
                    <div className="flex justify-between border-b pb-2 mb-2">
                        <span className="font-bold text-lg">Dr. {pres.doctor.name}</span>
                        <span className="text-gray-600">{new Date(pres.date).toLocaleDateString()}</span>
                    </div>
                    <ul className="list-disc pl-5 mb-2">
                        {pres.medications.map((med, i) => (
                            <li key={i} className="text-gray-800">
                                <span className="font-semibold">{med.name}</span> - {med.dosage} ({med.frequency})
                            </li>
                        ))}
                    </ul>
                    {pres.notes && <p className="text-sm text-gray-500 italic">Note: {pres.notes}</p>}
                </div>
            ))}
        </div>
    );
};

export default PrescriptionList;
