import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SmartSymptomChecker = () => {
    const [symptom, setSymptom] = useState('');
    const [advice, setAdvice] = useState(null); // { type: 'care' | 'emergency', text: '', specialty: '' }
    const navigate = useNavigate();

    const KNOWLEDGE_BASE = [
        {
            keywords: ['chest', 'heart', 'pain', 'attack', 'pressure'], specialty: 'Cardiologist', urgency: 'critical',
            advice: '⚠️ CRITICAL WARNING: Severe chest pain, pressure, or shortness of breath may indicate a heart attack. Call Emergency Services immediately. Do not drive yourself. Chew an aspirin if not allergic while waiting.'
        },
        {
            keywords: ['headache', 'migraine', 'head', 'dizzy'], specialty: 'Neurologist', urgency: 'normal',
            advice: '🏠 Home Care: Rest in a dark, quiet room. Drink plenty of water to rule out dehydration. If the headache is sudden, severe ("thunderclap"), or follows a head injury, seek emergency care.'
        },
        {
            keywords: ['skin', 'rash', 'itch', 'spots', 'acne', 'hives'], specialty: 'Dermatologist', urgency: 'low',
            advice: '🏠 Home Care: Avoid scratching to prevent infection. Apply a cool compress or Calamine lotion/Aloe Vera. Take an over-the-counter antihistamine (like Zyrtec/Claritin) if it itches.'
        },
        {
            keywords: ['fever', 'hot', 'temperature', 'shiver'], specialty: 'General Physician', urgency: 'high',
            advice: '🏠 Home Care: Stay hydrated. Rest. Use acetaminophen (Tylenol) to lower fever. Seek help if fever exceeds 103°F (39.4°C) or lasts more than 3 days.'
        },
        {
            keywords: ['child', 'baby', 'infant', 'kid'], specialty: 'Pediatrician', urgency: 'high',
            advice: '👶 Pediatric Alert: For infants < 3 months with fever, go to ER immediately. For older children, keep hydrated and monitor activity levels.'
        },
        {
            keywords: ['stomach', 'belly', 'vomit', 'diarrhea', 'nausea', 'gas'], specialty: 'General Physician', urgency: 'normal',
            advice: '🏠 Home Care: Stick to the BRAT diet (Bananas, Rice, Applesauce, Toast). Sip electrolytes (Pedialyte/Gatorade) to prevent dehydration. Avoid dairy and spicy foods.'
        },
        {
            keywords: ['muscle', 'bone', 'joint', 'ankle', 'knee', 'back', 'sprain', 'fracture'], specialty: 'Orthopedist', urgency: 'normal',
            advice: '🏠 Home Care: Follow R.I.C.E protocol: Rest, Ice (20 mins), Compression, and Elevation. If you cannot bear weight or the limb is deformed, go to ER/Urgent Care.'
        },
        {
            keywords: ['cold', 'cough', 'flu', 'throat', 'sneeze', 'nose', 'congestion'], specialty: 'General Physician', urgency: 'normal',
            advice: '🏠 Home Care: Rest and plenty of fluids. Honey and warm water for cough. Gargle salt water for sore throat. Monitor for difficulty breathing.'
        },
        {
            keywords: ['tooth', 'gum', 'jaw', 'dental'], specialty: 'Dentist', urgency: 'normal',
            advice: '🏠 Home Care: Rinse with warm salt water. Use clove oil for temporary pain relief. Avoid very hot or cold foods.'
        },
        {
            keywords: ['eye', 'vision', 'blur', 'red'], specialty: 'Ophthalmologist', urgency: 'normal',
            advice: '🏠 Home Care: Do not rub your eyes. If chemical exposure, flush with water for 15 mins immediately. Rest your eyes from screens.'
        },
        {
            keywords: ['anxiety', 'sad', 'depress', 'panic', 'stress'], specialty: 'Psychiatrist', urgency: 'low',
            advice: '🧘 Self Care: Practice deep breathing (4-7-8 technique). Reach out to a trusted friend or family member. Remember, you are not alone.'
        }
    ];

    const handleCheck = (e) => {
        e.preventDefault();
        if (!symptom) return;

        const lowerSymptom = symptom.toLowerCase();

        // AI-Lite Matching Logic
        const match = KNOWLEDGE_BASE.find(entry =>
            entry.keywords.some(k => lowerSymptom.includes(k))
        );

        if (match) {
            setAdvice({
                type: match.urgency === 'critical' ? 'emergency' : 'care',
                text: match.advice,
                specialty: match.specialty,
                urgency: match.urgency
            });
        } else {
            // No specific advice matched, fall back to search
            navigate(`/book-appointment?search=${symptom}`);
        }
    };

    const handleBook = () => {
        if (advice) {
            navigate(`/book-appointment?specialty=${advice.specialty}&urgency=${advice.urgency}`);
        }
    };

    const reset = () => {
        setSymptom('');
        setAdvice(null);
    };

    return (
        <div className={`p-6 rounded-lg shadow-sm border mb-6 transition-all duration-300 ${advice?.type === 'emergency' ? 'bg-red-50 border-red-200' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'}`}>
            <h3 className={`text-lg font-bold mb-2 flex items-center gap-2 ${advice?.type === 'emergency' ? 'text-red-700' : 'text-indigo-900'}`}>
                {advice ? (advice.type === 'emergency' ? '🚨 Emergency Systems Alert' : '🩺 AI Advice') : '🤖 AI Health Assistant'}
            </h3>

            {!advice ? (
                <>
                    <p className="text-sm text-gray-600 mb-4">Describe your symptoms (e.g., "bad headache", "chest pain", "skin rash") for instant advice & specialist matching.</p>
                    <form onSubmit={handleCheck} className="flex gap-2">
                        <input
                            type="text"
                            value={symptom}
                            onChange={(e) => setSymptom(e.target.value)}
                            placeholder="Type symptoms here..."
                            className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-indigo-300 outline-none"
                        />
                        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">
                            Analyze
                        </button>
                    </form>
                </>
            ) : (
                <div className="space-y-4">
                    <div className={`p-4 rounded-md ${advice.type === 'emergency' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-white text-gray-700 border border-indigo-100'}`}>
                        <p className="font-medium text-lg mb-2">{advice.text}</p>
                        <p className="text-sm opacity-80">Recommended Specialist: <span className="font-bold">{advice.specialty}</span></p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleBook}
                            className={`flex-1 px-4 py-2 rounded-md font-semibold text-white shadow transition-transform transform active:scale-95 ${advice.type === 'emergency' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                            Book {advice.specialty}
                        </button>
                        <button
                            onClick={reset}
                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
                        >
                            Back
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmartSymptomChecker;
