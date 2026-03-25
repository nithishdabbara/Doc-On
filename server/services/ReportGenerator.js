const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class ReportGenerator {
    constructor() {
        this.logoPath = path.join(__dirname, '../assets/logo.png'); // Placeholder, we might need a dummy logo or skip it if missing
    }

    generate(booking, results, outputPath) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            // 1. Header
            this.generateHeader(doc, booking.labId);

            // 2. Patient Info
            this.generatePatientInfo(doc, booking);

            // 3. Test Results Table
            this.generateResultsTable(doc, results);

            // 4. Footer
            this.generateFooter(doc);

            doc.end();
            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        });
    }

    generateHeader(doc, lab) {
        doc.fillColor('#0f766e') // Teal 700
            .fontSize(20)
            .text('DocOn Medical Report', 50, 50, { align: 'right' })
            .fontSize(10)
            .text('Generated via DocOn Portal', 50, 75, { align: 'right' })
            .moveDown();

        doc.fillColor('#000000')
            .fontSize(16)
            .text(lab.name || 'Lab Centre', 50, 50, { align: 'left' })
            .fontSize(10)
            .text(lab.address || '', 50, 70)
            .text(lab.district || '', 50, 85)
            .moveDown(2);

        doc.moveTo(50, 110).lineTo(550, 110).strokeColor('#cccccc').stroke();
    }

    generatePatientInfo(doc, booking) {
        doc.fillColor('#333333')
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('Patient Details', 50, 130)
            .font('Helvetica')
            .fontSize(10);

        const top = 150;
        doc.text(`Name: ${booking.patientId.name}`, 50, top)
            .text(`Age/Sex: 30 / M`, 50, top + 15) // Placeholder, need Age in Patient model or calculate
            .text(`Ref. By: Dr. DocOn`, 50, top + 30);

        doc.text(`Date: ${new Date().toLocaleDateString()}`, 300, top)
            .text(`Sample ID: ${booking._id.toString().slice(-6).toUpperCase()}`, 300, top + 15)
            .text(`Status: Final Report`, 300, top + 30);

        doc.moveDown(3);
    }

    generateResultsTable(doc, results) {
        let i = 230;

        // Table Header
        doc.font('Helvetica-Bold');
        doc.rect(50, i, 500, 20).fill('#e0f2fe').stroke();
        doc.fillColor('black');
        doc.text('Test Parameter', 60, i + 5)
            .text('Result', 250, i + 5)
            .text('Unit', 350, i + 5)
            .text('Ref. Range', 450, i + 5);

        i += 30;
        doc.font('Helvetica');

        // Rows
        results.forEach(res => {
            // Highlight Abnormal
            const isAbnormal = res.isAbnormal;
            if (isAbnormal) {
                doc.font('Helvetica-Bold').fillColor('red');
            } else {
                doc.font('Helvetica').fillColor('black');
            }

            doc.text(res.parameter, 60, i)
                .text(res.value, 250, i)
                .text(res.unit, 350, i)
                .text(res.range, 450, i);

            i += 20;

            // Separator
            doc.moveTo(50, i - 5).lineTo(550, i - 5).strokeColor('#eeeeee').stroke();
        });
    }

    generateFooter(doc) {
        const bottom = 700;
        doc.fontSize(10).fillColor('black')
            .text('Electronically signed by Lab Technologist', 50, bottom)
            .text('** End of Report **', 0, bottom + 20, { align: 'center' });

        doc.fontSize(8).fillColor('gray')
            .text('Disclaimer: This is a system generated report. Please correlate clinically.', 50, bottom + 40, { align: 'center' });
    }
}

module.exports = new ReportGenerator();
