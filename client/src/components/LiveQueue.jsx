import { useState, useEffect } from 'react';
import api from '../utils/api';

const LiveQueue = ({ appointment }) => {
    const [queueData, setQueueData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!appointment) return;
        fetchQueueStatus();

        // Poll every 30 seconds
        const interval = setInterval(fetchQueueStatus, 30000);
        return () => clearInterval(interval);
    }, [appointment]);

    const fetchQueueStatus = async () => {
        try {
            const res = await api.get(`/appointments/queue-status/${appointment.doctor._id}`);
            setQueueData(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    if (loading) return <div className="text-gray-400 text-xs">Loading queue...</div>;
    if (!queueData) return null;

    const myToken = appointment.queueNumber;
    const currentToken = queueData.currentToken;

    // Calculate Wait
    const patientsAhead = myToken - currentToken;
    const avgTimePerPatient = 15; // mins
    const estimatedWait = patientsAhead > 0 ? patientsAhead * avgTimePerPatient : 0;

    const isMyTurn = myToken === currentToken;

    return (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-4 text-white shadow-lg mt-4 animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-20">
                <span className="text-6xl">⏱️</span>
            </div>

            <h3 className="font-bold text-lg mb-2 border-b border-white/20 pb-2">Live Queue Tracker</h3>

            <div className="flex justify-between items-center text-center">
                <div>
                    <p className="text-xs uppercase opacity-80">Current Token</p>
                    <p className="text-4xl font-extrabold">{currentToken}</p>
                </div>

                <div className="px-4">
                    {patientsAhead > 0 ? (
                        <div className="bg-white/20 rounded-full h-1 w-16 my-2"></div>
                    ) : (
                        <span className="text-2xl">👉</span>
                    )}
                </div>

                <div>
                    <p className="text-xs uppercase opacity-80">Your Token</p>
                    <p className="text-4xl font-extrabold text-yellow-300">{myToken}</p>
                </div>
            </div>

            <div className="mt-4 bg-black/20 rounded p-2 text-center">
                {isMyTurn ? (
                    <p className="font-bold text-yellow-300 animate-pulse">It's Your Turn! Please go inside.</p>
                ) : patientsAhead > 0 ? (
                    <p className="text-sm">
                        approx <span className="font-bold">{estimatedWait} mins</span> wait time
                        <br />
                        <span className="text-xs opacity-75">({patientsAhead} patients ahead of you)</span>
                    </p>
                ) : (
                    <p className="text-sm">Appointment Completed</p>
                )}
            </div>
        </div>
    );
};

export default LiveQueue;
