import { Link } from 'react-router-dom';
import { Search, ShieldCheck, Heart, HeartPulse, UserPlus, Clock, Award, CheckCircle, Brain, BrainCircuit, Bone, Baby, Eye, Smile, Stethoscope, Syringe, User, Ear, Wind, Activity, Thermometer, Droplets, Utensils, Dna, Sparkles } from 'lucide-react';
import StatsCounter from '../components/StatsCounter';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ToothIcon, DermatologistIcon, StomachIcon, KidneysIcon, CancerRibbonIcon } from '../components/CustomIcons';

const Home = () => {
    const [specialties, setSpecialties] = useState([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const INITIAL_LIMIT = 5;

    const DEFAULT_SPECIALTIES = [
        'General Physician', 'Dermatologist', 'Dentist', 'Cardiologist', 'Gastroenterologist',
        'Gynecologist', 'Pediatrician', 'Neurologist', 'Orthopedist', 'Psychiatrist'
    ];

    useEffect(() => {
        const fetchSpecs = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/doctors/specializations`);

                let data = res.data;
                if (!data || data.length === 0) {
                    console.log("Using Default Specialties");
                    data = DEFAULT_SPECIALTIES;
                }

                // Priority list for "Top & Most Treated"
                const priorityKeywords = ['physician', 'cardio', 'derm', 'gastro', 'dent']; // Top 5

                const sorted = data.sort((a, b) => {
                    const aLower = a.toLowerCase();
                    const bLower = b.toLowerCase();

                    const aIndex = priorityKeywords.findIndex(k => aLower.includes(k));
                    const bIndex = priorityKeywords.findIndex(k => bLower.includes(k));

                    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex; // Both in priority, sort by priority order
                    if (aIndex !== -1) return -1; // a is in priority, comes first
                    if (bIndex !== -1) return 1;  // b is in priority, comes first

                    return a.localeCompare(b); // Default alphabetical
                });

                setSpecialties(sorted);
            } catch (err) {
                console.error('Error fetching specialties, using defaults', err);
                setSpecialties(DEFAULT_SPECIALTIES.sort());
            }
        };
        fetchSpecs();
    }, []);

    const getSpecialtyInfo = (name) => {
        const lower = name.toLowerCase();

        // Critical: Check Gastro BEFORE Ent (matches "ent")
        if (lower.includes('gastro')) return {
            icon: StomachIcon, color: '#fff1f2', iconColor: '#be123c', // Rose-pink theme
            subtitle: 'Digestive Specialist', desc: 'Treats stomach, liver, intestines, digestion problems, acidity, ulcers, IBS'
        };

        if (lower.includes('cardio')) return {
            icon: HeartPulse, color: '#eef2ff', iconColor: '#6366f1',
            subtitle: 'Heart Specialist', desc: 'Treats heart, blood vessels, blood pressure, heart attack, heart rhythm problems'
        };
        if (lower.includes('dent')) return {
            icon: ToothIcon, color: '#fffbeb', iconColor: '#d97706', // Cream/Amber theme
            subtitle: 'Teeth & Mouth', desc: 'Treats teeth, gums, oral infections, cavities, tooth pain, braces, gum disease'
        };
        if (lower.includes('derm')) return {
            icon: DermatologistIcon, color: '#fff7ed', iconColor: '#ea580c', // Orange theme
            subtitle: 'Skin Specialist', desc: 'Treats skin, hair, nails, acne, rashes, fungal infections, allergies, psoriasis'
        };
        if (lower.includes('ent') || lower.includes('ear')) return {
            icon: Ear, color: '#ffedd5', iconColor: '#c2410c',
            subtitle: 'Ear, Nose, Throat', desc: 'Treats ear infections, sinus issues, allergies, sore throat, tonsils, hearing problems'
        };
        if (lower.includes('endo')) return {
            icon: Dna, color: '#fef3c7', iconColor: '#d97706',
            subtitle: 'Hormone Specialist', desc: 'Treats hormone system, thyroid, diabetes, growth problems, metabolism, PCOS'
        };
        if (lower.includes('physician') || lower.includes('medicine')) return {
            icon: Stethoscope, color: '#dae6ff', iconColor: '#2563eb',
            subtitle: 'Primary Care', desc: 'Treats common illnesses – fever, cold, flu, weakness, infections, first diagnosis'
        };
        if (lower.includes('gyn') || lower.includes('obs')) return {
            icon: User, color: '#fdf2f8', iconColor: '#db2777',
            subtitle: 'Women\'s Health', desc: 'Treats women’s reproductive system, pregnancy, uterus, ovaries, menstrual problems'
        };
        if (lower.includes('nephro') || lower.includes('kidney')) return {
            icon: KidneysIcon, color: '#e0f2fe', iconColor: '#0ea5e9', // Sky blue theme
            subtitle: 'Kidney Specialist', desc: 'Treats kidneys, urine problems, kidney stones, kidney failure, dialysis care'
        };
        if (lower.includes('neuro')) return {
            icon: Brain, color: '#faf5ff', iconColor: '#9333ea',
            subtitle: 'Brain & Nerves', desc: 'Treats brain, nerves, spine, stroke, epilepsy, headaches, memory problems'
        };
        if (lower.includes('onco') || lower.includes('cancer')) return {
            icon: CancerRibbonIcon, color: '#fce7f3', iconColor: '#be185d', // Pink Ribbon theme
            subtitle: 'Cancer Specialist', desc: 'Treats all types of cancer, tumor diagnosis and treatment, chemotherapy planning'
        };
        if (lower.includes('eye') || lower.includes('ophth')) return {
            icon: Eye, color: '#ecfccb', iconColor: '#65a30d',
            subtitle: 'Eye Specialist', desc: 'Treats eyes, vision problems, cataract, infections, eye injuries, eye surgeries'
        };
        if (lower.includes('ortho')) return {
            icon: Bone, color: '#eff6ff', iconColor: '#2563eb',
            subtitle: 'Bone & Joints', desc: 'Treats bones, joints, fractures, back pain, arthritis, sports injuries'
        };
        if (lower.includes('pediat')) return {
            icon: Baby, color: '#f0fdf4', iconColor: '#16a34a',
            subtitle: 'Child Specialist', desc: 'Treats newborns, babies, children, vaccination, growth issues, infections'
        };
        if (lower.includes('psych')) return {
            icon: BrainCircuit, color: '#faf5ff', iconColor: '#9333ea',
            subtitle: 'Mental Health', desc: 'Treats depression, anxiety, stress, sleep problems, behavioral & emotional disorders'
        };
        if (lower.includes('pulmo') || lower.includes('lung')) return {
            icon: Wind, color: '#ecfeff', iconColor: '#0891b2',
            subtitle: 'Lungs Specialist', desc: 'Treats lungs, breathing problems, asthma, TB, pneumonia, chronic cough'
        };
        if (lower.includes('urolo')) return {
            icon: Droplets, color: '#eff6ff', iconColor: '#2563eb',
            subtitle: 'Urinary Specialist', desc: 'Treats urine system, bladder, kidneys, prostate, male fertility, stones'
        };

        return { icon: Award, color: '#f3f4f6', iconColor: '#6b7280', subtitle: 'Specialist', desc: 'General healthcare services' };
    };

    const visibleSpecialties = isExpanded ? specialties : specialties.slice(0, INITIAL_LIMIT);

    return (
        <div className="animate-fade">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="container">
                    <div className="hero-badge animate-bounce-slow">✨ New: Voice-Activated AI & Nutrition Planning</div>
                    <h1 className="hero-title">
                        Complete Healthcare <br /> at Your Fingertips
                    </h1>
                    <p className="hero-subtitle">
                        Connect with top-rated specialists, manage your medical records securely, and get treated faster than ever. The modern standard for patient care.
                    </p>

                    <div className="flex justify-center gap-4 mt-8">
                        <Link to="/search-doctors" className="btn btn-primary text-lg px-8 py-4 shadow-lg shadow-blue-500/30">
                            Find a Doctor
                        </Link>
                        <Link to="/patient/dashboard" className="btn btn-secondary text-lg px-8 py-4">
                            Try AI Assistant
                        </Link>
                    </div>


                </div>
            </section>

            {/* NEW: Feature Spotlight (The "Wow" Factor) */}
            <section style={{
                padding: '4rem 0',
                background: `linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(248,250,252,0.95)), url('https://img.freepik.com/free-vector/medical-healthcare-blue-color-background_1017-26807.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>
                <div className="container">
                    <div className="text-center mb-12">
                        <span className="text-blue-600 font-bold tracking-wider uppercase text-sm bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                            🚀 Just Launched
                        </span>
                        <h2 className="text-3xl font-bold mt-4 text-gray-800">Healthcare Reimagined with AI</h2>
                        <p className="text-gray-500 mt-2 max-w-2xl mx-auto text-lg">
                            Experience the future of medical diagnostics and care with our latest features.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Feature 1: Voice AI - Links to Patient Dashboard (AI Tab) */}
                        <Link to="/patient/dashboard" className="glass-card p-8 rounded-2xl border border-white/20 hover:shadow-xl transition-all group block text-left relative overflow-hidden" style={{ textDecoration: 'none' }}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-purple-500/20"></div>

                            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform shadow-sm">
                                <Activity size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-gray-800">Voice-Activated AI</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Trouble typing? Just <b>speak</b> to our AI Assistant to describe symptoms or ask for advice. Accessible healthcare for everyone.
                            </p>
                        </Link>

                        {/* Feature 2: Food as Medicine - Links to Lab Dashboard */}
                        <Link to="/patient/dashboard" className="glass-card p-8 rounded-2xl border border-white/20 hover:shadow-xl transition-all group block text-left relative overflow-hidden" style={{ textDecoration: 'none' }}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-green-500/20"></div>

                            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-6 group-hover:scale-110 transition-transform shadow-sm">
                                <Utensils size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-gray-800">Food as Medicine</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Don't just treat the illness. Our AI analyzes your <b>Lab Reports</b> to generate personalized 7-day diet plans for recovery.
                            </p>
                        </Link>

                        {/* Feature 3: Secure Payments - Links to Diagnostics */}
                        <Link to="/diagnostics" className="glass-card p-8 rounded-2xl border border-white/20 hover:shadow-xl transition-all group block text-left relative overflow-hidden" style={{ textDecoration: 'none' }}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-blue-500/20"></div>

                            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform shadow-sm">
                                <ShieldCheck size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-gray-800">Secure Payments</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Book lab tests with confidence using our new <b>Razorpay</b> integration. Supports UPI, Cards, and NetBanking with instant refunds.
                            </p>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats Bar moved to bottom */}

            {/* How It Works */}
            <section style={{ padding: '6rem 0', background: 'linear-gradient(to right, #f0f9ff, #e0f2fe)' }}>
                <div className="container">
                    <div className="section-title">
                        <h2>How DocOn Works</h2>
                        <p>Simple steps to get the care you deserve. No waiting rooms, no hassle.</p>
                    </div>

                    <div className="flex justify-between gap-8" style={{ flexWrap: 'wrap' }}>
                        {[
                            { icon: UserPlus, title: '1. Create Account', desc: 'Sign up for free and verify your profile.' },
                            { icon: Search, title: '2. Choose Specialist', desc: 'Browse verified doctors by specialty & rating.' },
                            { icon: Clock, title: '3. Book Appointment', desc: 'Select a time slot that works for you.' },
                            { icon: CheckCircle, title: '4. Get Treated', desc: 'Consult and receive prescriptions instantly.' }
                        ].map((step, index) => (
                            <div key={index} className="flex-1 text-center" style={{ minWidth: '200px' }}>
                                <div style={{
                                    width: '64px', height: '64px', background: 'var(--background)',
                                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 1.5rem', color: 'var(--secondary)'
                                }}>
                                    <step.icon size={32} />
                                </div>
                                <h3 className="text-xl mb-2">{step.title}</h3>
                                <p className="text-gray text-sm">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Specialties Grid */}
            <section style={{ padding: '6rem 0' }}>
                <div className="container">
                    <div className="section-title">
                        <h2>Top Specialties</h2>
                        <p>Find experts across a wide range of medical fields.</p>
                    </div>

                    <div className="specialties-grid">
                        {visibleSpecialties.length > 0 ? visibleSpecialties.map((item) => {
                            const info = getSpecialtyInfo(item);
                            return (
                                <Link
                                    key={item}
                                    to={`/search-doctors?search=${encodeURIComponent(item)}`}
                                    className="specialty-card group"
                                    style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                    title={info.desc}
                                >
                                    <div style={{
                                        width: '80px', height: '80px', borderRadius: '50%', background: info.color,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem',
                                        transition: 'transform 0.2s',
                                    }} className="group-hover:scale-110">
                                        <info.icon size={40} color={info.iconColor} />
                                    </div>
                                    <div className="specialty-name" style={{ fontWeight: '600', fontSize: '1.1rem' }}>{item}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>{info.subtitle}</div>
                                </Link>
                            );
                        }) : (
                            <p className="text-center w-full text-gray">Loading specialties...</p>
                        )}
                    </div>

                    <div className="text-center mt-8">
                        {specialties.length > INITIAL_LIMIT && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="btn btn-secondary"
                                style={{ padding: '0.75rem 2rem', fontSize: '1rem', cursor: 'pointer' }}
                            >
                                {isExpanded ? 'Show Less' : 'View More Specialties'}
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* Stats Bar - Dynamic Realtime Data */}
            <StatsCounter />
        </div>
    );
};

export default Home;

