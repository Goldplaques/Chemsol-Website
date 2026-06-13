# Chemical Society of Lesotho - Website

A comprehensive web platform for managing membership, events, and chemistry resources for the Chemical Society of Lesotho.

## Features

### 📋 Member Management
- Secure signup with email and password
- Upload proof of payment for membership verification
- Multiple membership types: Student, Lecturer, Industry Professional
- Member profile dashboard with payment history
- Role-based membership tracking

### 👥 Admin Dashboard
- Complete member directory with search and filtering
- Payment approval/rejection workflow
- Event management and creation
- Resource/notes library administration
- Analytics and reporting
- JWT-based admin authentication

### 📚 Resources & Notes
- Upload chemistry notes with LaTeX support
- Categories: Physical Chemistry, Spectroscopy, Industrial Chemistry, Computing
- Full-text search and filtering
- MathJax rendering for mathematical equations
- PDF and HTML support

### 🎓 Events
- Event creation and scheduling
- Event types: Workshops, Lectures, Networking
- Member registration and RSVP tracking
- Event filtering and discovery

### 🧪 Technical Features
- SQLite database for persistent storage
- File upload handling (member payment proofs, resources)
- Responsive design for mobile and desktop
- Color scheme: White background, light blue text, green/yellow accents
- LaTeX math rendering with MathJax
- Secure authentication with JWT

---

## Installation & Setup

### Prerequisites
- Node.js (v14+) and npm installed
- Basic terminal/command line knowledge

### 1. Install Dependencies

```bash
cd "c:\Other\Project files\VS\Websites\Tutorial 1"
npm install
```

This installs:
- `express` - web server framework
- `sqlite3` - database
- `multer` - file upload handling
- `jsonwebtoken` - admin authentication
- `cors` - cross-origin requests

### 2. Initialize Database

Run the database setup script to create tables and optionally set up an admin account:

```bash
node scripts/init-db.js
```

Follow the prompts:
- Answer `y` to create a default admin account
- Enter admin email (e.g., `admin@chemicalsociety.ls`)
- Enter admin password (minimum 8 characters)

Example:
```
🔧 Chemical Society of Lesotho - Database Initialization

Create default admin account? (y/n): y
Admin email: admin@chemicalsociety.ls
Admin password (min 8 chars): MySecurePassword123
✅ Admin account created: admin@chemicalsociety.ls
✅ Database initialization complete!
```

### 3. Start the Server

```bash
npm start
```

Output:
```
Server running on http://localhost:3000
Admin panel: http://localhost:3000/admin-login.html
```

### 4. Open in Browser

- **Site Home:** http://localhost:3000/
- **Member Signup:** http://localhost:3000/signup.html
- **Member Login:** http://localhost:3000/signin.html
- **Admin Login:** http://localhost:3000/admin-login.html

---

## File Structure

```
Tutorial 1/
├── index.html              # Homepage
├── about.html              # About the society
├── events.html             # Event listing
├── resources.html          # Resource library
├── members.html            # Membership info
├── signup.html             # Member signup form
├── signin.html             # Member login
├── profile.html            # User profile dashboard
├── upload-notes.html       # Upload chemistry notes
├── admin-login.html        # Admin authentication
├── admin-dashboard.html    # Admin control panel
├── style.css               # All styles
├── server.js               # Express backend
├── package.json            # Dependencies
│
├── scripts/
│   ├── main.js            # Frontend JavaScript (signup, signin, forms)
│   ├── admin.js           # Admin dashboard JavaScript
│   └── init-db.js         # Database initialization script
│
├── assets/
│   └── logo.svg           # Society branding
│
├── data/
│   └── members.db         # SQLite database (created on first run)
│
└── uploads/
    └── [payment proofs]   # Member payment files
    └── [resources]        # Uploaded notes and resources
```

---

## Usage Guide

### For Members

1. **Sign Up**
   - Go to http://localhost:3000/signup.html
   - Fill in name, email, password, role, institution, membership type
   - Upload proof of payment (JPG, PNG, or PDF)
   - Submit - your application is stored in the database

2. **Sign In**
   - Go to http://localhost:3000/signin.html
   - Enter email and password
   - Access your profile at http://localhost:3000/profile.html

3. **Upload Notes**
   - Sign in to your member account
   - Go to http://localhost:3000/upload-notes.html
   - Upload chemistry notes with LaTeX support
   - Use `$...$` for inline math, `$$...$$` for display equations

4. **Register for Events**
   - Browse events at http://localhost:3000/events.html
   - Click to register (admin approves registrations)

### For Administrators

1. **Login to Admin Panel**
   - Go to http://localhost:3000/admin-login.html
   - Use the credentials created during setup

2. **Manage Members**
   - View all registered members
   - Search and filter by role, institution, or status
   - Export member list as CSV

3. **Approve Payments**
   - Go to **Payments** tab
   - Review uploaded payment proofs
   - Approve or reject payment submissions
   - Verified members gain full access

4. **Create Events**
   - Go to **Events** tab
   - Click "Create Event"
   - Set title, date, type, location, and description
   - Event is automatically visible to members

5. **Manage Resources**
   - Go to **Resources** tab
   - Upload chemistry notes or study materials
   - Approve user-submitted resources
   - Categorize by topic (Physical Chemistry, Spectroscopy, etc.)

6. **View Analytics**
   - Go to **Analytics** tab
   - See member statistics, membership growth, event attendance

---

## Database Schema

### Members Table
```sql
members (
    id, fullName, email, passwordHash, role, institution,
    membershipType, expertise, proofFile, paymentStatus, createdAt
)
```

### Admins Table
```sql
admins (
    id, email, passwordHash, createdAt
)
```

### Events Table
```sql
events (
    id, title, date, type, location, summary, attendees, createdAt
)
```

### Resources Table
```sql
resources (
    id, title, category, file, uploadedBy, description, status, createdAt
)
```

### Payments Table
```sql
payments (
    id, memberId, membershipType, proofFile, status, createdAt
)
```

---

## API Endpoints (Backend)

### Public
- `POST /api/signup` - Member registration with file upload
- `POST /api/signin` - Member login
- `GET /api/events` - List upcoming events
- `GET /api/resources` - List approved resources

### Admin (Requires JWT Token)
- `POST /api/admin/login` - Admin login
- `GET /api/admin/overview` - Dashboard stats
- `GET /api/admin/members` - Member directory
- `GET /api/admin/payments` - Payment list
- `POST /api/admin/payment/:id/approve` - Approve payment
- `POST /api/admin/payment/:id/reject` - Reject payment
- `GET /api/admin/events` - All events
- `POST /api/admin/events` - Create event
- `GET /api/admin/resources` - All resources

### Member
- `POST /api/upload-note` - Upload chemistry notes

---

## Color Scheme & Branding

The site uses the official Chemical Society of Lesotho colors:

- **Primary Text:** Light Blue (`#0f4d91`)
- **Background:** White (`#ffffff`)
- **Accents:** Green (`#2f9d27`) and Yellow (`#f2c94c`)
- **Button Color:** Blue (`#0b5bbf`)
- **Subtle Background:** Light blue tint (`#f7fbff`)

Logo: `assets/logo.svg` - Customizable chemistry-themed design

---

## Troubleshooting

### "Cannot find module 'express'"
→ Run `npm install` to install dependencies

### "Cannot find database file"
→ Run `node scripts/init-db.js` to initialize

### "Port 3000 already in use"
→ Change port: `PORT=3001 npm start`

### Admin login not working
→ Verify admin credentials in database or reinitialize: `node scripts/init-db.js`

### File uploads not working
→ Check `uploads/` folder has write permissions

---

## Extending the Site

### Add a New Page
1. Create `.html` file in root
2. Import `style.css` and `scripts/main.js`
3. Use header/footer components for consistency
4. Add navigation link to `site-nav` in header

### Add Event Registration
The `/api/admin/events` endpoint supports event creation. Members can register (admin approval pending).

### Add Announcements
Create a new database table and admin form to manage announcements displayed on the homepage.

### Email Notifications
Integrate Nodemailer to send emails on:
- Member signup confirmation
- Payment approval
- Event registration
- Admin announcements

---

## Security Notes

- Passwords are hashed with SHA-256
- Admin authentication uses JWT tokens
- File uploads are validated and stored in `/uploads/`
- SQL injection prevention via parameterized queries
- CORS enabled for local development

**For Production:**
- Use stronger password hashing (bcrypt)
- Enable HTTPS
- Use environment variables for secrets
- Implement rate limiting
- Add email verification

---

## Support & Contact

- **Society Email:** info@chemicalsociety.ls
- **Membership:** members@chemicalsociety.ls
- **Resources:** resources@chemicalsociety.ls

---

## License

© 2026 Chemical Society of Lesotho

---

**Built for connecting chemistry students, lecturers, and industry professionals in Lesotho.**
