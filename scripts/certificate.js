// Certificate generation with PDFKit

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const certificateDir = path.join(__dirname, '..', 'certificates');
if (!fs.existsSync(certificateDir)) {
    fs.mkdirSync(certificateDir, { recursive: true });
}

function generateCertificate(member, event, fileName) {
    return new Promise((resolve, reject) => {
        try {
            const filePath = path.join(certificateDir, fileName);
            const doc = new PDFDocument({
                size: 'A4',
                orientation: 'landscape',
                margin: 50
            });

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Decorative border
            doc.lineWidth(3)
                .strokeColor('#0b5bbf')
                .rect(40, 40, doc.page.width - 80, doc.page.height - 80)
                .stroke();

            doc.lineWidth(1)
                .strokeColor('#2f9d27')
                .rect(50, 50, doc.page.width - 100, doc.page.height - 100)
                .stroke();

            // Header
            doc.fontSize(36)
                .font('Helvetica-Bold')
                .fillColor('#0b5bbf')
                .text('Certificate of Participation', { align: 'center' });

            doc.moveDown(0.5);

            // Decorative line
            doc.moveTo(150, doc.y)
                .lineTo(doc.page.width - 150, doc.y)
                .strokeColor('#f2c94c')
                .lineWidth(2)
                .stroke();

            doc.moveDown(1);

            // Body text
            doc.fontSize(14)
                .font('Helvetica')
                .fillColor('#333')
                .text('This certificate is proudly presented to', { align: 'center' });

            doc.moveDown(0.3);

            // Member name - styled
            doc.fontSize(28)
                .font('Helvetica-Bold')
                .fillColor('#0b5bbf')
                .text(member.fullName, { align: 'center' });

            doc.moveDown(0.5);

            doc.fontSize(14)
                .font('Helvetica')
                .fillColor('#333')
                .text('For attending the event:', { align: 'center' });

            doc.moveDown(0.2);

            // Event title - styled
            doc.fontSize(18)
                .font('Helvetica-Bold')
                .fillColor('#2f9d27')
                .text(`"${event.title}"`, { align: 'center' });

            doc.moveDown(0.5);

            // Event details
            doc.fontSize(12)
                .font('Helvetica')
                .fillColor('#556f92')
                .text(`Type: ${event.type} | Date: ${new Date(event.date).toLocaleDateString()}`, { align: 'center' });

            doc.moveDown(0.3);
            doc.text(`Location: ${event.location}`, { align: 'center' });

            doc.moveDown(1.5);

            // Footer message
            doc.fontSize(11)
                .font('Helvetica-Oblique')
                .fillColor('#0b5bbf')
                .text('In recognition of your commitment to advancing chemistry education and fostering collaboration between academia and industry in Lesotho.', { align: 'center' });

            doc.moveDown(1);

            // Signature lines
            doc.fontSize(10)
                .font('Helvetica')
                .fillColor('#333');

            const signatureY = doc.y;
            const lineWidth = 120;

            // Left signature
            doc.moveTo(100, signatureY + 40)
                .lineTo(100 + lineWidth, signatureY + 40)
                .stroke();
            doc.text('Society President', 70, signatureY + 45, { width: 180, align: 'center' });

            // Right signature
            doc.moveTo(doc.page.width - 220, signatureY + 40)
                .lineTo(doc.page.width - 220 + lineWidth, signatureY + 40)
                .stroke();
            doc.text('Executive Director', doc.page.width - 250, signatureY + 45, { width: 180, align: 'center' });

            // Date and seal
            doc.moveDown(1.5);
            doc.fontSize(10)
                .fillColor('#556f92')
                .text(`Issued: ${new Date().toLocaleDateString()}`, { align: 'center' });

            doc.text(`Certificate ID: ${member.id}-${event.id}`, { align: 'center' });

            // Footer
            doc.fontSize(9)
                .fillColor('#999')
                .text('Chemical Society of Lesotho | Making chemistry work for you', { align: 'center' });

            doc.end();

            stream.on('finish', () => {
                console.log(`Certificate generated: ${filePath}`);
                resolve(filePath);
            });

            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = { generateCertificate };
