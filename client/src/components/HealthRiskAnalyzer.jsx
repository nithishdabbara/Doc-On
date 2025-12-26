import { useState } from 'react';

const HealthRiskAnalyzer = () => {
    const [formData, setFormData] = useState({
        age: '',
        gender: 'male',
        weight: '', // kg
        height: '', // cm
        smoker: 'no',
        activity: 'moderate', // sedentary, moderate, active
        familyHistory: 'no'
    });

    const [result, setResult] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const calculateRisk = (e) => {
        e.preventDefault();
        const { age, weight, height, smoker, activity, familyHistory } = formData;

        // 1. Calculate BMI
        const heightM = height / 100;
        const bmi = (weight / (heightM * heightM)).toFixed(1);

        // 2. Heart Risk Score (Simple Heuristic)
        let heartScore = 0;
        if (age > 45) heartScore += 2;
        if (smoker === 'yes') heartScore += 3;
        if (activity === 'sedentary') heartScore += 2;
        if (bmi > 25) heartScore += 1;
        if (bmi > 30) heartScore += 2;

        let heartRisk = 'Low';
        if (heartScore >= 3) heartRisk = 'Moderate';
        if (heartScore >= 6) heartRisk = 'High';

        // 3. Diabetes Prediction (Simple Heuristic)
        let diabetesScore = 0;
        if (age > 45) diabetesScore += 2;
        if (bmi > 25) diabetesScore += 2;
        if (familyHistory === 'yes') diabetesScore += 3;
        if (activity === 'sedentary') diabetesScore += 1;

        let diabetesRisk = 'Low';
        if (diabetesScore >= 3) diabetesRisk = 'Moderate';
        if (diabetesScore >= 5) diabetesRisk = 'High';

        setResult({
            bmi,
            heartRisk,
            diabetesRisk,
            heartScore,
            diabetesScore
        });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-blue-900 border-b pb-2">🔮 AI Health Predictor</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Input Form */}
                <form onSubmit={calculateRisk} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700">Age</label>
                            <input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full p-2 border rounded" required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700">Gender</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-2 border rounded">
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700">Weight (kg)</label>
                            <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="w-full p-2 border rounded" required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700">Height (cm)</label>
                            <input type="number" name="height" value={formData.height} onChange={handleChange} className="w-full p-2 border rounded" required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700">Do you smoke?</label>
                        <select name="smoker" value={formData.smoker} onChange={handleChange} className="w-full p-2 border rounded">
                            <option value="no">No</option>
                            <option value="yes">Yes</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700">Physical Activity</label>
                        <select name="activity" value={formData.activity} onChange={handleChange} className="w-full p-2 border rounded">
                            <option value="sedentary">Sedentary (Little/No exercise)</option>
                            <option value="moderate">Moderate (1-3 times/week)</option>
                            <option value="active">Active (Daily exercise)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700">Family History of Diabetes?</label>
                        <select name="familyHistory" value={formData.familyHistory} onChange={handleChange} className="w-full p-2 border rounded">
                            <option value="no">No</option>
                            <option value="yes">Yes</option>
                        </select>
                    </div>

                    <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 rounded hover:opacity-90 transition">
                        Analyze Risks
                    </button>
                </form>

                {/* Results Display */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    {!result ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <span className="text-4xl mb-2">📊</span>
                            <p>Enter your details to generate report</p>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center">
                                <h3 className="text-gray-500 uppercase text-xs font-bold">Your BMI</h3>
                                <p className={`text-4xl font-bold ${result.bmi > 25 ? 'text-orange-500' : 'text-green-500'}`}>
                                    {result.bmi}
                                </p>
                                <p className="text-sm text-gray-600">{result.bmi > 25 ? 'Overweight' : 'Normal Weight'}</p>
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-gray-700">❤️ Heart Disease Risk</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.heartRisk === 'High' ? 'bg-red-100 text-red-700' :
                                            result.heartRisk === 'Moderate' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                        {result.heartRisk}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div className={`h-2.5 rounded-full ${result.heartRisk === 'High' ? 'bg-red-500 w-3/4' :
                                            result.heartRisk === 'Moderate' ? 'bg-yellow-500 w-1/2' : 'bg-green-500 w-1/4'
                                        }`}></div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-gray-700">🩸 Diabetes Risk</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.diabetesRisk === 'High' ? 'bg-red-100 text-red-700' :
                                            result.diabetesRisk === 'Moderate' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                        {result.diabetesRisk}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div className={`h-2.5 rounded-full ${result.diabetesRisk === 'High' ? 'bg-red-500 w-3/4' :
                                            result.diabetesRisk === 'Moderate' ? 'bg-yellow-500 w-1/2' : 'bg-green-500 w-1/4'
                                        }`}></div>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mt-4">
                                💡 <strong>Tip:</strong> {result.heartRisk === 'High' ? 'Please consult a Cardiologist.' : 'Keep up the healthy lifestyle!'}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HealthRiskAnalyzer;
