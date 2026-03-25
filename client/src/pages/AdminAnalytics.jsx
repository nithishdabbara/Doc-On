import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, DollarSign, ArrowLeft, AlertTriangle, ShieldAlert } from 'lucide-react';

const AdminAnalytics = () => {
    const [data, setData] = useState(null);
    const [riskData, setRiskData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = sessionStorage.getItem('adminToken');
                const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/analytics/dashboard`, {
                    headers: { 'authorization': token }
                });
                setData(res.data);

                // Fetch Risk Data
                const riskRes = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/risk/analysis`, {
                    headers: { 'authorization': token }
                });
                setRiskData(riskRes.data);
            } catch (err) {
                console.error("Failed to fetch analytics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-10 text-center text-gray-500">Loading Predictive Models...</div>;
    if (!data) return <div className="p-10 text-center text-red-500">Failed to load analytics.</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-slate-200 rounded-full transition">
                        <ArrowLeft size={24} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <TrendingUp className="text-blue-600" /> Admin Predictive Analytics
                        </h1>
                        <p className="text-slate-500 text-sm">AI-Driven Insights & Future Forecasting</p>
                    </div>
                </div>
                <div className="text-right hidden sm:block">
                    <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded border border-blue-200">
                        AI MODEL: LINEAR REGRESSION (v1.0)
                    </span>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Projected Revenue (Next Month)</p>
                        <h3 className="text-3xl font-bold text-slate-800 mt-1">₹{data.summary.projectedRevenue.toLocaleString()}</h3>
                        <p className="text-xs font-bold text-green-500 mt-2 flex items-center gap-1">
                            <TrendingUp size={14} /> {data.summary.growthRate} Growth Predicted
                        </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full text-green-600">
                        <DollarSign size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Revenue (Past 6M)</p>
                        <h3 className="text-3xl font-bold text-slate-800 mt-1">₹{data.summary.totalRevenue.toLocaleString()}</h3>
                        <p className="text-xs text-slate-400 mt-2">Historical Data</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                        <DollarSign size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Predicted Footfall</p>
                        <h3 className="text-3xl font-bold text-slate-800 mt-1">~{data.trends[data.trends.length - 1].patients}</h3>
                        <p className="text-xs text-slate-400 mt-2">Patients expected next month</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                        <Users size={24} />
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Chart */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Financial Forecast</h3>
                        <p className="text-sm text-slate-500">Historical Revenue vs AI Prediction</p>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.trends}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRev)"
                                    name="Revenue (₹)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Patient Chart */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Patient Footfall Prediction</h3>
                        <p className="text-sm text-slate-500">Expected patient volume trend</p>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.trends}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="patients"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6 }}
                                    name="Patients"
                                    strokeDasharray="5 5" // Dotted line style implying prediction/trend
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Risk & Fraud Monitor */}
            {riskData && (
                <div className="mt-8 bg-white p-6 rounded-xl shadow-md border border-red-100">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <ShieldAlert className="text-red-600" /> Fraud & Risk Monitor
                            </h3>
                            <p className="text-sm text-slate-500">Real-time anomaly detection engine</p>
                        </div>
                        <div className="px-4 py-2 bg-red-50 text-red-700 font-bold rounded-lg border border-red-100">
                            Risk Score: {riskData.riskScore} (Low)
                        </div>
                    </div>

                    <div className="space-y-4">
                        {riskData.activeFlags.map(flag => (
                            <div key={flag.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border-l-4 border-l-red-500 hover:bg-white transition-colors border hover:border-red-200 shadow-sm">
                                <div className="p-2 bg-red-100 text-red-600 rounded-full shrink-0">
                                    <AlertTriangle size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-gray-800">{flag.type}</h4>
                                        <span className="text-xs font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded uppercase">{flag.severity}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{flag.description}</p>
                                    <div className="text-xs text-gray-400 mt-2 flex gap-4">
                                        <span>Detected: {new Date(flag.date).toLocaleString()}</span>
                                        <span className="font-medium text-blue-600 cursor-pointer hover:underline">Investigate Case</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-800 text-center">
                ✨ <strong>AI Insight:</strong> {data?.summary?.growthRate && parseInt(data.summary.growthRate) > 0
                    ? `Based on the current growth trajectory (${data.summary.growthRate}), we recommend increasing Lab Assistant shifts for next month to handle the predicted footfall.`
                    : "Growth is stable. Current resources are sufficient to handle expected patient volume."}
            </div>
        </div>
    );
};

export default AdminAnalytics;

