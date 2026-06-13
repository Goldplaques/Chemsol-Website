# Chemical Society of Lesotho - Complete Setup Guide

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **SQLite** (included with sqlite3 npm package)

### Installation Steps

#### 1️⃣ Install Dependencies
```bash
npm install
```

This installs all required packages:
- **express** - Web server framework
- **sqlite3** - Database
- **multer** - File uploads
- **jsonwebtoken** - Admin authentication
- **stripe** - Payment processing
- **nodemailer** - Email notifications
- **pdfkit** - Certificate generation
- **chart.js** - Analytics charts
- **cors** - Cross-origin requests
- **dotenv** - Environment configuration

#### 2️⃣ Configure Environment
Copy `.env.example` to `.env` and fill in your settings:

```bash
# Create .env file
cp .env.example .env
```

Edit `.env` with:
- `EMAIL_USER` & `EMAIL_PASSWORD` - Gmail App Password (for email notifications)
- `STRIPE_PUBLIC_KEY` & `STRIPE_SECRET_KEY` - From Stripe Dashboard
- `JWT_SECRET` - Any random string for admin tokens

**Email Setup (Gmail):**
1. Enable 2-Factor Authentication in Google Account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate password for "Mail" + "Windows Computer"
4. Copy the 16-character password to `EMAIL_PASSWORD`

#### 3️⃣ Initialize Database
```bash
node scripts/init-db.js
```

This creates:
- 10 database tables (members, admins, events, resources, payments, videos, forums, etc.)
- Default admin account (follow prompts)

#### 4️⃣ Start the Server
```bash
npm start
```

Or with auto-reload (development):
```bash
npm run dev
```

Server runs on: **http://localhost:3000**

---

## 📋 Features Overview

### For Members
- **Sign Up** - Register with email/password
- **Payment** - Choose membership type and pay via Stripe or upload proof
- **Events** - View and register for chemistry events
- **Resources** - Access study materials with LaTeX support
- **Lectures** - Watch video lectures (YouTube embedded)
- **Forum** - Discuss topics with community
- **Profile** - Manage account, view memberships, certificates
- **Certificates** - Download certificates of participation

### For Admins
- **Dashboard** - Overview of all stats
- **Member Management** - View, verify, manage members
- **Payment Management** - Approve/reject payment submissions
- **Event Management** - Create, edit, delete events
- **Resource Management** - Approve resources, manage library
- **Video Management** - Add YouTube lecture links
- **Analytics** - Charts for growth, engagement, attendance
- **Forum Moderation** - Coming soon

---

## 🔐 Authentication

### Member Login
- Email + Password
- Session stored in localStorage
- Auto-redirect to sign in if session expires

### Admin Login
- Email + Password (must be created in init-db.js)
- JWT token (24-hour expiry)
- Token stored in localStorage

---

## 💳 Payment Processing

### Options
1. **Stripe Payment** (Recommended)
   - Real-time processing
   - Secure card handling
   - Automatic email confirmation

2. **Manual Payment Proof**
   - Upload bank transfer receipt
   - Admin manually verifies
   - Fallback option

### Membership Types
- **Student**: 500 LSL/year
- **Academic**: 1000 LSL/year
- **Industry Sponsor**: 3000 LSL/year

---

## 📧 Email Notifications

Automated emails sent for:
- ✉️ Welcome on signup
- ✉️ Payment approved notification
- ✉️ Event reminders (24hrs before)
- ✉️ Certificate delivery
- ✉️ New resource announcements

Configure in `.env`:
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

---

## 🎓 File Uploads

### Supported Upload Types
- **Payment Proofs** - PDF, PNG, JPG (max 10MB)
- **Resources** - PDF, DOCX, ZIP (max 10MB)
- **Certificates** - Auto-generated PDFs

### Upload Paths
- `/uploads/` - Payment proofs, resources
- `/certificates/` - Generated certificates

---

## 🌐 Pages Overview

### Public Pages
- `index.html` - Homepage
- `about.html` - About society
- `members.html` - Membership info
- `events.html` - Event listing
- `resources.html` - Resource library
- `lectures.html` - Video lectures
- `forum.html` - Discussion forum
- `analytics.html` - Community analytics (read-only)

### Authentication Pages
- `signin.html` - Member login
- `signup.html` - Member registration
- `admin-login.html` - Admin login
- `payment.html` - Stripe payment

### Member Pages (Requires Login)
- `profile.html` - User dashboard with 5 tabs
- `upload-notes.html` - Submit chemistry notes

### Admin Pages (Requires JWT)
- `admin-dashboard.html` - Control panel
- Full management of all resources

---

## 🗄️ Database Schema

### Tables
1. **members** - Member accounts (id, fullName, email, role, institution, membershipType)
2. **admins** - Admin accounts (id, email, passwordHash)
3. **events** - Chemistry events (id, title, date, type, location)
4. **event_registrations** - Event signups (memberId, eventId)
5. **resources** - Study materials (id, title, category, file, status)
6. **payments** - Payment records (id, memberId, amount, status, stripePaymentId)
7. **videos** - Lecture links (id, title, category, youtubeUrl)
8. **forum_threads** - Discussion threads (id, title, category, createdBy)
9. **forum_posts** - Thread replies (id, threadId, memberId, message)
10. **certificates** - Issued certificates (id, memberId, eventId, file)

---

## 🎨 Customization

### Colors (in style.css)
```css
:root {
    --bg: #ffffff;           /* White background */
    --text: #0f4d91;         /* Light blue text */
    --button: #0b5bbf;       /* Blue buttons */
    --accent: #2f9d27;       /* Green accents */
    --accent2: #f2c94c;      /* Yellow accents */
    --muted: #556f92;        /* Muted text */
}
```

### Change Society Name
Edit in HTML header:
```html
<p class="brand-title">Chemical Society of Lesotho</p>
```

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check port 3000 isn't already in use
# Try different port:
PORT=3001 npm start
```

### Database errors
```bash
# Reinitialize database
rm data/members.db
node scripts/init-db.js
npm start
```

### Email not sending
- Verify Gmail App Password (not regular password)
- Check 2FA is enabled on Gmail account
- Ensure less-secure apps are NOT blocking
- Check `.env` EMAIL_* variables

### Stripe errors
- Ensure STRIPE_PUBLIC_KEY and STRIPE_SECRET_KEY are correct
- Test keys won't process real payments (use test cards)
- See Stripe docs for test card numbers

### Video embed not working
- Make sure YouTube URL format is: `https://www.youtube.com/embed/[VIDEO_ID]`
- Not: `https://www.youtube.com/watch?v=[VIDEO_ID]`

---

## 📊 API Endpoints

### Members
- `POST /api/signup` - Register
- `POST /api/signin` - Login
- `GET /api/events` - List events
- `GET /api/videos` - List videos
- `GET /api/forum/threads` - List forum threads

### Payments
- `POST /api/payment/create-intent` - Create Stripe payment
- `POST /api/payment/confirm` - Confirm payment

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/overview` - Dashboard stats
- `GET /api/admin/members` - All members
- `GET /api/admin/payments` - Payment records
- `GET /api/analytics` - Analytics data
- `POST /api/certificate/generate` - Create certificate
- `POST /api/admin/videos` - Add video
- `POST /api/forum/threads` - Create thread
- `POST /api/forum/posts` - Add forum post

---

## 🚀 Deployment

### To Production:
1. Set `NODE_ENV=production` in `.env`
2. Use strong `JWT_SECRET`
3. Update `SERVER_URL` in `.env`
4. Use production Stripe keys
5. Deploy to Heroku, DigitalOcean, AWS, etc.

---

## 📚 Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Vanilla HTML/CSS/JavaScript |
| Backend | Node.js + Express |
| Database | SQLite3 |
| Payments | Stripe |
| Email | Nodemailer |
| Certificates | PDFKit |
| Charts | Chart.js |
| Math | MathJax |
| Auth | JWT + localStorage |

---

## 📝 License & Contact

Chemical Society of Lesotho
📧 Email: members@chemicalsociety.ls
🌐 Website: chemicalsociety.ls

---

## ✅ Verification Checklist

After setup, verify:
- ✅ Server starts: `npm start` → no errors
- ✅ Database created: `data/members.db` exists
- ✅ Admin account: Can login to `admin-login.html`
- ✅ Member signup: Can create account at `signup.html`
- ✅ Events display: `events.html` shows events
- ✅ Forum loads: `forum.html` displays
- ✅ Videos load: `lectures.html` shows YouTube embeds
- ✅ Analytics: `analytics.html` shows charts
- ✅ Email: Check welcome email in inbox
- ✅ Stripe: Payment form appears on `payment.html`

---

**Need help?** Check the transcript or debug logs at:
`c:\Other\Project files\VS\Websites\Tutorial 1\data/`

Happy chemistry! 🧪
