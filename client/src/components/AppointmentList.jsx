import { useState, useEffect } from 'react';
import api from '../utils/api';

const AppointmentList = ({ role }) => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const res = await api.get('/appointments');
                setAppointments(res.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchAppointments();
    }, []);

    const updateStatus = async (id, status) => {
        try {
            await api.put(`/appointments/${id}/status`, { status });
            // Optimistic update or refetch
            setAppointments(appointments.map(apt =>
                apt._id === id ? { ...apt, status } : apt
            ));
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    if (loading) return <div>Loading appointments...</div>;
    if (appointments.length === 0) return <p className="text-gray-500">No appointments scheduled.</p>;

    return (
        <div className="space-y-4">
            {appointments.map(apt => (
                <div key={apt._id} className={`p-4 rounded shadow-sm border-l-4 ${apt.status === 'confirmed' ? 'border-green-500 bg-green-50' :
                    apt.status === 'cancelled' ? 'border-red-500 bg-red-50' :
                        apt.status === 'pending' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-500 bg-gray-100'
                    }`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold">
                                {role === 'doctor' ? `Patient: ${apt.patient.name}` : `Doctor: ${apt.doctor.name} (${apt.doctor.specialization})`}
                            </p>
                            <p className="text-gray-600">
                                {new Date(apt.date).toLocaleString()}
                                {apt.visitType && (
                                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full font-bold ${apt.visitType === 'Urgent' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-gray-200 text-gray-700'
                                        }`}>
                                        {apt.visitType === 'Urgent' && '🔥 '} {apt.visitType}
                                    </span>
                                )}
                                {apt.patient?.profile?.age >= 60 && (
                                    <span className="ml-2 px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded-full font-bold border border-orange-200">
                                        👴 Senior ({apt.patient.profile.age})
                                    </span>
                                )}
                            </p>
                            {apt.notes && <p className="text-gray-500 text-sm mt-1">Notes: {apt.notes}</p>}
                            <p className="text-sm font-bold mt-1 uppercase text-gray-700">Status: {apt.status}</p>
                        </div>

                        {role === 'doctor' && apt.status === 'pending' && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => updateStatus(apt._id, 'confirmed')}
                                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                                >
                                    Confirm
                                </button>
                                <button
                                    onClick={() => updateStatus(apt._id, 'cancelled')}
                                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                >
                                    Decline
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AppointmentList;
