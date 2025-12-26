import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const Landing = () => {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/dashboard" />;
    }

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900">
            <Navbar />

            {/* --- HERO SECTION --- */}
            <header className="relative overflow-hidden pt-16 pb-32 lg:pt-32 lg:pb-48 bg-gradient-to-b from-blue-50 to-white">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        {/* Text Content */}
                        <div className="w-full lg:w-1/2 text-center lg:text-left animate-fade-in-up">
                            <div className="inline-block bg-blue-100 text-blue-700 font-bold px-4 py-1.5 rounded-full text-sm mb-6 uppercase tracking-wider shadow-sm">
                                🚀 The Future of Healthcare
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 leading-tight mb-6">
                                Your Handle on <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                    Better Health.
                                </span>
                            </h1>
                            <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                Book appointments with top specialists, manage your medical records securely, and monitor your health vitals — all in one seamless platform.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Link to="/register" className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                                    Get Started Now
                                </Link>
                                <Link to="/login" className="px-8 py-4 bg-white text-gray-700 font-bold rounded-xl text-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 flex items-center justify-center gap-2">
                                    <span>Member Login</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                </Link>
                            </div>
                            <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-gray-500 font-medium">
                                <span className="flex items-center gap-1"><span className="text-green-500">✓</span> No credit card required</span>
                                <span className="flex items-center gap-1"><span className="text-green-500">✓</span> HIPAA Complicant</span>
                            </div>
                        </div>

                        {/* Hero Image */}
                        <div className="w-full lg:w-1/2 relative animate-fade-in">
                            <div className="absolute -top-10 -right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                            <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                            <img
                                src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=2600"
                                alt="Doctor Dashboard"
                                className="relative rounded-2xl shadow-2xl border-4 border-white transform hover:rotate-1 transition duration-500"
                            />
                            {/* Floating Stats Card - Decoration */}
                            <div className="absolute bottom-10 -left-6 bg-white p-4 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3 animate-float hidden md:flex">
                                <div className="bg-green-100 p-3 rounded-full text-green-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase">System Status</p>
                                    <p className="text-sm font-bold text-gray-900">100% Secure</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- FEATURES SECTION --- */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="text-blue-600 font-bold tracking-widest uppercase text-sm">Features</span>
                        <h2 className="text-4xl font-extrabold text-gray-900 mt-2 mb-4">Everything you need.</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">We've simplified the entire healthcare experience, putting power back into the hands of patients and doctors.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="p-8 rounded-3xl bg-blue-50 hover:bg-blue-100 transition duration-300">
                            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-300">
                                <span className="text-2xl">🗓️</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Scheduling</h3>
                            <p className="text-gray-600">Book appointments instantly. Our smart algorithm matches you with the best available doctors based on your needs.</p>
                        </div>
                        {/* Feature 2 */}
                        <div className="p-8 rounded-3xl bg-purple-50 hover:bg-purple-100 transition duration-300">
                            <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg shadow-purple-300">
                                <span className="text-2xl">🔒</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Secure Records</h3>
                            <p className="text-gray-600">Your medical history is encrypted and safe. Access your prescriptions, lab reports, and vitals anytime, anywhere.</p>
                        </div>
                        {/* Feature 3 */}
                        <div className="p-8 rounded-3xl bg-green-50 hover:bg-green-100 transition duration-300">
                            <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg shadow-green-300">
                                <span className="text-2xl">🤖</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">AI Health Assistant</h3>
                            <p className="text-gray-600">Not feeling well? Use our AI Symptom Checker to get instant guidance on whether you should see a doctor.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- HEALTH BIO / AWARENESS SECTION --- */}
            <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="w-full lg:w-1/2">
                            <img
                                src="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=2600"
                                alt="Healthy Lifestyle"
                                className="rounded-3xl shadow-2xl border-4 border-gray-700 hover:scale-[1.02] transition duration-500"
                            />
                        </div>
                        <div className="w-full lg:w-1/2">
                            <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight">
                                Why Regular Health <br /><span className="text-blue-400">Checkups Matter?</span>
                            </h2>
                            <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                                Preventative care is the key to a long, healthy life. Regular screenings can detect problems before they start, when your chances for treatment and cure are better.
                            </p>
                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">1</div>
                                    <p className="font-semibold text-gray-200">Early detection of life-threatening diseases.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">2</div>
                                    <p className="font-semibold text-gray-200">Monitor current health conditions effectively.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">3</div>
                                    <p className="font-semibold text-gray-200">Lower overall healthcare costs over time.</p>
                                </div>
                            </div>
                            <Link to="/register" className="inline-block bg-white text-gray-900 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
                                Start Your Journey Today
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="bg-gray-50 border-t border-gray-200 py-12">
                <div className="container mx-auto px-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="bg-blue-600 text-white p-1.5 rounded-lg font-bold text-xl">⚡</div>
                        <span className="text-2xl font-bold text-gray-800 tracking-tight">DocOn.</span>
                    </div>
                    <p className="text-gray-500 mb-8">Making healthcare accessible, affordable, and smart for everyone.</p>
                    <div className="text-sm text-gray-400">
                        &copy; {new Date().getFullYear()} DocOn Healthcare. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
