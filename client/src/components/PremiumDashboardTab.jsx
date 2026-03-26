import React from 'react';
import { Calendar, Clock, Map, MoreHorizontal, TestTube, FlaskConical, Bot, BrainCircuit, Activity, ChevronRight, Download } from 'lucide-react';

const PremiumDashboardTab = ({ user, appointments, navigate, setActiveTab }) => {
    // Get the next upcoming appointment
    const now = new Date();
    const upcomingAppts = appointments
        .filter(a => a.status === 'scheduled' && new Date(a.date) >= now)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    const nextAppt = upcomingAppts.length > 0 ? upcomingAppts[0] : null;

    return (
        <div className="animate-fade-in font-headline">
            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Upcoming Appointment (Glassmorphism Card) */}
                <div className="lg:col-span-7 group">
                    <div className="glass-card h-full rounded-[2rem] p-8 relative overflow-hidden flex flex-col justify-between min-h-[300px] border border-white/40 shadow-xl bg-gradient-to-br from-white/60 to-white/30 dark:from-slate-800/60 dark:to-slate-900/40">
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors duration-700"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <span className="px-4 py-1.5 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest rounded-full">Next Visit</span>
                                <MoreHorizontal size={24} className="text-primary/40" />
                            </div>
                            
                            {nextAppt ? (
                                <div className="flex items-start gap-6">
                                    <img 
                                        alt={nextAppt.doctorId?.name || "Doctor"} 
                                        className="w-20 h-20 rounded-2xl object-cover shadow-lg bg-white" 
                                        src={nextAppt.doctorId?.profilePhoto || "https://ui-avatars.com/api/?name=" + (nextAppt.doctorId?.name || "Dr") + "&background=006067&color=fff"} 
                                    />
                                    <div>
                                        <h3 className="text-2xl font-bold text-on-surface mb-1">
                                            Dr. {nextAppt.doctorId?.name || 'Assigned Doctor'}
                                        </h3>
                                        <p className="text-secondary font-medium mb-4">
                                            {nextAppt.doctorId?.specialization || 'General Consultation'} • {nextAppt.doctorId?.hospital || 'Samanvi Clinic'}
                                        </p>
                                        <div className="flex flex-wrap gap-4">
                                            <div className="flex items-center gap-2 text-on-surface-variant">
                                                <Calendar size={18} className="text-primary"/>
                                                <span className="text-sm font-semibold">{new Date(nextAppt.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric'})}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-on-surface-variant">
                                                <Clock size={18} className="text-primary"/>
                                                <span className="text-sm font-semibold">{new Date(nextAppt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 opacity-60">
                                    <Calendar size={48} className="text-primary mb-4" />
                                    <p className="text-lg font-bold text-on-surface">No Upcoming Appointments</p>
                                    <p className="text-sm text-secondary">Schedule a visit to stay on top of your health.</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="relative z-10 mt-8 flex gap-3">
                            {nextAppt ? (
                                <>
                                    <button 
                                        onClick={() => setActiveTab('appointments')}
                                        className="flex-1 py-3 px-6 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-container transition-all"
                                    >
                                        Manage Appointment
                                    </button>
                                    {nextAppt.paymentStatus === 'paid' && (
                                        <a
                                            href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/patients/appointments/${nextAppt._id}/invoice`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="py-3 px-6 bg-teal-50 text-teal-600 font-bold rounded-xl border border-teal-200 hover:bg-teal-100 transition-all flex items-center gap-2"
                                        >
                                            <Download size={18} /> Receipt
                                        </a>
                                    )}
                                </>
                            ) : (
                                <button 
                                    onClick={() => navigate('/search-doctors')}
                                    className="flex-1 py-3 px-6 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-container transition-all"
                                >
                                    Book Now
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Action Cards */}
                <div className="lg:col-span-5 grid grid-cols-1 gap-6">
                    <div 
                        onClick={() => navigate('/diagnostics')}
                        className="bg-gradient-to-br from-primary to-primary-container rounded-[2rem] p-8 text-white relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02] shadow-xl"
                    >
                        <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <TestTube size={160} strokeWidth={1} />
                        </div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                                <FlaskConical size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-extrabold mb-2">Book Lab Test</h3>
                                <p className="text-primary-fixed/80 text-sm leading-relaxed max-w-[200px]">
                                    Schedule blood panels, screenings, or imaging in minutes.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div 
                        onClick={() => setActiveTab('ai')}
                        className="bg-gradient-to-br from-secondary to-on-secondary-fixed-variant rounded-[2rem] p-8 text-white relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02] shadow-xl"
                    >
                        <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <Bot size={160} strokeWidth={1} />
                        </div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                                <BrainCircuit size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-extrabold mb-2">AI Health Assistant</h3>
                                <p className="text-secondary-fixed/80 text-sm leading-relaxed max-w-[200px]">
                                    Analyze reports and check symptoms instantly.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Medical Records Linker */}
                <div className="lg:col-span-12 mt-4">
                    <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-[0_24px_48px_-12px_rgba(25,28,29,0.04)] border border-gray-100">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-2xl font-bold text-on-surface">Recent Activity Snippet</h3>
                            <button 
                                onClick={() => setActiveTab('labs')}
                                className="text-primary font-bold text-sm hover:underline"
                            >
                                View All Lab Records
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div 
                                onClick={() => setActiveTab('labs')}
                                className="flex items-center justify-between p-5 hover:bg-surface-container-low rounded-2xl transition-all cursor-pointer group border border-transparent hover:border-gray-200"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Activity size={32} className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-on-surface">Access Complete Medical History</h4>
                                        <p className="text-xs text-secondary mt-1">Includes past appointments, digitized records, and lab results.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <span className="px-4 py-1.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-widest rounded-full">Secure</span>
                                    <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                                        <ChevronRight size={20} className="text-slate-400 group-hover:text-primary transition-colors" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PremiumDashboardTab;

