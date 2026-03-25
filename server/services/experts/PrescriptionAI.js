const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PrescriptionAI {
    generatePDF(data, res) {
        // data = { doctorName, patientName, diagnosis, medications: [{name, dosage, freq}], date }

        const doc = new PDFDocument({ margin: 50 });

        // Set headers for file download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Prescription_${Date.now()}.pdf`);

        doc.pipe(res);

        // --- Header ---
        doc.fontSize(20).text('DocOn Hospital', { align: 'center' });
        doc.fontSize(10).text('123 Health Avenue, Med City', { align: 'center' });
        doc.moveDown();
        doc.moveTo(50, 100).lineTo(550, 100).stroke(); // Line

        // --- Details ---
        doc.moveDown();
        doc.fontSize(12).text(`Doctor: ${data.doctorName}`, { align: 'left' });
        doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
        doc.moveDown();
        doc.text(`Patient: ${data.patientName}`);
        doc.text(`Diagnosis: ${data.diagnosis || 'N/A'}`);
        doc.moveDown();

        // --- Rx Symbol ---
        doc.fontSize(24).font('Helvetica-Bold').text('Rx', 50, 220);

        // --- Medicines ---
        doc.moveDown();
        doc.font('Helvetica').fontSize(12);
        let y = 260;

        if (data.medications && data.medications.length > 0) {
            data.medications.forEach((med, index) => {
                doc.text(`${index + 1}. ${med.name}`, 70, y);
                doc.fontSize(10).text(`    ${med.dosage} | ${med.frequency}`, 70, y + 15);
                y += 40;
                doc.fontSize(12);
            });
        } else {
            doc.text('No medications prescribed.', 70, y);
        }

        // --- Footer ---
        doc.fontSize(10).text('Digitally Generated via DocOn Prescription AI', 50, 700, { align: 'center', color: 'grey' });

        doc.end();
    }
}

module.exports = PrescriptionAI;
