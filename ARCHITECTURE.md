DATABASE STRUCTURE & DATA FLOW
==============================

MEMBER WORKFLOW:
1. Signup (signup.html)
   → Form filled + Payment proof uploaded
   → Data stored in members + payments table
   → Status: "pending"

2. Admin reviews payment (admin-dashboard.html)
   → Admin approves/rejects
   → paymentStatus updated to "verified" or "rejected"

3. Member signin (signin.html)
   → Credentials checked against members table
   → Session stored in browser localStorage
   → Redirects to profile.html

4. Member profile (profile.html)
   → Shows membership status, payment history, event registrations
   → Can upload notes, register for events

5. Upload notes (upload-notes.html)
   → Notes file uploaded to /uploads/
   → Entry created in resources table
   → Admin approves before display

EVENT WORKFLOW:
1. Admin creates event (admin-dashboard.html)
   → Event stored in events table
   → Visible on events.html

2. Member browses events (events.html)
   → Fetches upcoming events from /api/events
   → Can register/RSVP

3. Admin tracks attendance (admin-dashboard.html)
   → Views event_registrations table
   → Manages attendance and updates

ADMIN WORKFLOW:
1. Admin login (admin-login.html)
   → Email + password checked against admins table
   → JWT token issued
   → Stored in localStorage
   → Access to admin-dashboard.html

2. Dashboard overview
   → Query: Count of members, pending payments, verified payments, upcoming events
   → Display stats cards

3. Member management
   → Full directory with search
   → Can edit/delete members
   → Export functionality

4. Payment verification
   → Review uploaded proof files in /uploads/
   → Approve or reject
   → Updates member paymentStatus

5. Event management
   → Create new events
   → Track attendees
   → Edit/delete events

6. Resource management
   → Review user-submitted notes
   → Approve or reject
   → Delete inappropriate content

AUTHENTICATION:
- Members: Email/Password → stored in members table
- Admins: Email/Password → stored in admins table with JWT tokens
- Sessions: localStorage on client side

FILE STORAGE:
- Payment proofs: /uploads/[timestamp]-[filename]
- Resource files: /uploads/[timestamp]-[filename]

DATABASE TABLES:
===============

members:
  id, fullName, email, passwordHash, role, institution, 
  membershipType, expertise, proofFile, paymentStatus, createdAt

admins:
  id, email, passwordHash, createdAt

events:
  id, title, date, type, location, summary, attendees, createdAt

event_registrations:
  id, memberId, eventId, registeredAt

resources:
  id, title, category, file, uploadedBy, description, status, createdAt

payments:
  id, memberId, membershipType, proofFile, status, createdAt

API ENDPOINTS:
==============

PUBLIC:
POST   /api/signup              - Register new member
POST   /api/signin              - Login member
GET    /api/events              - List upcoming events
GET    /api/resources           - List approved resources
GET    /uploads/:filename       - Serve uploaded file

ADMIN (JWT protected):
POST   /api/admin/login         - Login admin
GET    /api/admin/overview      - Dashboard statistics
GET    /api/admin/members       - List all members
GET    /api/admin/payments      - List payment submissions
POST   /api/admin/payment/:id/approve    - Approve payment
POST   /api/admin/payment/:id/reject     - Reject payment
GET    /api/admin/events        - List all events
POST   /api/admin/events        - Create new event
GET    /api/admin/resources     - List all resources
POST   /api/upload-note         - Member uploads notes

PAGE MAPPING:
=============

Public Pages:
- index.html               Homepage + hero
- about.html               About the society
- events.html              Event listing + filtering
- resources.html           Resource library
- members.html             Membership info
- signin.html              Member login
- signup.html              Member registration

Member Pages (requires signin):
- profile.html             User dashboard (overview, membership, payments, events, settings)
- upload-notes.html        Submit chemistry notes

Admin Pages:
- admin-login.html         Admin authentication
- admin-dashboard.html     Full admin control (members, payments, events, resources, analytics)

COLOR PALETTE:
==============
Primary: #0f4d91 (Light Blue)
Background: #ffffff (White)
Surface: #f7fbff (Very Light Blue)
Accent 1: #2f9d27 (Green)
Accent 2: #f2c94c (Yellow)
Button: #0b5bbf (Blue)
Muted: #556f92 (Gray-Blue)
Border: #d9e6f2 (Light Border)

STYLING APPROACH:
=================
- Responsive CSS Grid layouts
- Mobile-first media queries
- Cards and panels for content
- Status badges (pending/verified/rejected)
- Admin table styling
- Form layouts

LATEX/MATHJAX SUPPORT:
======================
- Inline: $...$
- Display: $$...$$
- Rendered by MathJax CDN in upload-notes.html
- Auto-renders LaTeX in resource displays

LOCAL STORAGE:
==============
csl_session              - Current user object (member)
csl_admin_session       - Current admin object
csl_admin_token         - JWT token for admin requests
csl_members             - Fallback local member list (if server unavailable)

SETUP FLOW:
===========
1. npm install           - Install dependencies
2. node scripts/init-db.js - Create database, optional admin account
3. npm start             - Start server on port 3000
4. Open http://localhost:3000

TESTING ACCOUNTS:
=================
After running init-db.js, use your entered credentials.

Sample member signup:
- Email: student@nul.ls
- Password: ChemistryRocks123
- Role: Student
- Institution: NUL
- Membership: Student Annual
- Upload payment proof (any image file)

Admin panel:
- Email: admin@chemicalsociety.ls
- Password: (set during init-db.js)

KEY FEATURES:
=============
✓ Multi-page responsive site
✓ Secure member authentication
✓ Admin dashboard with full management
✓ Payment verification workflow
✓ Event creation and registration
✓ Resource upload with LaTeX support
✓ Member profiles with history
✓ SQLite persistent storage
✓ File upload handling
✓ JWT admin authentication
✓ Analytics and reporting
✓ Search and filtering
✓ Mobile-friendly design
✓ Branding with society colors

SCALABILITY:
============
- SQLite can handle 1000s of members
- File storage independent from database
- JWT prevents session overload
- Database queries indexed
- Can migrate to PostgreSQL/MySQL if needed
- Ready for email notifications
- Can add payment gateway integration
- Can add video hosting for lectures

FUTURE ENHANCEMENTS:
====================
1. Email notifications (Nodemailer)
2. Payment gateway (Stripe, PayPal)
3. Video lecture hosting
4. Discussion forums
5. Mentor matching system
6. Internship job board
7. Certificate generation
8. Two-factor authentication
9. API rate limiting
10. Advanced analytics dashboards
