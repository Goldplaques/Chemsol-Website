#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const readline = require('readline');

const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'members.db');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new sqlite3.Database(dbPath);

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n🔧 Chemical Society of Lesotho - Database Initialization\n');

rl.question('Create default admin account? (y/n): ', (ans) => {
    if (ans.toLowerCase() !== 'y') {
        console.log('Skipping admin creation.');
        initTables();
        return;
    }

    rl.question('Admin email: ', (email) => {
        rl.question('Admin password (min 8 chars): ', (password) => {
            if (password.length < 8) {
                console.error('❌ Password must be at least 8 characters.');
                rl.close();
                return;
            }

            const passwordHash = hashPassword(password);
            const createdAt = new Date().toISOString();

            db.run(`INSERT INTO admins (email, passwordHash, createdAt)
                VALUES (?, ?, ?)`,
                [email, passwordHash, createdAt],
                (err) => {
                    if (err) {
                        console.error('❌ Failed to create admin:', err.message);
                    } else {
                        console.log('✅ Admin account created:', email);
                    }
                    rl.close();
                });
        });
    });
});

function initTables() {
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
            status TEXT DEFAULT 'pending',
            createdAt TEXT NOT NULL,
            FOREIGN KEY(memberId) REFERENCES members(id)
        )`
    ];

    let completed = 0;
    tables.forEach((table, idx) => {
        db.run(table, (err) => {
            if (err && !err.message.includes('already exists')) {
                console.error(`❌ Error creating table ${idx}:`, err.message);
            } else if (!err) {
                console.log(`✅ Table ${idx + 1}/${tables.length} ready`);
            }
            completed++;
            if (completed === tables.length) {
                console.log('\n✅ Database initialization complete!\n');
                db.close();
                process.exit(0);
            }
        });
    });
}

rl.on('close', () => {
    if (process.exitCode === undefined) {
        initTables();
    }
});
