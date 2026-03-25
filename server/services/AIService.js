const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getRelatedSpecializations } = require('../utils/symptomMapping');
const NUTRITION_FRAMEWORK = require('../utils/nutritionFramework');

// --- AI TEAM (Experts) ---
const MedlineService = require('./MedlineService');
const FatSecretService = require('./FatSecretService');
const PatientAI = require('./experts/PatientAI');
const DoctorAI = require('./experts/DoctorAI');
const LabAI = require('./experts/LabAI');
const PrescriptionAI = require('./experts/PrescriptionAI');

class AIService {
    constructor() {
        // Orchestrated Team
        this.patientAI = new PatientAI(this);
        this.doctorAI = new DoctorAI(this);
        this.labAI = new LabAI();
        this.prescriptionAI = new PrescriptionAI();
    }

    // --- ORCHESTRATOR ROUTING ---
    async routeRequest(request) {
        // request = { role, prompt, context, data, task, imageBuffer, res }

        if (request.task === 'lab_analysis') {
            return await this.labAI.analyze(request.imageBuffer);
        }

        if (request.task === 'generate_prescription') {
            return this.prescriptionAI.generatePDF(request.data, request.res);
        }

        // Special Context detection for Nutrition (Legacy feature support)
        const nutritionContext = this.detectNutritionContext(request.prompt);
        if (nutritionContext) {
            return await this.analyzeText(request.prompt, `nutrition_${nutritionContext}`);
        }

        if (request.role === 'patient') {
            return await this.patientAI.analyze(request.prompt, request.context);
        }

        if (request.role === 'doctor') {
            const doctorData = {
                ...request.data,
                imageBuffer: request.imageBuffer,
                mimeType: request.mimeType
            };
            return await this.doctorAI.analyze(request.prompt, doctorData);
        }

        // Default / Fallback
        return await this.analyzeText(request.prompt, request.context);
    }

    // --- CORE CAPABILITIES (Gemini + Groq + Medline + FatSecret) ---
    async analyzeText(prompt, context = 'symptom_check') {
        let systemPrompt = this.getSystemPrompt(context);
        let result = null;

        // 0. Context Enhancement: Real Nutrition Data (FatSecret)
        if (prompt.match(/calorie|nutrition|protein|carb|fat|vitamin|diet/i) && prompt.length < 100) {
            try {
                // Attempt to extract the food name (e.g., "calories in an apple" -> "apple")
                const foodQuery = prompt.replace(/(calorie|calories|nutrition|nutritional|values|content|in|of|about|how|many|much|what|is|the|give|me|a|an)/gi, '').trim();

                if (foodQuery.length > 2) {
                    const foodData = await FatSecretService.searchFood(foodQuery);
                    if (foodData) {
                        console.log(`[FatSecret] Found data for: ${foodData.name}`);
                        systemPrompt += `\n\n[VERIFIED NUTRITION DATA]\nFood Item: ${foodData.name}\nData: ${foodData.description}\n(Source: FatSecret Platform API)\n\nINSTRUCTION: You MUST use these exact nutritional values in your response. Do not hallucinate numbers.`;
                    }
                }
            } catch (e) {
                console.log("[AIService] Nutrition lookup skipped:", e.message);
            }
        }

        // 1. Try Gemini (Priority 1: Cloud & Smart)
        try {
            // console.log("Attempting Gemini...");
            result = await this.callGeminiText(prompt, systemPrompt);
        } catch (err) {
            console.error("Gemini failed:", err.message);

            // 2. Try Groq (Priority 2: Meta AI - Llama 3)
            try {
                console.log("Gemini busy. Attempting Groq (Meta AI)...");
                result = await this.callGroqText(prompt, systemPrompt);
            } catch (errGroq) {
                console.error("Groq failed:", errGroq.message);

                // 3. Fallback: System Offline
                console.log('[Orchestrator] All AIs Offline. Using Fallback.');
                result = this.expertSystemFallback(prompt);
            }
        }

        // 4. Enhance: Add Trusted Medical Sources (MedlinePlus)
        // DISABLED: User requested to hide external links to avoid patient confusion.
        /*
        if (result && result.found) {
            try {
                let queryTerm = "";

                // A. If it's a Report Analysis or Long Text -> Use the AI's Findings (Context)
                if (prompt.length > 60 || prompt.toLowerCase().includes('report') || prompt.toLowerCase().includes('analyze')) {
                    queryTerm = result.spec !== "General Physician" ? result.spec : "Lab Test Result";
                } 
                // B. For Simple Chat -> Use the User's own keywords
                else {
                    queryTerm = prompt.replace(/[^\w\s]/gi, '').split(' ')
                        .filter(w => w.length > 3 && !['have', 'what', 'pain', 'about', 'help', 'give'].includes(w.toLowerCase()))
                        .slice(0, 2).join(' ');
                }

                if (queryTerm && queryTerm.length > 2) {
                    // console.log(`[Medline] Searching for: ${queryTerm}`);
                    const trustedLinks = await MedlineService.getTrustedSource(queryTerm);
                    result.trusted_sources = trustedLinks;
                }
            } catch (e) {
                console.log("Medline Enhancement skipped:", e.message);
            }
        }
        */

        return result;
    }

    async callGroqText(prompt, systemPrompt) {
        if (!process.env.GROQ_API_KEY) return null;

        try {
            // Using standard OpenAI-compatible endpoint provided by Groq
            const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: "llama-3.3-70b-versatile", // UPDATED: Replaced decommissioned llama3-70b-8192
                messages: [
                    { role: "system", content: systemPrompt + "\nIMPORTANT: Output PLAIN TEXT ONLY. No JSON." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.6
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            const text = response.data.choices[0].message.content;
            console.log("[DEBUG] Groq Response:", text);
            return this.parseAIResponse(text);

        } catch (error) {
            // Log full error details for debugging
            console.error("Groq API Error:", error.response?.data || error.message);
            throw error;
        }
    }

    async callGeminiText(prompt, systemPrompt) {
        // Initialize Keys (Lazy load to pick up .env changes)
        const keys = [
            process.env.GOOGLE_API_KEY,
            process.env.GOOGLE_API_KEY_1,
            process.env.GOOGLE_API_KEY_2,
            process.env.GOOGLE_API_KEY_3
        ].filter(k => k && k.length > 10);

        if (keys.length === 0) return null;

        // Persist index across calls (simple cycling)
        if (this.currentKeyIndex === undefined) this.currentKeyIndex = 0;

        let lastError = null;
        const attempts = keys.length;

        for (let i = 0; i < attempts; i++) {
            const currentKey = keys[this.currentKeyIndex];

            try {
                const genAI = new GoogleGenerativeAI(currentKey);
                // UPGRADE: Using "gemini-2.5-flash" (2026 Standard Model)
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

                // ENFORCE PLAIN TEXT
                const msg = `${systemPrompt}\n\nUser Query: "${prompt}"\n\n(NOTE: Output PLAIN TEXT only. Do not use JSON format.)`;

                const result = await model.generateContent(msg);
                const text = result.response.text();

                // console.log("[DEBUG] Success with Key Index:", this.currentKeyIndex);
                return this.parseAIResponse(text);

            } catch (error) {
                console.error(`[AI Service] Key Index ${this.currentKeyIndex} failed:`, error.message);
                lastError = error;

                // Rotate to next key for next attempt
                this.currentKeyIndex = (this.currentKeyIndex + 1) % keys.length;
                console.log(`[AI Service] Switching to Key Index: ${this.currentKeyIndex}`);
            }
        }

        throw lastError;
    }

    // --- DATA PROCESSING & PROMPTS ---

    detectNutritionContext(text) {
        if (!text) return null;
        text = text.toLowerCase();
        for (const [key, data] of Object.entries(NUTRITION_FRAMEWORK)) {
            if (data.keywords.some(k => text.includes(k))) return key;
        }
        return null;
    }

    getSystemPrompt(context) {
        // 1. Nutrition Framework
        if (context && context.startsWith('nutrition_')) {
            const outputFormat = JSON.stringify({
                condition_detected: "Condition Name",
                clinical_reasoning: "Explanation",
                diet_chart: { morning: "...", afternoon: "...", night: "..." },
                foods_to_eat: ["List"],
                foods_to_avoid: ["List"],
                lifestyle_tips: ["List"]
            });

            const conditionKey = context.replace('nutrition_', '');
            const ruleSet = NUTRITION_FRAMEWORK[conditionKey];

            if (ruleSet) {
                return `You are a Clinical Nutritionist.
                Patient Signs: ${ruleSet.condition}.
                Reasoning Base: ${ruleSet.reasoning}
                
                STRICTLY FOLLOW:
                - EAT: ${ruleSet.diet.eat.join(', ')}
                - AVOID: ${ruleSet.diet.avoid.join(', ')}
                
                Generate a plan. Return JSON matching: ${outputFormat}`;
            }
        }

        // 2. Clinical Support
        if (context === 'clinical_support') {
            return `You are an expert Medical Clinical Decision Support System. 
            Return ONLY a JSON object with this exact format:
            {
                "summary": "Technical clinical summary",
                "differential_diagnosis": ["List of 3 possible diagnoses"],
                "treatment_plan": ["Step-by-step treatment"],
                "risks": ["Key red flags"],
                "spec": "Recommended Specialist",
                "rx": ["List of suggested medications"]
            }`;
        }

        // 3. Patient Education / General / Report Analysis (Natural Mode)
        return `You are DocOn AI, a caring and friendly medical assistant. 💙
        
        YOUR GOAL: Help the patient understand their health in simple, easy words.

        STYLE GUIDELINES:
        1. **Be Friendly**: Start with a warm tone (e.g., "I'm sorry you're feeling this way 😟" or "I get it").
        2. **Use Emojis**: Add emojis to make the text feel lighter. 🌟
        3. **Headings**: Use CAPITAL LETTERS for headings. DO NOT use markdown stars (**).
           Correct: PRECAUTIONS
           Wrong: **Precautions**
        4. **Simple & Short**: Keep it short. Explain like you are talking to a friend (Grade 6 level).
        5. **Specialist Mapping**: ALWAYS suggest specific specialists.
           - Skin (pimples, acne, rash) -> "Dermatologist"
           - Heart -> "Cardiologist"
           - Bone/Joints -> "Orthopedist"
           - Women's Health -> "Gynecologist"
           - Kids -> "Pediatrician"
           - General/Fever -> "General Physician"

        OUTPUT FORMAT: PLAIN TEXT ONLY. DO NOT RETURN JSON.

        If the input is a Greeting (hi, hello, namaste):
        Reply EXACTLY like this (in Hindi first, then English):
        "नमस्ते! मैं डॉकऑन एआई हूँ। मैं आपकी स्वास्थ्य संबंधी समस्याओं और लैब रिपोर्ट विश्लेषण में मदद कर सकता हूँ। 🙏
        
        Would you like to continue in English, Hindi (हिंदी), or Telugu (తెలుగు)? 🗣️"

        For other inputs:
        - Answer naturally in the language the user is speaking.
        - If they ask for Hindi/Telugu, switch to that language completely.
        - Analyze symptoms/reports clearly.
        - Provide practical precautions.
        
        At the END, on a separate line, you MAY suggest a specialist if clear:
        "Specialist: [Name]"`;
    }

    parseAIResponse(text) {
        // Initialize defaults
        let summary = text;
        let spec = "General Physician";
        let precautions = [];
        let urgency = "Medium";

        // 1. Intelligent JSON Extraction (Robust Regex)
        try {
            // Regex to find the first JSON-like object block
            const jsonMatch = text.match(/\{[\s\S]*?\}/);
            if (jsonMatch) {
                const potentialJson = jsonMatch[0];
                const json = JSON.parse(potentialJson);

                // If parsing succeeded, use the extracted fields
                const extractedText = json.response || json.summary || json.message || json.content;
                if (extractedText) {
                    summary = extractedText;

                    if (json.spec) spec = json.spec;
                    if (json.specialist) spec = json.specialist;
                    if (json.precautions) precautions = json.precautions;
                    if (json.urgency) urgency = json.urgency;
                }
            }
        } catch (e) {
            // Parsing failed (not real JSON), so we treat the whole text as the message.
            // Aggressive Cleanup fallback
            summary = text.replace(/```json/g, '').replace(/```/g, '').trim();
        }

        // 2. Natural Language Extraction (for specialist)
        const specMatch = summary.match(/Specialist:\s*([A-Za-z ]+)/i);
        if (specMatch) {
            if (spec === "General Physician") spec = specMatch[1].trim();
            summary = summary.replace(specMatch[0], '').trim();
        }

        return {
            found: true,
            summary: summary,
            spec: spec,
            urgency: urgency,
            precautions: precautions,
            rx: []
        };
    }

    expertSystemFallback(text) {
        return {
            found: false,
            summary: "⚠️ **No AI Brain Found**\n\n**Action Required for Deployment**:\nPlease enable the **Google Gemini API** in your `.env` file and Google Cloud Console.\n\n(Ollama/HF removed for deployment optimization).",
            spec: "System Offline",
            urgency: "Low",
            precautions: ["Enable Gemini API"],
            rx: [],
            differential_diagnosis: [],
            treatment_plan: [],
            risks: []
        };
    }

    // Vision Fallback (Gemini)
    async analyzeImage(imageBuffer, mimeType, prompt) {
        try {
            if (!process.env.GOOGLE_API_KEY) return "Vision analysis unavailable.";
            const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const imagePart = { inlineData: { data: imageBuffer.toString('base64'), mimeType: mimeType } };
            const result = await model.generateContent([prompt, imagePart]);
            return (await result.response).text();
        } catch (error) {
            console.error("Gemini Vision Error:", error);
            return "Failed to analyze image.";
        }
    }
}

module.exports = new AIService();
