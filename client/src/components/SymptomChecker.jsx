import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronLeft, RefreshCw, X, Search, RotateCcw, List as ListIcon } from 'lucide-react';
import { SYMPTOM_DB, CONDITIONS_DB } from '../data/symptomsData';



const SymptomChecker = () => {
    const [step, setStep] = useState('SYMPTOMS'); // SYMPTOMS, CONDITIONS, DETAILS

    const [mySymptoms, setMySymptoms] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCondition, setSelectedCondition] = useState(null);

    const [activeTab, setActiveTab] = useState('DETAILS');
    const [feedback, setFeedback] = useState(null); // DETAILS, TREATMENT

    // Filter Logic
    const getMatchedConditions = () => {
        if (mySymptoms.length === 0) return [];

        return CONDITIONS_DB.map(cond => {
            const matchCount = cond.symptoms.filter(s => mySymptoms.some(ms => ms.toLowerCase() === s.toLowerCase())).length;
            // Determine match label dynamically
            let matchLabel = "Low";
            if (matchCount >= 3) matchLabel = "High";
            else if (matchCount >= 2) matchLabel = "Moderate";
            else if (matchCount === 1) matchLabel = "Fair";

            return { ...cond, matchScore: matchCount, match: matchLabel };
        })
            .filter(c => c.matchScore > 0)
            .sort((a, b) => b.matchScore - a.matchScore);
    };

    const handleAddSymptom = (sym) => {
        if (!mySymptoms.includes(sym)) {
            setMySymptoms([...mySymptoms, sym]);
        }
    };

    const handleRemoveSymptom = (sym) => {
        setMySymptoms(mySymptoms.filter(s => s !== sym));
    };



    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden font-sans text-gray-700">
            {/* Header / Tabs */}
            <div className="bg-gray-100 border-b border-gray-200">
                <div className="flex text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wide">
                    {['INFO', 'SYMPTOMS', 'CONDITIONS', 'DETAILS', 'TREATMENT'].map((tab) => {
                        let active = false;
                        if (tab === 'SYMPTOMS' && step === 'SYMPTOMS') active = true;
                        if (tab === 'CONDITIONS' && step === 'CONDITIONS') active = true;
                        if (tab === 'DETAILS' && step === 'DETAILS') active = true;

                        return (
                            <div
                                key={tab}
                                className={`flex-1 py-4 text-center cursor-default transition-colors relative
                                    ${active ? 'bg-white text-teal-600 border-t-4 border-t-teal-500' : 'hover:bg-gray-50'}
                                    ${step !== tab && !['INFO', 'SYMPTOMS', 'CONDITIONS', 'DETAILS'].includes(tab) ? 'opacity-50' : ''}
                                `}
                            >
                                {tab}
                                {active && <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white"></div>} {/* Hide bottom border */}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="p-6 min-h-[600px] flex flex-col">
                {/* ---------------- SYMPTOMS SCREEN ---------------- */}
                {step === 'SYMPTOMS' && (
                    <div className="flex flex-col gap-8 h-full">
                        {/* Search & My Symptoms Bar */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h1 className="text-2xl font-light text-gray-800 mb-2">What are your symptoms?</h1>
                                <p className="text-sm text-gray-500 mb-4">Search or select common symptoms below.</p>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 pl-10 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all text-gray-700 placeholder-gray-400"
                                        placeholder="Type a symptom (e.g. Headache, Fever...)"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                    {searchTerm && (
                                        <div className="absolute top-full left-0 w-full bg-white border border-gray-100 shadow-xl rounded-xl mt-2 z-20 max-h-64 overflow-y-auto">
                                            {/* Search across ALL categories */}
                                            {Object.values(SYMPTOM_DB).flat().filter(s => s.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                                                <div
                                                    key={s}
                                                    className="p-3 hover:bg-teal-50 cursor-pointer text-sm font-medium text-gray-700 border-b border-gray-50 last:border-0"
                                                    onClick={() => { handleAddSymptom(s); setSearchTerm(''); }}
                                                >
                                                    {s}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Active Symptoms Tags */}
                            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm min-h-[100px] hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Selected Symptoms</h3>
                                    {mySymptoms.length > 0 && (
                                        <button onClick={() => setMySymptoms([])} className="text-xs text-red-400 hover:text-red-600 font-medium">Clear All</button>
                                    )}
                                </div>

                                {mySymptoms.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-300 pb-4">
                                        <span className="text-sm italic">No symptoms selected yet</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {mySymptoms.map(sym => (
                                            <div key={sym} className="flex items-center bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full text-sm font-bold border border-teal-100 animate-fade-in">
                                                {sym}
                                                <button onClick={() => handleRemoveSymptom(sym)} className="ml-2 text-teal-400 hover:text-teal-600 bg-teal-100/50 rounded-full p-0.5">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top / Common Symptoms (Replaces Categories) */}
                        <div className="mt-4">
                            <h2 className="text-lg font-bold text-gray-700 mb-4">Common Symptoms</h2>
                            <div className="flex flex-wrap gap-3">
                                {["Headache", "Fever", "Cough", "Nausea", "Fatigue / Weakness", "Sore Throat", "Back Pain", "Dizziness", "Stomach Ache", "Rash"].map(sym => (
                                    <button
                                        key={sym}
                                        onClick={() => handleAddSymptom(sym)}
                                        className={`
                                            px-4 py-2 rounded-full border text-sm font-bold transition-all
                                            ${mySymptoms.includes(sym)
                                                ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-teal-400 hover:bg-teal-50'
                                            }
                                        `}
                                    >
                                        {mySymptoms.includes(sym) ? '✓ ' : '+ '}{sym}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ---------------- CONDITIONS SCREEN ---------------- */}
                {step === 'CONDITIONS' && (
                    <div className="flex flex-col h-full animate-fade-in">
                        <h2 className="text-lg font-bold text-gray-700 mb-2">Conditions that match your symptoms</h2>
                        <span className="text-xs font-bold text-teal-600 uppercase tracking-wide mb-6">Understanding Your Results ⓘ</span>

                        <div className="flex gap-8">
                            {/* List */}
                            <div className="flex-1 space-y-3">
                                {getMatchedConditions().map((cond) => (
                                    <div
                                        key={cond.name}
                                        className={`group border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all flex justify-between items-center ${selectedCondition?.name === cond.name ? 'border-l-4 border-l-teal-500 bg-teal-50' : 'bg-white border-gray-200'}`}
                                        onClick={() => { setSelectedCondition(cond); setStep('DETAILS'); }}
                                    >
                                        <div>
                                            <h3 className="font-bold text-teal-800 text-lg group-hover:text-teal-600 mb-1">{cond.name}</h3>

                                            {/* Match Bar */}
                                            <div className="flex items-center gap-2">
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4].map(w => (
                                                        <div key={w} className={`h-2 w-6 rounded-sm ${w <= cond.matchLevel ? 'bg-teal-500' : 'bg-gray-200'}`}></div>
                                                    ))}
                                                </div>
                                                <span className="text-xs text-gray-500 font-medium">{cond.match} match</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-gray-300 group-hover:text-teal-500" />
                                    </div>
                                ))}

                                {getMatchedConditions().length === 0 && (
                                    <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                                        No exact matches found. Try adding more symptoms.
                                    </div>
                                )}
                            </div>

                            {/* Sidebar Info */}
                            <div className="w-80 border-l pl-8 hidden md:block">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-8 text-sm">
                                        <span className="text-gray-500">Gender <strong>Male</strong></span>
                                        <span className="text-gray-500">Age <strong>30</strong></span>
                                        <span className="text-teal-600 font-bold cursor-pointer hover:underline text-xs">Edit</span>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-bold text-gray-700">My Symptoms</h4>
                                            <span className="text-teal-600 font-bold cursor-pointer hover:underline text-xs" onClick={() => setStep('SYMPTOMS')}>Edit</span>
                                        </div>
                                        <div className="space-y-1">
                                            {mySymptoms.map(s => (
                                                <div key={s} className="text-sm text-gray-800 font-medium border-b py-1">{s}</div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => { setMySymptoms([]); setStep('SYMPTOMS'); }}
                                        className="w-full py-2 border border-gray-300 rounded text-gray-600 text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-50 bg-white shadow-sm"
                                    >
                                        <RefreshCw size={14} /> Start Over
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* ---------------- DETAILS SCREEN ---------------- */}
                // --- VIEW: CONDITION DETAILS & TREATMENT ---
                {step === 'DETAILS' && selectedCondition && (
                    <div className="flex flex-col md:flex-row gap-6 mt-6">
                        {/* Left: Matched List */}
                        <div className="w-full md:w-1/3 border-r pr-4 hidden md:block">
                            <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase">Conditions that match your symptoms</h3>
                            <div className="space-y-3">
                                {matchedConditions.map(c => (
                                    <div
                                        key={c.name}
                                        onClick={() => { setSelectedCondition(c); setFeedback(null); }}
                                        className={`p-4 border rounded cursor-pointer transition-all ${selectedCondition.name === c.name ? 'bg-teal-50 border-teal-500 shadow-sm' : 'hover:bg-gray-50'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <h4 className={`font-bold ${selectedCondition.name === c.name ? 'text-teal-700' : 'text-gray-800'}`}>{c.name}</h4>
                                            <ChevronRight size={16} className="text-gray-400" />
                                        </div>
                                        <div className="mt-2 flex gap-1">
                                            {Array.from({ length: 4 }).map((_, i) => (
                                                <div key={i} className={`h-1.5 w-6 rounded-full ${i < c.matchLevel ? 'bg-teal-500' : 'bg-gray-200'}`}></div>
                                            ))}
                                        </div>
                                        <span className="text-xs text-gray-500 mt-1 block">{c.matchLevel === 4 ? 'Strong match' : c.matchLevel === 3 ? 'Moderate match' : 'Fair match'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Detailed Content */}
                        <div className="flex-1">
                            <h2 className="text-3xl font-normal text-gray-800 mb-1">{selectedCondition.name}</h2>
                            {selectedCondition.subtitle && <h3 className="text-lg text-gray-600 mb-2 font-medium">{selectedCondition.subtitle}</h3>}
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-6">Medical Condition</p>

                            {/* Tabs */}
                            <div className="flex gap-8 border-b text-sm font-bold text-gray-500 mb-6">
                                <span
                                    onClick={() => setActiveTab('DETAILS')}
                                    className={`cursor-pointer pb-2 transition-colors ${activeTab === 'DETAILS' ? 'text-teal-600 border-b-2 border-teal-600' : 'hover:text-teal-800'}`}
                                >
                                    CONDITION DETAILS
                                </span>
                                <span
                                    onClick={() => setActiveTab('TREATMENT')}
                                    className={`cursor-pointer pb-2 transition-colors ${activeTab === 'TREATMENT' ? 'text-teal-600 border-b-2 border-teal-600' : 'hover:text-teal-800'}`}
                                >
                                    TREATMENT OPTIONS
                                </span>
                            </div>

                            <div className="space-y-8 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                                {activeTab === 'DETAILS' ? (
                                    <>
                                        <section>
                                            <h3 className="font-bold text-lg text-teal-700 mb-2">Symptoms</h3>
                                            <p className="text-sm leading-relaxed text-gray-700">
                                                The symptoms of {selectedCondition.name} can include {selectedCondition.symptoms.join(', ')}.
                                            </p>
                                        </section>

                                        <section>
                                            <h3 className="font-bold text-lg text-teal-700 mb-2">How Common</h3>
                                            <p className="text-sm leading-relaxed text-gray-700">{selectedCondition.commonality}</p>
                                        </section>

                                        <section>
                                            <h3 className="font-bold text-lg text-teal-700 mb-2">Overview</h3>
                                            <p className="text-sm leading-relaxed text-gray-700">
                                                {selectedCondition.overview}
                                                <a
                                                    href={`https://www.google.com/search?q=${encodeURIComponent(selectedCondition.name + ' medical condition verification')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-teal-600 font-bold ml-2 hover:underline text-xs"
                                                >
                                                    Read more &gt;
                                                </a>
                                            </p>
                                        </section>

                                        <div className="p-6 bg-gray-50 border-t border-b border-gray-100 text-center rounded-lg">
                                            <h4 className="font-bold text-lg text-gray-800 mb-4">Do you think you have this condition?</h4>
                                            {!feedback ? (
                                                <div className="flex justify-center gap-3">
                                                    <button onClick={() => setFeedback('yes')} className="px-8 py-2 bg-teal-100 text-teal-800 rounded font-bold hover:bg-teal-200 transition">Yes</button>
                                                    <button onClick={() => setFeedback('no')} className="px-8 py-2 bg-gray-200 text-gray-700 rounded font-bold hover:bg-gray-300 transition">No</button>
                                                    <button onClick={() => setFeedback('maybe')} className="px-8 py-2 bg-gray-200 text-gray-700 rounded font-bold hover:bg-gray-300 transition">Maybe</button>
                                                </div>
                                            ) : (
                                                <div className="animate-fade-in">
                                                    <p className="text-teal-700 font-bold text-sm">Thank you for your feedback!</p>
                                                    <p className="text-gray-500 text-xs mt-1">We've recorded your response to help improve our accuracy.</p>
                                                </div>
                                            )}
                                        </div>

                                        <section>
                                            <h3 className="font-bold text-lg text-teal-700 mb-2">Risk Factors</h3>
                                            <p className="text-sm text-gray-600 mb-2">You may be at risk for {selectedCondition.name.toLowerCase()} if you:</p>
                                            <ul className="list-disc ml-5 text-sm space-y-1 text-gray-700">
                                                {selectedCondition.riskFactors.map(r => <li key={r}>{r}</li>)}
                                            </ul>
                                        </section>

                                        {selectedCondition.diagnosedBy && (
                                            <section>
                                                <h3 className="font-bold text-lg text-teal-700 mb-2">Diagnosed By</h3>
                                                <p className="text-sm leading-relaxed text-gray-700">{selectedCondition.diagnosedBy}</p>
                                            </section>
                                        )}

                                        {selectedCondition.facts && (
                                            <section className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                                <h3 className="font-bold text-lg text-blue-800 mb-2">Did You Know?</h3>
                                                <ul className="list-disc ml-5 text-sm space-y-1 text-blue-900">
                                                    {selectedCondition.facts.map((f, i) => <li key={i}>{f}</li>)}
                                                </ul>
                                            </section>
                                        )}

                                        <button
                                            onClick={() => setActiveTab('TREATMENT')}
                                            className="w-full bg-teal-600 text-white font-bold py-3 rounded mt-2 hover:bg-teal-700 transition"
                                        >
                                            See Treatment Options &gt;
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <section>
                                            <h3 className="font-bold text-lg text-teal-700 mb-4">Treatment Options</h3>
                                            {selectedCondition.treatmentOptions ? (
                                                <ul className="space-y-3">
                                                    {selectedCondition.treatmentOptions.map((opt, i) => (
                                                        <li key={i} className="flex gap-3 text-sm text-gray-700 p-3 bg-gray-50 rounded border border-gray-100">
                                                            <div className="w-2 h-2 mt-1.5 rounded-full bg-teal-500 flex-shrink-0"></div>
                                                            <span>{opt}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-gray-500 italic">Treatment information is currently being updated for this condition.</p>
                                            )}
                                        </section>

                                        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800 flex items-start gap-3">
                                            <div className="font-bold text-lg">!</div>
                                            <p>Always consult with a healthcare professional before starting any treatment. This information is for educational purposes only.</p>
                                        </div>

                                        <button
                                            onClick={() => setActiveTab('DETAILS')}
                                            className="w-full bg-gray-200 text-gray-700 font-bold py-3 rounded mt-6 hover:bg-gray-300 transition"
                                        >
                                            &lt; Back to Details
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Navigation */}
            <div className="p-4 border-t bg-white flex justify-between items-center">
                <button
                    onClick={() => {
                        if (step === 'DETAILS') setStep('CONDITIONS');
                        if (step === 'CONDITIONS') setStep('SYMPTOMS');
                    }}
                    disabled={step === 'SYMPTOMS'}
                    className="flex items-center gap-2 py-2 px-4 border rounded text-gray-600 font-bold hover:bg-gray-50 disabled:opacity-30"
                >
                    <ChevronLeft size={16} /> Previous
                </button>

                {step === 'SYMPTOMS' && (
                    <button
                        onClick={() => setStep('CONDITIONS')}
                        disabled={mySymptoms.length === 0}
                        className="flex items-center gap-2 py-2 px-6 bg-teal-600 text-white rounded font-bold hover:bg-teal-700 disabled:opacity-50 disabled:bg-gray-400"
                    >
                        Continue <ChevronRight size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default SymptomChecker;

