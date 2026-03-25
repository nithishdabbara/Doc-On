import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Users, Activity, AlertTriangle, Sun, Award } from 'lucide-react';

const AnalyticsTab = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = sessionStorage.getItem('token');
                const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/analytics`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setData(res.data);
            } catch (err) {
                console.error("Failed to load analytics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return <div className="text-center py-10 text-gray-400">Loading Analytics...</div>;
    if (!data) return <div className="text-center py-10 text-red-400">Failed to load data.</div>;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Stats could go here if separate from Main Dashboard stats, but keeping clean for now */}

            {/* AI Insights Section */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <Activity /> AI Health Intelligence Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.insights.map((insight, idx) => (
                        <div key={idx} className="bg-white/10 backdrop-blur-md p-4 rounded-lg border border-white/20">
                            <div className="flex items-start gap-3">
                                {insight.type === 'warning' ? <AlertTriangle className="text-yellow-300 mt-1" /> :
                                    insight.type === 'info' ? <Sun className="text-blue-300 mt-1" /> :
                                        <Award className="text-green-300 mt-1" />}
                                <div>
                                    <h4 className="font-bold text-sm uppercase opacity-75">{insight.type}</h4>
                                    <p className="text-sm font-medium">{insight.text}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {data.insights.length === 0 && (
                        <p className="text-white/80 italic">No significant anomalies detected this month.</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="card h-[400px] flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="text-green-500" /> Revenue Trend (6 Months)
                    </h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.revenue}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                                <YAxis stroke="#888888" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Specialty Distribution */}
                <div className="card h-[400px] flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Users className="text-blue-500" /> Doctor Distribution by Specialty
                    </h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.specialty}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {data.specialty.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsTab;

