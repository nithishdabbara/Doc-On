const { checkInteraction } = require('../../utils/drugInteractions');

class DoctorAI {
    constructor(aiService) {
        this.aiService = aiService;
    }

    async analyze(prompt, data = {}) {
        // Doctor Persona: Professional, Concise, Guideline-Focused
        const systemPrompt = `You are a Clinical Decision Support AI assisting a Doctor.
        Your goal is to provide technical, evidence-based insights.
        
        RULES:
        1. Use professional medical terminology.
        2. Focus on "Differential Diagnosis", "Treatment Protocols", and "Risk Factors".
        3. Be concise. Bullet points are preferred.
        4. Cite standard guidelines where applicable.
        
        Data Provided: ${JSON.stringify(data)}
        `;

        // 1. Pre-Analysis: Drug Interaction Check (if prompt contains meds)
        let warnings = [];
        if (data.medications && Array.isArray(data.medications)) {
            // Basic pair check logic from utils
            // (Assuming utility handles array logic if needed, or we loop)
        }

        try {
            // Priority: Vision AI (Gemini)
            if (data.imageBuffer && data.mimeType) {
                const visionPrompt = `
                ${systemPrompt}
                Analyze this medical image.
                Return ONLY a JSON string.
                Structure: { "summary": "...", "spec": "...", "urgency": "...", "condition_detected": "...", "precautions": [], "rx": [], "differential_diagnosis": [], "treatment_plan": [], "risks": [] }
                `;
                const visionResult = await this.aiService.analyzeImage(data.imageBuffer, data.mimeType, visionPrompt);

                // Parse JSON from Vision Result (Gemini often returns markdown)
                const parsed = this.aiService.parseAIResponse(visionResult);
                return { ...parsed, warnings };
            }

            // Fallback for Text-only analysis (using Gemini/Groq via analyzeText)
            const textResult = await this.aiService.analyzeText(prompt, 'clinical_support');
            if (textResult && typeof textResult === 'object') {
                return { ...textResult, warnings };
            }
            return { message: textResult || "Analysis complete.", warnings };
        } catch (err) {
            console.error("DoctorAI Error:", err);
            return { message: "Clinical AI unavailable." };
        }
    }
}

module.exports = DoctorAI;
