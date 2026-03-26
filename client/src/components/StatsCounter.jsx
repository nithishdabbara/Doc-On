import React from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const StatsCounter = () => {
    const [stats, setStats] = React.useState({
        doctors: '0+',
        patients: '0+',
        specialties: '0+',
        rating: '4.9/5'
    });

    React.useEffect(() => {
        // 1. Initial Fetch
        const fetchStats = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/doctors/stats`);
                if (res.data) {
                    setStats({
                        doctors: res.data.doctors + '+',
                        patients: res.data.patients + '+',
                        specialties: res.data.specialties + '+',
                        rating: '4.9/5'
                    });
                }
            } catch (err) {
                console.error("Stats Fetch Error", err);
            }
        };
        fetchStats();

        // 2. Real-Time Updates via Socket.io (Disabled for Stability)
        /*
        const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000");

        socket.on('stats_update', (data) => {
            setStats({
                doctors: data.doctors + '+',
                patients: data.patients + '+',
                specialties: data.specialties + '+',
                rating: '4.9/5'
            });
        });

        return () => socket.disconnect();
        */
    }, []);

    return (
        <div className="stats-bar">
            <div className="container">
                <div className="stats-grid">
                    <div className="stat-item">
                        <span className="stat-number">{stats.doctors}</span>
                        <span className="stat-label">Verified Doctors</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <span className="stat-number">{stats.patients}</span>
                        <span className="stat-label">Happy Patients</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <span className="stat-number">{stats.specialties}</span>
                        <span className="stat-label">Specialties</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <span className="stat-number">{stats.rating}</span>
                        <span className="stat-label">App Rating</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsCounter;
