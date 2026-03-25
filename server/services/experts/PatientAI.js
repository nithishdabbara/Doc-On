const axios = require('axios');

class PatientAI {
    constructor(aiService) {
        this.aiService = aiService; // Access to shared Ollama/Cloud methods
    }

    async analyze(prompt, context) {
        // Delegate completely to the robust Cloud AI Service (Gemini/Groq)
        // This ensures the "Friendly" System Prompt in AIService is used.
        try {
            return await this.aiService.analyzeText(prompt, context || 'patient_education');
        } catch (err) {
            console.error("PatientAI Error:", err.message);
            return this.aiService.expertSystemFallback(prompt);
        }
    }
}

module.exports = PatientAI;
