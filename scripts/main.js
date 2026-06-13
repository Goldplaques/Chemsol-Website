const eventData = [
    {
        title: 'Spectroscopy Workshop',
        date: '2026-07-05',
        type: 'workshop',
        location: 'NUL Chemistry Building',
        summary: 'Hands-on spectroscopy exercises for IR, UV-Vis, and NMR techniques.'
    },
    {
        title: 'Industry Networking Evening',
        date: '2026-07-20',
        type: 'networking',
        location: 'Maseru Conference Centre',
        summary: 'Meet industry employers, lab managers, and academic lecturers.'
    },
    {
        title: 'Physical Chemistry Lecture',
        date: '2026-08-02',
        type: 'lecture',
        location: 'NUL Lecture Hall 9',
        summary: 'A guided review of thermodynamics, kinetics, and practical systems modeling.'
    },
    {
        title: 'Research Collaboration Forum',
        date: '2026-08-16',
        type: 'networking',
        location: 'Maseru Innovation Hub',
        summary: 'Share research ideas and search for industry partners for projects.'
    }
];

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
}

function renderEvents() {
    const list = document.querySelector('.event-list');
    if (!list) return;

    list.innerHTML = eventData.map(event => {
        return `
            <article class="card card-event" data-type="${event.type}">
                <h3>${event.title}</h3>
                <p class="event-meta">${formatDate(event.date)} · ${event.location} · ${event.type}</p>
                <p>${event.summary}</p>
            </article>
        `;
    }).join('');
}

function setActiveNav() {
    const links = document.querySelectorAll('.site-nav a');
    const current = window.location.pathname.split('/').pop() || 'index.html';
    links.forEach(link => {
        if (link.getAttribute('href') === current) {
            link.classList.add('active');
        }
    });
}

function setupEventFilters() {
    const buttons = document.querySelectorAll('.filter-buttons button');
    const list = document.querySelector('.event-list');
    if (!buttons.length || !list) return;

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const type = button.dataset.type;
            list.querySelectorAll('.card-event').forEach(card => {
                card.style.display = (type === 'all' || card.dataset.type === type) ? 'block' : 'none';
            });
        });
    });
}

function showFormMessage(id, message, isSuccess) {
    const target = document.getElementById(id);
    if (!target) return;
    target.textContent = message;
    target.className = `form-message ${isSuccess ? 'success' : 'error'}`;
}

function localStorageFallback(key, data) {
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    current.push(data);
    localStorage.setItem(key, JSON.stringify(current));
}

async function handleSignup(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const payload = {
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role'),
        institution: formData.get('institution'),
        membershipType: formData.get('membershipType'),
        expertise: formData.get('expertise')
    };

    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const json = await response.json();
            throw new Error(json.message || 'Sign up failed');
        }

        const result = await response.json();
        showFormMessage('form-message', result.message || 'Membership request submitted.', true);
        form.reset();
    } catch (error) {
        localStorageFallback('csl_members', payload);
        showFormMessage('form-message', 'The membership form is saved locally. Run the server for full database support.', false);
        console.warn('Signup fallback stored locally:', error);
    }
}

async function handleSignin(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const payload = {
        email: formData.get('email'),
        password: formData.get('password')
    };

    try {
        const response = await fetch('/api/signin', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const json = await response.json();
            throw new Error(json.message || 'Sign in failed');
        }

        const result = await response.json();
        localStorage.setItem('csl_session', JSON.stringify(result.user));
        showFormMessage('signin-message', 'Signed in successfully. Welcome back!', true);
        form.reset();
        setTimeout(() => window.location.href = 'profile.html', 1500);
    } catch (error) {
        const stored = JSON.parse(localStorage.getItem('csl_members') || '[]');
        const match = stored.find(member => member.email === payload.email && member.password === payload.password);
        if (match) {
            showFormMessage('signin-message', 'Signed in locally using saved member data.', true);
            localStorage.setItem('csl_session', JSON.stringify(match));
            return;
        }
        showFormMessage('signin-message', error.message || 'Sign in failed.', false);
    }
}

async function handleAdminLogin(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const payload = {
        adminEmail: formData.get('adminEmail'),
        adminPassword: formData.get('adminPassword')
    };

    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const json = await response.json();
            throw new Error(json.message || 'Admin login failed');
        }

        const result = await response.json();
        localStorage.setItem('csl_admin_session', JSON.stringify(result.admin));
        localStorage.setItem('csl_admin_token', result.token);
        showFormMessage('admin-login-message', 'Admin access granted!', true);
        setTimeout(() => window.location.href = 'admin-dashboard.html', 1500);
    } catch (error) {
        showFormMessage('admin-login-message', error.message || 'Admin login failed.', false);
    }
}

function loadUserProfile() {
    const session = localStorage.getItem('csl_session');
    if (!session) {
        window.location.href = 'signin.html';
        return;
    }
    const user = JSON.parse(session);
    document.getElementById('user-name').textContent = user.fullName || 'Member';
    document.getElementById('user-email').textContent = user.email;
    document.getElementById('user-role').textContent = user.role;
    document.getElementById('user-institution').textContent = user.institution;
    document.getElementById('user-joined').textContent = new Date(user.createdAt).toLocaleDateString();
    document.getElementById('member-type').textContent = user.membershipType;
    document.getElementById('member-status').textContent = user.paymentStatus || 'pending';
    document.getElementById('member-status').className = `status-badge ${user.paymentStatus}`;
    document.getElementById('payment-status').textContent = user.paymentStatus || 'pending';
}

function setupProfileTabs() {
    const tabLinks = document.querySelectorAll('.profile-nav-link');
    if (!tabLinks.length) return;
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = link.dataset.tab;
            document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
            const tabEl = document.getElementById(`${tab}-tab`);
            if (tabEl) tabEl.classList.add('active');
            tabLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

async function handleUploadNotes(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    try {
        const response = await fetch('/api/upload-note', {
            method: 'POST',
            body: formData,
            headers: { 'Authorization': `Bearer ${localStorage.getItem('csl_session')}` }
        });

        if (!response.ok) {
            const json = await response.json();
            throw new Error(json.message || 'Upload failed');
        }

        showFormMessage('upload-message', 'Notes submitted for review!', true);
        form.reset();
    } catch (error) {
        showFormMessage('upload-message', error.message || 'Upload failed.', false);
    }
}

function setupUserLogout() {
    const logoutBtn = document.getElementById('user-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('csl_session');
            window.location.href = 'index.html';
        });
    }
}

function setupLectures() {
    const filterButtons = document.querySelectorAll('.filter-buttons button');
    const videoGrid = document.getElementById('video-grid');
    
    if (!videoGrid) return;

    fetch('/api/videos')
        .then(r => r.json())
        .then(data => {
            const videos = data.videos || [];
            
            filterButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    const category = btn.dataset.category;
                    renderVideos(videos, category === 'all' ? null : category);
                });
            });
            
            renderVideos(videos);
        })
        .catch(err => console.error('Failed to load videos:', err));
}

function renderVideos(videos, filterCategory = null) {
    const grid = document.getElementById('video-grid');
    if (!grid) return;

    const filtered = filterCategory ? 
        videos.filter(v => v.category === filterCategory) : 
        videos;

    grid.innerHTML = filtered.map(video => `
        <div class="video-card">
            <div class="video-thumbnail">▶️</div>
            <div class="video-card-content">
                <h3 class="video-card-title">${video.title}</h3>
                <p class="video-card-category">${video.category}</p>
                <p>${video.description || ''}</p>
                <a href="${video.youtubeUrl}" target="_blank" class="button button-sm">Watch Video</a>
            </div>
        </div>
    `).join('');
}

function setupForum() {
    const newTopicBtn = document.getElementById('new-topic-btn');
    const newTopicForm = document.getElementById('new-topic-form');
    const cancelBtn = document.getElementById('cancel-topic');
    const forumForm = document.getElementById('forum-post-form');
    
    if (!newTopicBtn) return;

    newTopicBtn.addEventListener('click', () => {
        newTopicForm.style.display = newTopicForm.style.display === 'none' ? 'block' : 'none';
    });

    cancelBtn?.addEventListener('click', () => {
        newTopicForm.style.display = 'none';
    });

    forumForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const session = localStorage.getItem('csl_session');
        if (!session) {
            alert('Please sign in to post.');
            return;
        }
        
        const member = JSON.parse(session);
        const title = forumForm.title.value;
        const category = forumForm.category.value;
        const message = forumForm.message.value;

        try {
            const response = await fetch('/api/forum/threads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, category, memberId: member.id, message })
            });
            
            if (response.ok) {
                showFormMessage('form-message', 'Discussion posted!', true);
                forumForm.reset();
                newTopicForm.style.display = 'none';
                loadForum();
            } else {
                showFormMessage('form-message', 'Failed to post discussion.', false);
            }
        } catch (error) {
            showFormMessage('form-message', error.message, false);
        }
    });

    loadForum();
}

function loadForum() {
    fetch('/api/forum/threads')
        .then(r => r.json())
        .then(data => {
            const forumList = document.getElementById('forum-threads');
            if (!forumList) return;
            
            forumList.innerHTML = (data.threads || []).map(thread => `
                <div class="forum-card">
                    <h3 class="forum-card-title">${thread.title}</h3>
                    <span class="forum-card-category">${thread.category}</span>
                    <p class="forum-card-meta">
                        Posted by ${thread.fullName} • ${thread.postCount} replies
                    </p>
                </div>
            `).join('');
        })
        .catch(err => console.error('Failed to load forum:', err));
}

function setupForms() {
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    const signinForm = document.getElementById('signin-form');
    if (signinForm) {
        signinForm.addEventListener('submit', handleSignin);
    }
    const adminLoginForm = document.getElementById('admin-login-form');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }
    const uploadNotesForm = document.getElementById('upload-notes-form');
    if (uploadNotesForm) {
        uploadNotesForm.addEventListener('submit', handleUploadNotes);
    }
    if (document.getElementById('profile-nav-link')) {
        loadUserProfile();
        setupProfileTabs();
    }
    setupUserLogout();
}

window.addEventListener('DOMContentLoaded', () => {
    setActiveNav();
    renderEvents();
    setupEventFilters();
    setupLectures();
    setupForum();
    setupForms();
});
