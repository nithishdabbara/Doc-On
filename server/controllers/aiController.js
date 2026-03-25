const AIService = require('../services/AIService');
const pdfParse = require('pdf-parse');

const aiController = {
    analyze: async (req, res) => {
        try {
            const { query, context } = req.body;
            const file = req.file;
            const userType = req.user.type; // 'patient', 'doctor', 'lab', 'admin'

            console.log(`[AI Controller] Request from ${userType}: ${query} (File: ${file ? 'Yes' : 'No'})`);

            let responseText = "";

            // 1. Construct System Prompt based on Role
            let rolePrompt = "";
            if (userType === 'doctor') {
                rolePrompt = "You are an advanced medical AI assistant for a Doctor. Use professional clinical terminology. Provide differential diagnoses, treatment guidelines, and risk assessments.";
            } else if (userType === 'patient') {
                rolePrompt = "You are a helpful medical guide for a Patient. Explain medical concepts in simple, easy-to-understand language. Focus on precautions, home care, and when to see a doctor. Do not provide definitive diagnoses, but suggest possibilities.";
            } else if (userType === 'lab') {
                rolePrompt = "You are an assistant for a Lab Technician. Analyze the data for anomalies, standard deviations, and quality control. Extract validation metrics.";
            } else if (userType === 'admin') {
                rolePrompt = "You are an administrative assistant. Focus on operational efficiency, scheduling, and system feedback analysis.";
            }

            const fullPrompt = `${rolePrompt}\n\nUser Query: ${query || "Analyze this."}`;

            // 2. Multimodal Analysis (Image + Text)
            if (file) {
                // Check if it's an image
                if (file.mimetype.startsWith('image/')) {
                    console.log("[AI Controller] Processing Image via Vision...");
                    responseText = await AIService.analyzeImage(file.buffer, file.mimetype, fullPrompt);
                }
                // PDF Support
                else if (file.mimetype === 'application/pdf') {
                    console.log("[AI Controller] Processing PDF...");
                    const pdfData = await pdfParse(file.buffer);
                    const pdfText = pdfData.text.substring(0, 3000); // Limit context
                    const pdfPrompt = `${fullPrompt}\n\nAnalyzed Report Content:\n${pdfText}`;
                    const result = await AIService.analyzeText(pdfPrompt, 'clinical_support');
                    responseText = result.summary;
                }
                else {
                    return res.status(400).json({ message: "Unsupported file type. Please upload Image or PDF." });
                }
            }
            // 3. Text-Only Analysis
            else {
                console.log("[AI Controller] Processing Text...");

                // Hybrid Logic: 
                // PATIENTS doing Symptom Checks need structure (Specializations, Precautions).
                // DOCTORS/OTHERS need professional free-text summaries.

                // 1. Check for Nutrition/Diet Context
                const nutritionContext = AIService.detectNutritionContext(query);

                if (nutritionContext) {
                    console.log(`[AI Controller] Nutrition Context Detected: ${nutritionContext}`);
                    const result = await AIService.analyzeText(fullPrompt, `nutrition_${nutritionContext}`);
                    responseText = result.summary;
                }
                // 2. Patient Symptom Check
                else if (userType === 'patient' && (!context || context === 'symptom_check' || context === 'chat')) {
                    const analysis = await AIService.analyzeText(query, context);

                    if (!analysis) {
                        return res.status(503).json({
                            success: false,
                            message: "AI Service Unresponsive."
                        });
                    }

                    return res.json({
                        success: true,
                        message: analysis.summary,
                        specializations: [analysis.spec],
                        precautions: analysis.precautions,
                        urgency: analysis.urgency,
                        suggestions: analysis.rx,
                        roleContext: userType
                    });
                } else {
                    // 3. General / Doctor / Admin
                    const result = await AIService.analyzeText(fullPrompt, context || 'general');
                    responseText = result.summary;
                }

                // Fallback attempt if null
                if (!responseText) {
                    const fallback = await AIService.expertSystemFallback(query);
                    responseText = fallback.summary;
                }
            }

            if (!responseText) {
                return res.status(500).json({ message: "AI failed to generate a response." });
            }

            // 4. Structure Response (Generic)
            res.json({
                success: true,
                message: responseText,
                roleContext: userType
            });

        } catch (err) {
            console.error("[AI Controller] Error:", err);
            res.status(500).json({ message: "Internal Server Error during AI Analysis" });
        }
    }
};

module.exports = aiController;
