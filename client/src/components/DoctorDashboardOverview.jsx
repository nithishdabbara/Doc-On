import React from 'react';
import { 
    Calendar, PlusCircle, MoreVertical, HeartPulse, Stethoscope, 
    MessageSquare, Pill, BrainCircuit, ChevronRight, Activity
} from 'lucide-react';

const DoctorDashboardOverview = ({ user, appointments, navigate, setActiveTab }) => {
    const now = new Date();
    const todayAppointments = appointments
        .filter(a => {
            const apptDate = new Date(a.date);
            return apptDate.getDate() === now.getDate() && 
                   apptDate.getMonth() === now.getMonth() && 
                   apptDate.getFullYear() === now.getFullYear();
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const pendingAppointments = todayAppointments.filter(a => a.status === 'scheduled');
    const nextPatient = pendingAppointments.length > 0 ? pendingAppointments[0] : null;

    return (
        <div className="animate-fade-in font-headline">
            {/* Welcome Header */}
            <section className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-extrabold text-on-surface tracking-tight mb-2">
                        Welcome, Dr. {user.name?.replace(/^Dr\.?\s*/i, '').split(' ')[0] || 'Doctor'}
                    </h2>
                    <div className="flex items-center gap-4 text-secondary font-medium">
                        <span className="flex items-center gap-1">
                            <Calendar size={18} />
                            {now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'})}
                        </span>
                        <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
                        <span className="bg-primary-fixed/40 text-primary font-bold px-3 py-1 rounded-full text-sm">
                            {todayAppointments.length} Patients Today
                        </span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setActiveTab('appointments')}
                        className="bg-secondary-container text-on-secondary-container px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all"
                    >
                        <PlusCircle size={20} />
                        View All Consults
                    </button>
                </div>
            </section>

            {/* Main Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Next Patient Card */}
                <div className="lg:col-span-7 group">
                    <div className="glass-card rounded-[2.5rem] border border-white/40 dark:border-white/10 p-8 h-full shadow-[0_24px_48px_-12px_rgba(25,28,29,0.06)] relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-fixed/20 blur-[100px] -mr-32 -mt-32 rounded-full"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-10">
                                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-secondary bg-secondary-fixed/30 px-4 py-1.5 rounded-full">
                                    Up Next • {nextPatient ? new Date(nextPatient.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'No pending'}
                                </span>
                                <MoreVertical className="text-outline cursor-pointer hover:text-primary transition-colors" />
                            </div>
                            
                            {nextPatient ? (
                                <>
                                    <div className="flex items-center gap-6 mb-8">
                                        <div className="w-20 h-20 rounded-[2rem] overflow-hidden bg-surface-container-high">
                                            <img 
                                                className="w-full h-full object-cover" 
                                                src={"https://ui-avatars.com/api/?name=" + (nextPatient.patientId?.name || "Patient") + "&background=e2e8f0&color=0f172a"} 
                                                alt="Patient" 
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-bold tracking-tight">{nextPatient.patientId?.name || 'Assigned Patient'}</h3>
                                            <p className="text-secondary font-medium">Patient Details Available Upon Examination</p>
                                        </div>
                                    </div>
                                    <div className="bg-surface-container-low/50 backdrop-blur-md rounded-2xl p-6 mb-10 border border-white/30">
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-outline mb-2">Reported Reason</p>
                                        <div className="flex items-start gap-3">
                                            <HeartPulse size={24} className="text-error mt-0.5" />
                                            <p className="text-lg font-semibold text-on-surface-variant leading-tight">
                                                Periodic Health Consultation & Vital Checks.
                                            </p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 opacity-60">
                                    <Calendar size={48} className="text-primary mb-4" />
                                    <p className="text-lg font-bold text-on-surface">No Pending Appointments Today</p>
                                    <p className="text-sm text-secondary">Check tomorrow's schedule or review records.</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="relative z-10 flex items-center gap-4 mt-4">
                            {nextPatient ? (
                                <button 
                                    onClick={() => setActiveTab('appointments')}
                                    className="flex-1 bg-gradient-to-br from-primary to-primary-container text-white py-4 rounded-2xl font-bold tracking-wide shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <Stethoscope size={20} />
                                    Examine
                                </button>
                            ) : (
                                <button 
                                    onClick={() => setActiveTab('appointments')}
                                    className="flex-1 bg-gradient-to-br from-secondary to-secondary-container text-white py-4 rounded-2xl font-bold tracking-wide shadow-xl shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <Calendar size={20} />
                                    View Full Schedule
                                </button>
                            )}
                            <button className="w-14 h-14 rounded-2xl border border-outline-variant/30 flex items-center justify-center text-primary hover:bg-primary/5 transition-colors">
                                <MessageSquare size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="lg:col-span-5 grid grid-cols-1 gap-6">
                    <div 
                        onClick={() => setActiveTab('prescriptions')}
                        className="glass-card rounded-[2.5rem] border border-white/40 dark:border-white/10 p-6 flex items-center gap-6 group hover:bg-white/80 transition-all cursor-pointer shadow-lg shadow-black/5"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-secondary-fixed/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Pill size={32} className="text-secondary" />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold tracking-tight">Write Prescription</h4>
                            <p className="text-sm text-secondary font-medium">Digital pharmacy integration</p>
                        </div>
                        <ChevronRight className="ml-auto text-outline group-hover:text-primary transition-colors" />
                    </div>

                    <div 
                        onClick={() => setActiveTab('ai')}
                        className="glass-card rounded-[2.5rem] border border-white/40 dark:border-white/10 p-6 flex items-center gap-6 group hover:bg-white/80 transition-all cursor-pointer shadow-lg shadow-black/5"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-primary-fixed/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <BrainCircuit size={32} className="text-primary" />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold tracking-tight">Analyze Scan (AI)</h4>
                            <p className="text-sm text-secondary font-medium">Radiology AI co-pilot active</p>
                        </div>
                        <ChevronRight className="ml-auto text-outline group-hover:text-primary transition-colors" />
                    </div>

                    <div className="bg-surface-container-highest rounded-[2.5rem] p-8 flex flex-col justify-center relative overflow-hidden border border-gray-100 shadow-sm">
                        <div className="absolute -bottom-6 -right-6 opacity-5">
                            <Activity size={180} strokeWidth={1} />
                        </div>
                        <h4 className="text-lg font-bold mb-1 relative z-10">Clinic Analytics</h4>
                        <p className="text-sm text-secondary font-medium mb-4 relative z-10">Patient throughput is steady today compared to last week.</p>
                        <div className="flex gap-2 relative z-10">
                            <div className="h-1.5 flex-1 bg-primary rounded-full"></div>
                            <div className="h-1.5 flex-1 bg-primary/40 rounded-full"></div>
                            <div className="h-1.5 flex-1 bg-primary/20 rounded-full"></div>
                        </div>
                    </div>
                </div>

                {/* Today's Schedule */}
                <div className="lg:col-span-12 mt-4">
                    <div className="flex items-center justify-between mb-8 px-2">
                        <h3 className="text-2xl font-bold tracking-tight">Today's Schedule</h3>
                        <button 
                            onClick={() => setActiveTab('appointments')}
                            className="text-primary font-bold text-sm hover:underline"
                        >
                            View Full Calendar
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {todayAppointments.slice(0, 3).map((appt, idx) => (
                            <div 
                                key={appt._id || idx}
                                className={`p-6 rounded-[2rem] flex flex-col gap-4 relative shadow-sm border ${
                                    idx === 0 && appt.status === 'scheduled' 
                                        ? 'bg-gradient-to-br from-primary to-primary-container text-white border-transparent shadow-xl shadow-primary/20' 
                                        : 'bg-surface-container-low border-white/50 dark:border-white/5'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${idx === 0 && appt.status === 'scheduled' ? 'text-white/70' : 'text-outline'}`}>
                                        {new Date(appt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter ${
                                        idx === 0 && appt.status === 'scheduled' 
                                            ? 'bg-white/20 text-white border border-white/10' 
                                            : appt.status === 'completed' 
                                                ? 'bg-emerald-100 text-emerald-700' 
                                                : 'bg-primary/10 text-primary border border-primary/20'
                                    }`}>
                                        {appt.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full overflow-hidden ${idx === 0 && appt.status === 'scheduled' ? 'bg-white/20' : 'bg-slate-200'}`}>
                                        <img 
                                            className="w-full h-full object-cover" 
                                            src={"https://ui-avatars.com/api/?name=" + (appt.patientId?.name || "Patient") + "&background=random"} 
                                            alt="Patient" 
                                        />
                                    </div>
                                    <div>
                                        <p className="font-bold leading-none text-lg">
                                            {appt.patientId?.name || 'Assigned Patient'}
                                        </p>
                                        <p className={`text-xs mt-1 font-medium ${idx === 0 && appt.status === 'scheduled' ? 'text-primary-fixed/80' : 'text-secondary'}`}>
                                            Standard Consult
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {todayAppointments.length === 0 && (
                            <div className="col-span-3 bg-surface border border-dashed border-outline-variant rounded-[2rem] p-8 flex items-center justify-center text-secondary">
                                No appointments scheduled for today.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DoctorDashboardOverview;

