// Admin Dashboard JavaScript

let currentAdmin = null;

function adminCheckAuth() {
    const session = localStorage.getItem('csl_admin_session');
    if (!session) {
        window.location.href = 'admin-login.html';
    } else {
        currentAdmin = JSON.parse(session);
    }
}

function setupAdminNav() {
    const navLinks = document.querySelectorAll('.admin-nav-link[data-section]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            showAdminSection(section);
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    const logoutBtn = document.getElementById('admin-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('csl_admin_session');
            window.location.href = 'admin-login.html';
        });
    }
}

function showAdminSection(sectionId) {
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(s => s.classList.remove('active'));
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('active');
        if (sectionId === 'members') loadMembers();
        if (sectionId === 'payments') loadPayments();
        if (sectionId === 'events') loadEvents();
        if (sectionId === 'resources') loadResources();
        if (sectionId === 'overview') loadOverview();
    }
}

async function loadOverview() {
    try {
        const response = await fetch('/api/admin/overview', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('csl_admin_token')}` }
        });
        if (!response.ok) throw new Error('Failed to load overview');
        const data = await response.json();
        document.getElementById('stat-members').textContent = data.totalMembers || 0;
        document.getElementById('stat-pending').textContent = data.pendingApprovals || 0;
        document.getElementById('stat-payments').textContent = data.verifiedPayments || 0;
        document.getElementById('stat-events').textContent = data.upcomingEvents || 0;
    } catch (error) {
        console.error('Overview load error:', error);
    }
}

async function loadMembers() {
    try {
        const response = await fetch('/api/admin/members', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('csl_admin_token')}` }
        });
        if (!response.ok) throw new Error('Failed to load members');
        const data = await response.json();
        const tbody = document.querySelector('#members-table tbody');
        tbody.innerHTML = data.members.map(m => `
            <tr>
                <td>${m.fullName}</td>
                <td>${m.email}</td>
                <td>${m.role}</td>
                <td>${m.institution}</td>
                <td><span class="status-badge ${m.status}">${m.status || 'pending'}</span></td>
                <td>${new Date(m.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn-small" onclick="editMember(${m.id})">Edit</button>
                    <button class="btn-small danger" onclick="deleteMember(${m.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Members load error:', error);
    }
}

async function loadPayments() {
    try {
        const filter = document.getElementById('payment-filter').value;
        const response = await fetch(`/api/admin/payments?status=${filter}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('csl_admin_token')}` }
        });
        if (!response.ok) throw new Error('Failed to load payments');
        const data = await response.json();
        const tbody = document.querySelector('#payments-table tbody');
        tbody.innerHTML = data.payments.map(p => `
            <tr>
                <td>${p.memberName}</td>
                <td>${p.email}</td>
                <td>${p.membershipType}</td>
                <td>${p.proofFile ? `<a href="/uploads/${p.proofFile}" target="_blank">View</a>` : 'N/A'}</td>
                <td><span class="status-badge ${p.status}">${p.status}</span></td>
                <td>${new Date(p.createdAt).toLocaleDateString()}</td>
                <td>
                    ${p.status === 'pending' ? `
                        <button class="btn-small" onclick="approvePayment(${p.id})">Approve</button>
                        <button class="btn-small danger" onclick="rejectPayment(${p.id})">Reject</button>
                    ` : '-'}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Payments load error:', error);
    }
}

async function loadEvents() {
    try {
        const response = await fetch('/api/admin/events', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('csl_admin_token')}` }
        });
        if (!response.ok) throw new Error('Failed to load events');
        const data = await response.json();
        const tbody = document.querySelector('#events-table tbody');
        tbody.innerHTML = data.events.map(e => `
            <tr>
                <td>${e.title}</td>
                <td>${new Date(e.date).toLocaleDateString()}</td>
                <td>${e.type}</td>
                <td>${e.location}</td>
                <td>${e.attendees || 0}</td>
                <td>
                    <button class="btn-small" onclick="editEvent(${e.id})">Edit</button>
                    <button class="btn-small danger" onclick="deleteEvent(${e.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Events load error:', error);
    }
}

async function loadResources() {
    try {
        const response = await fetch('/api/admin/resources', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('csl_admin_token')}` }
        });
        if (!response.ok) throw new Error('Failed to load resources');
        const data = await response.json();
        const tbody = document.querySelector('#resources-table tbody');
        tbody.innerHTML = data.resources.map(r => `
            <tr>
                <td>${r.title}</td>
                <td>${r.category}</td>
                <td><a href="/uploads/${r.file}" target="_blank">${r.file}</a></td>
                <td>${new Date(r.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn-small danger" onclick="deleteResource(${r.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Resources load error:', error);
    }
}

async function approvePayment(id) {
    if (!confirm('Approve this payment?')) return;
    try {
        const response = await fetch(`/api/admin/payment/${id}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('csl_admin_token')}` }
        });
        if (!response.ok) throw new Error('Failed to approve');
        loadPayments();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function rejectPayment(id) {
    if (!confirm('Reject this payment?')) return;
    try {
        const response = await fetch(`/api/admin/payment/${id}/reject`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('csl_admin_token')}` }
        });
        if (!response.ok) throw new Error('Failed to reject');
        loadPayments();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function editMember(id) {
    alert('Member edit feature coming soon');
}

function deleteMember(id) {
    if (!confirm('Delete this member? This cannot be undone.')) return;
    alert('Member deletion feature coming soon');
}

function editEvent(id) {
    alert('Event edit feature coming soon');
}

function deleteEvent(id) {
    if (!confirm('Delete this event?')) return;
    alert('Event deletion feature coming soon');
}

function deleteResource(id) {
    if (!confirm('Delete this resource?')) return;
    alert('Resource deletion feature coming soon');
}

window.addEventListener('DOMContentLoaded', () => {
    adminCheckAuth();
    setupAdminNav();
    loadOverview();
    
    document.getElementById('payment-filter')?.addEventListener('change', loadPayments);
    document.getElementById('add-event-btn')?.addEventListener('click', () => {
        const form = document.getElementById('event-form');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });
    document.getElementById('add-resource-btn')?.addEventListener('click', () => {
        const form = document.getElementById('resource-form');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });
});
