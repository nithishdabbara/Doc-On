import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const SmartSymptomChecker = () => {
    const [symptoms, setSymptoms] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const checkSymptoms = async () => {
        if (!symptoms.trim()) return;
        setLoading(true);
        try {
            const res = await api.post('/users/analyze-symptoms', { symptoms });
            setResult(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleBook = () => {
        if (!result) return;
        // Navigate to booking with pre-filled search
        navigate(`/book-appointment?search=${result.rawSpecialty}`);
    };

    return (
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50">
            <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                🤖 AI Symptom Checker
            </h3>

            {!result ? (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Describe your symptoms</label>
                        <textarea
                            className="w-full glass-input p-3 rounded-lg border focus:ring-2 focus:ring-purple-500 outline-none"
                            rows="3"
                            placeholder="e.g. I have a severe headache and fever..."
                            value={symptoms}
                            onChange={(e) => setSymptoms(e.target.value)}
                        ></textarea>
                    </div>
                    <button
                        onClick={checkSymptoms}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-bold hover:shadow-lg transition transform hover:-translate-y-0.5 disabled:opacity-50"
                    >
                        {loading ? 'Analyzing...' : 'Analyze Symptoms'}
                    </button>
                    <p className="text-xs text-gray-500 text-center">
                        *AI estimation only. Not a medical diagnosis.
                    </p>
                </div>
            ) : (
                <div className="space-y-4 animate-fade-in">
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                        <p className="text-sm text-purple-600 font-semibold mb-1">Possible Cause:</p>
                        <p className="text-lg font-bold text-purple-900">{result.diagnosis}</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <p className="text-sm text-gray-600">Recommended Specialist:</p>
                        <div className="font-bold text-indigo-700 bg-indigo-50 px-3 py-2 rounded">
                            👨‍⚕️ {result.specialty}
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={handleBook}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                        >
                            📅 Book {result.specialty} Now
                        </button>
                        <button
                            onClick={() => { setResult(null); setSymptoms(''); }}
                            className="w-full mt-2 text-gray-500 text-sm hover:underline"
                        >
                            Check Another Symptom
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmartSymptomChecker;
