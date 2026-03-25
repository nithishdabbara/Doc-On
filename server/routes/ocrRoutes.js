const express = require('express');
const router = express.Router();
const multer = require('multer');
const Tesseract = require('tesseract.js');
const { verifyToken } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/ocr/extract
router.post('/extract', verifyToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        console.log(`[OCR] Processing file: ${req.file.originalname}`);

        const { data: { text } } = await Tesseract.recognize(
            req.file.buffer,
            'eng',
            { logger: m => console.log(`[OCR Progress] ${m.status}: ${parseInt(m.progress * 100)}%`) }
        );

        console.log("[OCR] Extraction Complete. Length:", text.length);

        // Simple Heuristic Extraction (Demo Logic)
        // We look for patterns like "Hemoglobin ... 13.5"
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        const extractedData = [];

        // Common Lab Keywords
        const keywords = ['Hemoglobin', 'RBC', 'WBC', 'Prelet', 'Glucose', 'Sugar', 'Cholesterol', 'Triglycerides', 'HDL', 'LDL', 'TSH', 'T3', 'T4', 'Creatinine', 'Urea', 'Bilirubin'];

        lines.forEach(line => {
            // Check if line contains a keyword
            const foundKeyword = keywords.find(k => line.toLowerCase().includes(k.toLowerCase()));

            if (foundKeyword) {
                // Try to find a number in the line
                const numberMatch = line.match(/[\d]{1,3}\.?[\d]{0,2}/);
                if (numberMatch) {
                    extractedData.push({
                        testName: foundKeyword, // Use standardized name
                        originalText: line,
                        value: numberMatch[0]
                    });
                }
            }
        });

        res.json({
            rawText: text,
            extractedData: extractedData,
            summary: extractedData.length > 0 ? `Found ${extractedData.length} test values.` : "No structure detected. Please review raw text."
        });

    } catch (err) {
        console.error("OCR Error:", err);
        res.status(500).json({ message: "OCR Failed to process image" });
    }
});

module.exports = router;
