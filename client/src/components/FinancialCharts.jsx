import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useState, useEffect } from 'react';
import api from '../utils/api';

const FinancialCharts = () => {
    const [revenueData, setRevenueData] = useState([]);
    const [patientData, setPatientData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                // Fetch Revenue
                const revRes = await api.get('/bills/analytics/revenue');
                setRevenueData(revRes.data);

                // Fetch Patient Growth
                const patRes = await api.get('/users/analytics/growth');
                setPatientData(revRes.data); // Wait, patient growth is separate logic
                setPatientData(patRes.data);

                setLoading(false);
            } catch (err) {
                console.error("Error fetching analytics:", err);
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) return <div>Loading Analytics...</div>;

    // If all data is zero, show message? Or just empty graph. 
    // Empty graph is fine as "Real Data".

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-bold mb-4">Revenue Overview (Last 6 Months)</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="revenue" fill="#4F46E5" name="Revenue ($)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-bold mb-4">Patient Growth</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={patientData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="newPatients" stroke="#10B981" name="New Patients" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default FinancialCharts;
