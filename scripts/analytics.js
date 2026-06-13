// Analytics Dashboard JavaScript

let chartsData = {};

async function loadAnalyticsData() {
    try {
        const response = await fetch('/api/analytics', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('csl_admin_token') || ''}` }
        });
        if (!response.ok) throw new Error('Failed to load analytics');
        chartsData = await response.json();
        displayStats();
        renderCharts();
    } catch (error) {
        console.error('Analytics load error:', error);
    }
}

function displayStats() {
    document.getElementById('total-members').textContent = chartsData.totalMembers || 0;
    document.getElementById('verified-members').textContent = chartsData.verifiedMembers || 0;
    document.getElementById('events-count').textContent = chartsData.eventCount || 0;
    document.getElementById('resources-count').textContent = chartsData.resourceCount || 0;
    document.getElementById('engagement-rate').textContent = chartsData.engagementRate || '0%';
    document.getElementById('forum-avg').textContent = (chartsData.forumPostsPerWeek || 0).toFixed(1);
    document.getElementById('events-avg').textContent = (chartsData.eventsPerMonth || 0).toFixed(1);
    document.getElementById('update-time').textContent = new Date().toLocaleString();
}

function renderCharts() {
    // Members by Role Chart
    const roleCtx = document.getElementById('roleChart')?.getContext('2d');
    if (roleCtx && chartsData.membersByRole) {
        new Chart(roleCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(chartsData.membersByRole),
                datasets: [{
                    data: Object.values(chartsData.membersByRole),
                    backgroundColor: ['#0b5bbf', '#2f9d27', '#f2c94c', '#0f4d91'],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    // Membership Growth Chart
    const growthCtx = document.getElementById('growthChart')?.getContext('2d');
    if (growthCtx && chartsData.growthData) {
        new Chart(growthCtx, {
            type: 'line',
            data: {
                labels: chartsData.growthData.months,
                datasets: [{
                    label: 'New Members',
                    data: chartsData.growthData.values,
                    borderColor: '#0b5bbf',
                    backgroundColor: 'rgba(11, 91, 191, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    // Event Attendance Chart
    const attendanceCtx = document.getElementById('attendanceChart')?.getContext('2d');
    if (attendanceCtx && chartsData.eventAttendance) {
        new Chart(attendanceCtx, {
            type: 'bar',
            data: {
                labels: chartsData.eventAttendance.events,
                datasets: [{
                    label: 'Attendees',
                    data: chartsData.eventAttendance.counts,
                    backgroundColor: '#2f9d27',
                    borderColor: '#1b7b1c',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    // Resources by Category Chart
    const categoryCtx = document.getElementById('categoryChart')?.getContext('2d');
    if (categoryCtx && chartsData.resourcesByCategory) {
        new Chart(categoryCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(chartsData.resourcesByCategory),
                datasets: [{
                    label: 'Resources',
                    data: Object.values(chartsData.resourcesByCategory),
                    backgroundColor: ['#0b5bbf', '#2f9d27', '#f2c94c', '#0f4d91'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

document.getElementById('download-report')?.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/download-report');
        if (!response.ok) throw new Error('Failed to download report');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CSL_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    } catch (error) {
        alert('Error downloading report: ' + error.message);
    }
});

window.addEventListener('DOMContentLoaded', loadAnalyticsData);
