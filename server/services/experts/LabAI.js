const Tesseract = require('tesseract.js');

class LabAI {
    async analyze(imageBuffer) {
        // Lab Role: Accurate Optical Character Recognition (OCR) + Critical Value Check
        try {
            console.log('[LabAI] Starting OCR process...');
            const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng');

            // Post-OCR: Structure the data (Simple Regex for Demo)
            const extractedValues = this.extractValues(text);
            const criticals = this.checkCriticals(extractedValues);

            return {
                rawText: text,
                structuredData: extractedValues,
                criticals: criticals,
                isCritical: criticals.length > 0
            };
        } catch (err) {
            console.error("LabAI OCR Error:", err);
            return { error: "Failed to read lab report image." };
        }
    }

    extractValues(text) {
        // Simple extraction logic for standard lab parameters
        const results = {};

        // Example: "Hemoglobin 12.5"
        const hbMatch = text.match(/Hemoglobin.*?(\d+\.?\d*)/i);
        if (hbMatch) results['Hemoglobin'] = parseFloat(hbMatch[1]);

        const plateletMatch = text.match(/Platelet.*?(\d+)/i);
        if (plateletMatch) results['Platelets'] = parseInt(plateletMatch[1]);

        const wbcMatch = text.match(/WBC.*?(\d+)/i);
        if (wbcMatch) results['WBC'] = parseInt(wbcMatch[1]);

        return results;
    }

    checkCriticals(values) {
        const warnings = [];
        // Uses the same logic basis as labRoutes, but applied to OCR data
        if (values['Hemoglobin'] && values['Hemoglobin'] < 7) warnings.push('Critical: Low Hemoglobin');
        if (values['Platelets'] && values['Platelets'] < 50000) warnings.push('Critical: Low Platelets');
        return warnings;
    }
}

module.exports = LabAI;
