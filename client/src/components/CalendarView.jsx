import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../utils/api';

const CalendarView = () => {
    const [appointments, setAppointments] = useState([]);
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const res = await api.get('/appointments');
                // Ensure dates are parsed correctly
                const parsed = res.data.map(app => ({
                    ...app,
                    date: new Date(app.date)
                }));
                setAppointments(parsed);
            } catch (err) {
                console.error("Error fetching appointments:", err);
            }
        };
        fetchAppointments();
    }, []);

    // Helper to check if a date has appointments
    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const hasAppointment = appointments.some(app =>
                app.date.getDate() === date.getDate() &&
                app.date.getMonth() === date.getMonth() &&
                app.date.getFullYear() === date.getFullYear()
            );
            return hasAppointment ? <div className="h-2 w-2 bg-blue-500 rounded-full mx-auto mt-1"></div> : null;
        }
    };

    // Filter appointments for selected date
    const selectedDateAppointments = appointments.filter(app =>
        app.date.getDate() === date.getDate() &&
        app.date.getMonth() === date.getMonth() &&
        app.date.getFullYear() === date.getFullYear()
    );

    return (
        <div className="flex flex-col md:flex-row gap-6">
            <div className="bg-white p-4 rounded shadow">
                <Calendar
                    onChange={setDate}
                    value={date}
                    tileContent={tileContent}
                    className="border-none"
                />
            </div>

            <div className="flex-1 bg-white p-6 rounded shadow">
                <h3 className="text-xl font-bold mb-4">Schedule for {date.toDateString()}</h3>
                {selectedDateAppointments.length > 0 ? (
                    <div className="space-y-3">
                        {selectedDateAppointments.map(app => (
                            <div key={app._id} className="p-3 border rounded border-l-4 border-blue-500">
                                <p className="font-semibold">{app.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                <p className="text-gray-700">Patient: {app.patient.name}</p>
                                {app.notes && <p className="text-sm text-gray-500 italic">"{app.notes}"</p>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No appointments for this day.</p>
                )}
            </div>
        </div>
    );
};

export default CalendarView;
