require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const crypto = require('crypto');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const { sendWelcomeEmail, sendPaymentApprovedEmail, sendEventReminderEmail, sendCertificateEmail } = require('./scripts/email');
const { generateCertificate } = require('./scripts/certificate');

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'csl-secret-key-2026';

const dataDir = path.join(__dirname, 'data');
const uploadDir = path.join(__dirname, 'uploads');
const certificateDir = path.join(__dirname, 'certificates');
const dbPath = path.join(dataDir, 'members.db');

[dataDir, uploadDir, certificateDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Unable to open database', err);
        process.exit(1);
    }
    console.log('✅ Connected to SQLite database.');
    initializeDatabase();
});

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => {
            const sanitized = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            cb(null, `${Date.now()}-${sanitized}`);
        }
    }),
    limits: { fileSize: 50 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

function initializeDatabase() {
    const tables = [
        `CREATE TABLE IF NOT EXISTS members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullName TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            passwordHash TEXT NOT NULL,
            role TEXT NOT NULL,
            institution TEXT NOT NULL,
            membershipType TEXT NOT NULL,
            expertise TEXT,
            proofFile TEXT,
            paymentStatus TEXT DEFAULT 'pending',
            createdAt TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            passwordHash TEXT NOT NULL,
            createdAt TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            date TEXT NOT NULL,
            type TEXT NOT NULL,
            location TEXT NOT NULL,
            summary TEXT,
            attendees INTEGER DEFAULT 0,
            createdAt TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS event_registrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            memberId INTEGER NOT NULL,
            eventId INTEGER NOT NULL,
            registeredAt TEXT NOT NULL,
            FOREIGN KEY(memberId) REFERENCES members(id),
            FOREIGN KEY(eventId) REFERENCES events(id)
        )`,
        `CREATE TABLE IF NOT EXISTS resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            file TEXT NOT NULL,
            uploadedBy INTEGER,
            description TEXT,
            status TEXT DEFAULT 'pending',
            createdAt TEXT NOT NULL,
            FOREIGN KEY(uploadedBy) REFERENCES members(id)
        )`,
        `CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            memberId INTEGER NOT NULL,
            membershipType TEXT NOT NULL,
            proofFile TEXT,
            stripePaymentId TEXT,
            amount INTEGER,
            status TEXT DEFAULT 'pending',
            createdAt TEXT NOT NULL,
            FOREIGN KEY(memberId) REFERENCES members(id)
        )`,
        `CREATE TABLE IF NOT EXISTS videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            youtubeUrl TEXT NOT NULL,
            description TEXT,
            uploadedBy INTEGER,
            createdAt TEXT NOT NULL,
            FOREIGN KEY(uploadedBy) REFERENCES members(id)
        )`,
        `CREATE TABLE IF NOT EXISTS forum_threads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            createdBy INTEGER NOT NULL,
            createdAt TEXT NOT NULL,
            FOREIGN KEY(createdBy) REFERENCES members(id)
        )`,
        `CREATE TABLE IF NOT EXISTS forum_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            threadId INTEGER NOT NULL,
            memberId INTEGER NOT NULL,
            message TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            FOREIGN KEY(threadId) REFERENCES forum_threads(id),
            FOREIGN KEY(memberId) REFERENCES members(id)
        )`,
        `CREATE TABLE IF NOT EXISTS certificates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            memberId INTEGER NOT NULL,
            eventId INTEGER NOT NULL,
            certificateFile TEXT NOT NULL,
            issuedAt TEXT NOT NULL,
            FOREIGN KEY(memberId) REFERENCES members(id),
            FOREIGN KEY(eventId) REFERENCES events(id)
        )`
    ];

    tables.forEach((table, idx) => {
        db.run(table, (err) => {
            if (err && !err.message.includes('already exists')) {
                console.error(`❌ Error creating table ${idx}:`, err.message);
            }
        });
    });
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access token required' });
    jwt.verify(token, JWT_SECRET, (err, admin) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.admin = admin;
        next();
    });
}

// ===== MEMBER ROUTES =====
app.post('/api/signup', upload.single('proofFile'), (req, res) => {
    const { fullName, email, password, role, institution, membershipType, expertise } = req.body;
    if (!fullName || !email || !password || !role || !institution || !membershipType) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }

    const proofFile = req.file ? req.file.filename : null;
    const passwordHash = hashPassword(password);
    const createdAt = new Date().toISOString();

    db.run(`INSERT INTO members (fullName, email, passwordHash, role, institution, membershipType, expertise, proofFile, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [fullName, email, passwordHash, role, institution, membershipType, expertise, proofFile, createdAt],
        function (err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(409).json({ message: 'Email already registered.' });
                }
                return res.status(500).json({ message: 'Registration failed.' });
            }
            if (proofFile) {
                db.run(`INSERT INTO payments (memberId, membershipType, proofFile, createdAt)
                    VALUES (?, ?, ?, ?)`,
                    [this.lastID, membershipType, proofFile, createdAt]);
            }
            // Send welcome email
            const member = { fullName, email, id: this.lastID };
            sendWelcomeEmail(member).catch(err => console.error('Email error:', err));
            res.json({ message: 'Signup successful. Welcome!', memberId: this.lastID });
        });
});

app.post('/api/signin', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required.' });
    }

    const passwordHash = hashPassword(password);
    db.get(`SELECT id, fullName, email, role, institution, membershipType, expertise, paymentStatus, createdAt 
        FROM members WHERE email = ? AND passwordHash = ?`, 
        [email, passwordHash], 
        (err, row) => {
            if (err || !row) {
                return res.status(401).json({ message: 'Invalid credentials.' });
            }
            res.json({ user: row, message: 'Signin successful.' });
        });
});

// ===== PAYMENT ROUTES =====
app.post('/api/payment/create-intent', async (req, res) => {
    try {
        const { amount, membershipType, name, email } = req.body;
        const intent = await stripe.paymentIntents.create({
            amount: amount * 100,
            currency: 'zar',
            description: `${membershipType} Membership`,
            metadata: { email, membershipType }
        });
        res.json({ clientSecret: intent.client_secret });
    } catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ message: 'Payment initialization failed.' });
    }
});

app.post('/api/payment/confirm', (req, res) => {
    const { memberId, membershipType, stripePaymentId, amount } = req.body;
    const createdAt = new Date().toISOString();

    db.run(`INSERT INTO payments (memberId, membershipType, stripePaymentId, amount, status, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [memberId, membershipType, stripePaymentId, amount, 'verified', createdAt],
        function (err) {
            if (err) {
                return res.status(500).json({ message: 'Payment processing failed.' });
            }
            db.run(`UPDATE members SET paymentStatus = 'verified' WHERE id = ?`, [memberId], (err) => {
                if (!err) {
                    db.get(`SELECT * FROM members WHERE id = ?`, [memberId], (err, member) => {
                        if (member) sendPaymentApprovedEmail(member).catch(err => console.error('Email error:', err));
                    });
                }
            });
            res.json({ message: 'Payment confirmed. Welcome to the society!' });
        });
});

// ===== ADMIN ROUTES =====
app.post('/api/admin/login', (req, res) => {
    const { adminEmail, adminPassword } = req.body;
    if (!adminEmail || !adminPassword) {
        return res.status(400).json({ message: 'Admin credentials required.' });
    }

    const passwordHash = hashPassword(adminPassword);
    db.get(`SELECT id, email FROM admins WHERE email = ? AND passwordHash = ?`, 
        [adminEmail, passwordHash], 
        (err, row) => {
            if (err || !row) {
                return res.status(401).json({ message: 'Invalid admin credentials.' });
            }
            const token = jwt.sign({ id: row.id, email: row.email }, JWT_SECRET, { expiresIn: '24h' });
            res.json({ admin: row, token: token });
        });
});

app.get('/api/admin/overview', authenticateToken, (req, res) => {
    db.get(`SELECT COUNT(*) as totalMembers FROM members`, (err, members) => {
        db.get(`SELECT COUNT(*) as pending FROM members WHERE paymentStatus = 'pending'`, (err, pending) => {
            db.get(`SELECT COUNT(*) as verified FROM members WHERE paymentStatus = 'verified'`, (err, verified) => {
                db.get(`SELECT COUNT(*) as upcoming FROM events WHERE date > ?`, [new Date().toISOString()], (err, events) => {
                    res.json({
                        totalMembers: members?.totalMembers || 0,
                        pendingApprovals: pending?.pending || 0,
                        verifiedPayments: verified?.verified || 0,
                        upcomingEvents: events?.upcoming || 0
                    });
                });
            });
        });
    });
});

app.get('/api/admin/members', authenticateToken, (req, res) => {
    db.all(`SELECT id, fullName, email, role, institution, membershipType, paymentStatus, createdAt 
        FROM members ORDER BY createdAt DESC`, 
        (err, rows) => {
            if (err) return res.status(500).json({ message: 'Failed to load members.' });
            res.json({ members: rows || [] });
        });
});

app.get('/api/admin/payments', authenticateToken, (req, res) => {
    const status = req.query.status || '';
    const query = status ? 
        `SELECT p.*, m.fullName, m.email FROM payments p 
         JOIN members m ON p.memberId = m.id WHERE p.status = ? ORDER BY p.createdAt DESC` :
        `SELECT p.*, m.fullName, m.email FROM payments p 
         JOIN members m ON p.memberId = m.id ORDER BY p.createdAt DESC`;
    
    db.all(query, status ? [status] : [], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Failed to load payments.' });
        res.json({ payments: rows || [] });
    });
});

app.post('/api/admin/payment/:id/approve', authenticateToken, (req, res) => {
    db.run(`UPDATE payments SET status = 'verified' WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ message: 'Approval failed.' });
        db.run(`UPDATE members SET paymentStatus = 'verified' WHERE id = (SELECT memberId FROM payments WHERE id = ?)`, 
            [req.params.id]);
        res.json({ message: 'Payment approved.' });
    });
});

// ===== EVENT ROUTES =====
app.get('/api/events', (req, res) => {
    db.all(`SELECT * FROM events WHERE date >= ? ORDER BY date ASC`, [new Date().toISOString()], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Failed to load events.' });
        res.json({ events: rows || [] });
    });
});

app.post('/api/admin/events', authenticateToken, upload.single('eventImage'), (req, res) => {
    const { title, date, type, location, summary } = req.body;
    db.run(`INSERT INTO events (title, date, type, location, summary, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [title, date, type, location, summary, new Date().toISOString()],
        function(err) {
            if (err) return res.status(500).json({ message: 'Event creation failed.' });
            res.json({ message: 'Event created.', eventId: this.lastID });
        });
});

// ===== VIDEO/LECTURES ROUTES =====
app.get('/api/videos', (req, res) => {
    db.all(`SELECT id, title, category, youtubeUrl, description, createdAt FROM videos ORDER BY createdAt DESC`, 
        (err, rows) => {
            if (err) return res.status(500).json({ message: 'Failed to load videos.' });
            res.json({ videos: rows || [] });
        });
});

app.post('/api/admin/videos', authenticateToken, (req, res) => {
    const { title, category, youtubeUrl, description } = req.body;
    if (!title || !youtubeUrl) return res.status(400).json({ message: 'Title and URL required.' });
    
    db.run(`INSERT INTO videos (title, category, youtubeUrl, description, createdAt)
        VALUES (?, ?, ?, ?, ?)`,
        [title, category, youtubeUrl, description, new Date().toISOString()],
        function(err) {
            if (err) return res.status(500).json({ message: 'Video upload failed.' });
            res.json({ message: 'Video added.', videoId: this.lastID });
        });
});

// ===== FORUM ROUTES =====
app.get('/api/forum/threads', (req, res) => {
    db.all(`SELECT ft.id, ft.title, ft.category, ft.createdAt, m.fullName, COUNT(fp.id) as postCount
        FROM forum_threads ft
        JOIN members m ON ft.createdBy = m.id
        LEFT JOIN forum_posts fp ON ft.id = fp.threadId
        GROUP BY ft.id
        ORDER BY ft.createdAt DESC`, 
        (err, rows) => {
            if (err) return res.status(500).json({ message: 'Failed to load forum.' });
            res.json({ threads: rows || [] });
        });
});

app.post('/api/forum/threads', (req, res) => {
    const { title, category, memberId, message } = req.body;
    if (!title || !memberId) return res.status(400).json({ message: 'Title and member required.' });

    db.run(`INSERT INTO forum_threads (title, category, createdBy, createdAt)
        VALUES (?, ?, ?, ?)`,
        [title, category, memberId, new Date().toISOString()],
        function(err) {
            if (err) return res.status(500).json({ message: 'Thread creation failed.' });
            
            db.run(`INSERT INTO forum_posts (threadId, memberId, message, createdAt)
                VALUES (?, ?, ?, ?)`,
                [this.lastID, memberId, message, new Date().toISOString()]);
            
            res.json({ message: 'Thread created.', threadId: this.lastID });
        });
});

app.get('/api/forum/threads/:id/posts', (req, res) => {
    db.all(`SELECT fp.id, fp.message, fp.createdAt, m.fullName, m.email
        FROM forum_posts fp
        JOIN members m ON fp.memberId = m.id
        WHERE fp.threadId = ?
        ORDER BY fp.createdAt ASC`, 
        [req.params.id], 
        (err, rows) => {
            if (err) return res.status(500).json({ message: 'Failed to load posts.' });
            res.json({ posts: rows || [] });
        });
});

app.post('/api/forum/posts', (req, res) => {
    const { threadId, memberId, message } = req.body;
    if (!threadId || !memberId || !message) return res.status(400).json({ message: 'Missing fields.' });

    db.run(`INSERT INTO forum_posts (threadId, memberId, message, createdAt)
        VALUES (?, ?, ?, ?)`,
        [threadId, memberId, message, new Date().toISOString()],
        function(err) {
            if (err) return res.status(500).json({ message: 'Post creation failed.' });
            res.json({ message: 'Post created.', postId: this.lastID });
        });
});

// ===== CERTIFICATE ROUTES =====
app.post('/api/certificate/generate', authenticateToken, async (req, res) => {
    const { memberId, eventId } = req.body;
    if (!memberId || !eventId) return res.status(400).json({ message: 'Member and event required.' });

    db.get(`SELECT * FROM members WHERE id = ?`, [memberId], (err, member) => {
        if (err || !member) return res.status(404).json({ message: 'Member not found.' });
        
        db.get(`SELECT * FROM events WHERE id = ?`, [eventId], (err, event) => {
            if (err || !event) return res.status(404).json({ message: 'Event not found.' });

            const fileName = `cert_${eventId}_${memberId}.pdf`;
            generateCertificate(member, event, fileName)
                .then((filePath) => {
                    db.run(`INSERT INTO certificates (memberId, eventId, certificateFile, issuedAt)
                        VALUES (?, ?, ?, ?)`,
                        [memberId, eventId, fileName, new Date().toISOString()]);
                    res.json({ message: 'Certificate generated.', file: fileName });
                })
                .catch(err => res.status(500).json({ message: 'Certificate generation failed.' }));
        });
    });
});

app.get('/api/certificate/:filename', (req, res) => {
    const file = path.join(certificateDir, req.params.filename);
    res.download(file);
});

// ===== ANALYTICS ROUTES =====
app.get('/api/analytics', authenticateToken, (req, res) => {
    db.get(`SELECT COUNT(*) as total FROM members`, (err, total) => {
        db.get(`SELECT COUNT(*) as verified FROM members WHERE paymentStatus = 'verified'`, (err, verified) => {
            db.all(`SELECT role, COUNT(*) as count FROM members GROUP BY role`, (err, roles) => {
                db.get(`SELECT COUNT(*) as events FROM events`, (err, events) => {
                    db.get(`SELECT COUNT(*) as resources FROM resources WHERE status = 'approved'`, (err, resources) => {
                        const membersByRole = {};
                        (roles || []).forEach(r => membersByRole[r.role] = r.count);
                        
                        res.json({
                            totalMembers: total?.total || 0,
                            verifiedMembers: verified?.verified || 0,
                            eventCount: events?.events || 0,
                            resourceCount: resources?.resources || 0,
                            membersByRole: membersByRole,
                            engagementRate: '75%',
                            forumPostsPerWeek: 12,
                            eventsPerMonth: 2,
                            growthData: {
                                months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                                values: [5, 12, 18, 25, 32, 41]
                            },
                            eventAttendance: {
                                events: ['Workshop', 'Lecture', 'Networking'],
                                counts: [45, 38, 52]
                            },
                            resourcesByCategory: {
                                'Physical Chemistry': 12,
                                'Spectroscopy': 8,
                                'Industrial': 6,
                                'Computing': 4
                            }
                        });
                    });
                });
            });
        });
    });
});

// ===== STATIC FILES =====
app.get('/uploads/:filename', (req, res) => {
    const file = path.join(uploadDir, req.params.filename);
    res.sendFile(file);
});

app.get('/certificates/:filename', (req, res) => {
    const file = path.join(certificateDir, req.params.filename);
    res.sendFile(file);
});

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ message: 'An error occurred.' });
});

// ===== SERVER START =====
app.listen(port, () => {
    console.log(`\n🚀 Chemical Society of Lesotho Server`);
    console.log(`✅ Server running on http://localhost:${port}`);
    console.log(`📊 Admin panel: http://localhost:${port}/admin-login.html`);
    console.log(`📈 Analytics: http://localhost:${port}/analytics.html\n`);
});
