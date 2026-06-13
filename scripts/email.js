// Email service for notifications

const nodemailer = require('nodemailer');

// Configure email service (using Gmail or environment variables)
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'chemicalsociety.lesotho@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    }
});

async function sendWelcomeEmail(member) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: member.email,
        subject: 'Welcome to the Chemical Society of Lesotho!',
        html: `
            <h2>Welcome, ${member.fullName}!</h2>
            <p>Thank you for joining the Chemical Society of Lesotho.</p>
            <p><strong>Your Application Status:</strong> Pending Review</p>
            <p>Your membership application has been received. Our administrators will verify your payment proof and approve your account shortly.</p>
            <p>In the meantime, you can:</p>
            <ul>
                <li>Explore our event calendar</li>
                <li>Browse chemistry resources</li>
                <li>Read about our community</li>
            </ul>
            <p>Once approved, you'll have full access to:</p>
            <ul>
                <li>Exclusive member events and workshops</li>
                <li>Chemistry lecture videos</li>
                <li>Discussion forums</li>
                <li>Downloadable resources and certificates</li>
            </ul>
            <p>Questions? Contact us at members@chemicalsociety.ls</p>
            <p>Best regards,<br>Chemical Society of Lesotho Team</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${member.email}`);
    } catch (error) {
        console.error('Email send error:', error);
    }
}

async function sendPaymentApprovedEmail(member) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: member.email,
        subject: '✅ Your Membership is Approved!',
        html: `
            <h2>Great News, ${member.fullName}!</h2>
            <p>Your membership payment has been verified and approved.</p>
            <p><strong>Membership Type:</strong> ${member.membershipType}</p>
            <p><strong>Status:</strong> Active</p>
            <p>You now have full access to:</p>
            <ul>
                <li>📚 Chemistry Lectures & Videos</li>
                <li>💬 Discussion Forums</li>
                <li>🎓 Resources & Study Materials (with LaTeX support)</li>
                <li>🎤 Event Registration & Networking</li>
                <li>📜 Certificate of Participation</li>
            </ul>
            <p><a href="http://localhost:3000/profile.html" style="background: #0b5bbf; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Access Your Profile</a></p>
            <p>Welcome to our community!</p>
            <p>Best regards,<br>Chemical Society of Lesotho</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Approval email sent to ${member.email}`);
    } catch (error) {
        console.error('Email send error:', error);
    }
}

async function sendEventReminderEmail(member, event) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: member.email,
        subject: `📅 Reminder: ${event.title} is coming!`,
        html: `
            <h2>Event Reminder</h2>
            <p>Hi ${member.fullName},</p>
            <p>This is a reminder about the upcoming event you registered for:</p>
            <h3>${event.title}</h3>
            <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${new Date(event.date).toLocaleTimeString()}</p>
            <p><strong>Location:</strong> ${event.location}</p>
            <p><strong>Type:</strong> ${event.type}</p>
            <p>${event.summary}</p>
            <p>See you there!</p>
            <p>Best regards,<br>Chemical Society of Lesotho</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Event reminder sent to ${member.email}`);
    } catch (error) {
        console.error('Email send error:', error);
    }
}

async function sendCertificateEmail(member, event) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: member.email,
        subject: `🎓 Your Certificate of Participation - ${event.title}`,
        html: `
            <h2>Certificate of Participation</h2>
            <p>Hi ${member.fullName},</p>
            <p>Congratulations! Your attendance at the following event has been recorded:</p>
            <h3>${event.title}</h3>
            <p>Your certificate of participation is attached to this email.</p>
            <p>Thank you for contributing to the Chemical Society of Lesotho!</p>
            <p>Best regards,<br>Chemical Society of Lesotho</p>
        `,
        attachments: [
            {
                filename: `Certificate_${event.id}_${member.id}.pdf`,
                path: `./certificates/cert_${event.id}_${member.id}.pdf`
            }
        ]
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Certificate email sent to ${member.email}`);
    } catch (error) {
        console.error('Email send error:', error);
    }
}

async function sendNewResourceEmail(members, resource) {
    for (const member of members) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: member.email,
            subject: `📚 New Resource Added: ${resource.title}`,
            html: `
                <h2>New Chemistry Resource</h2>
                <p>Hi ${member.fullName},</p>
                <p>A new resource has been added to our library:</p>
                <h3>${resource.title}</h3>
                <p><strong>Category:</strong> ${resource.category}</p>
                <p>${resource.description}</p>
                <p><a href="http://localhost:3000/resources.html">View All Resources</a></p>
                <p>Best regards,<br>Chemical Society of Lesotho</p>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Email send error:', error);
        }
    }
}

module.exports = {
    sendWelcomeEmail,
    sendPaymentApprovedEmail,
    sendEventReminderEmail,
    sendCertificateEmail,
    sendNewResourceEmail
};
