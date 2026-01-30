
// Configuration with API Endpoints 
// only legend is accessing your data :
// Shout out to you Waleed Ashraf
const API_CONFIG = {
    july25: {
        url: "https://script.google.com/macros/s/AKfycbyq-sZgQa5L1EzAklUJ2VaDbDv9rrjtFoMKWbJKyNNh5M8XKD0gEEDETz4V4I_eNhCW4A/exec",
        label: "July 2025"
    },
    augOct25: {
        url: "https://script.google.com/macros/s/AKfycbzMZdDO16OpcSAVldoGVxVxRJ44z58avalej2ORnkY6IGNe180Y_Vbhbtq_s9hROiI43A/exec",
        label: "Aug - Oct 2025"
    },
    novDec25: {
        url: "https://script.google.com/macros/s/AKfycbxB7Xt4hWljI4dw34skJFcIaBE-BR0-wacaZTP8REPwKUNnlFZ07NA9JlCgK1OZzt65CQ/exec",
        label: "Nov - Dec 2025"
    },
    janFeb26: {
        url: "https://script.google.com/macros/s/AKfycbxSznzkfuZH0lyps0_35DVF2jcDV4pFV7nKOMJZX0bce1fOYNCLTUbmbdYHtcEwa2JsYQ/exec",
        label: "Jan - Feb 2026"
    }
};

// State
let currentCategory = 'july25';
let dataCache = {};

// On Load
document.addEventListener('DOMContentLoaded', () => {
    loadCategory(currentCategory);
});

// Main Load Function
async function loadCategory(categoryKey) {
    currentCategory = categoryKey;

    // Update UI Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(categoryKey)) {
            btn.classList.add('active');
        }
    });

    // Show Loading
    const tbody = document.getElementById('tracker-body');
    const loading = document.getElementById('loading-indicator');
    const stats = document.getElementById('stats-badge');

    tbody.innerHTML = '';
    loading.style.display = 'block';
    stats.textContent = 'loading...';

    try {
        let data;
        // Check Cache
        if (dataCache[categoryKey]) {
            data = dataCache[categoryKey];
        } else {
            const response = await fetch(API_CONFIG[categoryKey].url);
            data = await response.json();
            dataCache[categoryKey] = data;
        }

        renderTable(data);
        loading.style.display = 'none';

    } catch (error) {
        console.error("Error fetching data:", error);
        loading.innerHTML = `<span style="color:red">Error loading data. Please try again.</span>`;
        stats.textContent = 'Error';
    }
}

// Render Logic
function renderTable(data) {
    const tbody = document.getElementById('tracker-body');
    const stats = document.getElementById('stats-badge');

    // Update Count
    const count = Array.isArray(data) ? data.length : 0;
    stats.textContent = `${count} Applicants`;

    if (count === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">No data found.</td></tr>`;
        return;
    }

    // Sort by Join Date (Oldest First)
    // Assuming data API might not be perfectly sorted
    data.sort((a, b) => new Date(a.joinDate) - new Date(b.joinDate));

    let lastJoinDate = '';

    data.forEach(item => {

        // Helper to format dates safely
        const formatDate = (dateString, isTime = false) => {
            if (!dateString) return '<span class="no-date">-</span>';
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString; // If valid string but not date

            if (isTime) {
                // If year is 1899, it's just a time value from Google Sheets
                return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            }
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        };

        const currentJoinDate = formatDate(item.joinDate);

        // Date Header
        if (currentJoinDate !== lastJoinDate) {
            const headerRow = document.createElement('tr');
            headerRow.className = 'date-header';
            headerRow.innerHTML = `
                <td colspan="6" style="background:var(--bg-body); font-weight:700; color:var(--text-secondary); padding:0.75rem 1rem; border-top:1px solid var(--border-light); border-bottom:1px solid var(--border-light);">
                    📅 Joined: <span style="color:var(--text-primary)">${currentJoinDate}</span>
                </td>
            `;
            tbody.appendChild(headerRow);
            lastJoinDate = currentJoinDate;
        }

        const formatStatusDate = (dateString) => {
            if (!dateString) return '<span class="status-badge no-date">-</span>';
            return `<span class="status-badge has-date">${formatDate(dateString)}</span>`;
        };

        const formatCorrection = (text) => {
            if (!text) return '<span class="status-badge no-date">-</span>';
            return `<span class="status-badge correction" title="${text}">${text}</span>`;
        };

        const row = document.createElement('tr');

        row.innerHTML = `
            <td data-label="Full Name" style="font-weight:600; padding-left:1.5rem;">${item.fullName || 'Anonymous'}</td>
            <td data-label="Time">${formatDate(item.joinTime, true)}</td>
            <td data-label="Got Submission" class="status-cell">${formatStatusDate(item.gotSubmission)}</td>
            <td data-label="Submitted" class="status-cell">${formatStatusDate(item.submitted)}</td>
            <td data-label="Correction" class="status-cell">${formatCorrection(item.correction)}</td>
            <td data-label="Appointment" class="status-cell">${formatStatusDate(item.appointment)}</td>
        `;

        tbody.appendChild(row);
    });
}

// Weekly Summary Logic
let currentWeekOffset = 0;

function openSummaryModal() {
    currentWeekOffset = 0; // Reset to current week
    const modal = document.getElementById('summaryModal');
    const content = document.getElementById('summary-content');

    // Update Header with Timeframe
    const title = document.getElementById('summary-title');
    if (title && API_CONFIG && API_CONFIG[currentCategory]) {
        title.innerHTML = 'Weekly Activity Report <span style="font-weight:400; font-size:0.9em; color:var(--text-secondary)"> - ' + API_CONFIG[currentCategory].label + '</span>';
    }

    modal.classList.add('active');

    // Check if data is available
    if (!dataCache[currentCategory]) {
        content.innerHTML = '<p class="text-center">Data not loaded yet.</p>';
        return;
    }

    generateWeeklySummary(dataCache[currentCategory]);
}

function changeWeek(offset) {
    currentWeekOffset += offset;
    updateSummaryView();
}

function updateSummaryView() {
    const content = document.getElementById('summary-content');

    // Check if data is available
    if (!dataCache[currentCategory]) {
        content.innerHTML = '<p class="text-center">Data not loaded yet.</p>';
        return;
    }

    generateWeeklySummary(dataCache[currentCategory], currentWeekOffset);
}

// Close logic in HTML (onclick) or we can add listener here

function generateWeeklySummary(data, offset = 0) {
    const content = document.getElementById('summary-content');
    const today = new Date(); // Use system time (which is set to Jan 30 2026 by metadata)

    // Calculate start of the target week (Monday)
    // 1. Get current week's Monday
    const currentDay = today.getDay(); // 0-6
    const diffToMonday = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const currentWeekMonday = new Date(today);
    currentWeekMonday.setDate(diffToMonday);
    currentWeekMonday.setHours(0, 0, 0, 0);

    // 2. Apply offset (weeks)
    const targetMonday = new Date(currentWeekMonday);
    targetMonday.setDate(targetMonday.getDate() + (offset * 7));

    // 3. Target Sunday (End of week)
    const targetSunday = new Date(targetMonday);
    targetSunday.setDate(targetMonday.getDate() + 6);
    targetSunday.setHours(23, 59, 59, 999);

    // UI for Navigation
    const dateRangeStr = `${targetMonday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${targetSunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    let navHtml = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; background:var(--bg-body); padding:0.5rem; border-radius:8px; border:1px solid var(--border-light);">
            <button onclick="changeWeek(-1)" style="border:none; background:none; cursor:pointer; font-weight:600; color:var(--accent-primary); padding:0.5rem;">&larr; Prev Week</button>
            <span style="font-weight:600; font-size:0.9rem;">${dateRangeStr}</span>
            <button onclick="changeWeek(1)" style="border:none; background:none; cursor:pointer; font-weight:600; color:var(--accent-primary); padding:0.5rem;">Next Week &rarr;</button>
        </div>
    `;

    // Group updates by date
    // Structure: { "2026-01-30": { submitted: [], gotSub: [], appt: [], corr: [] } }
    const weeklyUpdates = {};
    const dailyStats = { submitted: 0, correction: 0, appointment: 0, gotSubmission: 0 };

    // Helper to add update
    const addUpdate = (rawContent, type, personName, joinDate) => {
        if (!rawContent) return;

        let datesToProcess = [];

        // 1. Try strict date first (standard columns or single date)
        const strictDate = new Date(rawContent);
        if (!isNaN(strictDate.getTime())) {
            datesToProcess.push(strictDate);
        }

        // 2. If it's a correction, try to find ALL dates in the string
        if (type === 'correction') {
            const months = 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec';
            const regex = new RegExp(`(\\d{1,2}[-\\s](?:${months})[a-z]*(?:[-\\s]\\d{2,4})?)|((?:${months})[a-z]*[-\\s]\\d{1,2}(?:[-\\s],?\\s?\\d{2,4})?)|(\\d{1,2}[\\/\\-\\.]\\d{1,2}[\\/\\-\\.]\\d{2,4})`, 'gi');

            const matches = [...String(rawContent).matchAll(regex)];

            if (matches.length > 0) {
                // If regex found dates, use them. Reset previous strict match to avoid duplication/errors if strict match was weird.
                datesToProcess = [];

                matches.forEach(match => {
                    let dateString = match[0];
                    if (!/\d{4}/.test(dateString)) {
                        dateString += ` ${new Date().getFullYear()}`; // Default to 2026
                    }
                    const d = new Date(dateString);
                    if (!isNaN(d.getTime())) {
                        datesToProcess.push(d);
                    }
                });
            }
        }

        // Process all found dates
        datesToProcess.forEach(date => {
            // Filter: Must be within target week
            if (date >= targetMonday && date <= targetSunday) {
                const dateKey = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

                if (!weeklyUpdates[dateKey]) {
                    weeklyUpdates[dateKey] = { updates: [] };
                }

                // Pass original content for display
                weeklyUpdates[dateKey].updates.push({ type, name: personName, joinDate, content: rawContent });

                // Stats logic
                dailyStats[type]++;
            }
        });
    };

    // Iterate Data
    data.forEach(item => {
        // We track updates only
        addUpdate(item.gotSubmission, 'gotSubmission', item.fullName, item.joinDate);
        addUpdate(item.submitted, 'submitted', item.fullName, item.joinDate);
        addUpdate(item.correction, 'correction', item.fullName, item.joinDate);
        addUpdate(item.appointment, 'appointment', item.fullName, item.joinDate);
    });

    let html = navHtml;

    // 1. Overall Stats for the Week
    const totalUpdates = dailyStats.gotSubmission + dailyStats.submitted + dailyStats.correction + dailyStats.appointment;

    html += `
        <div class="summary-block">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem">
                <h4 style="margin:0; color:var(--text-primary)">Summary for this Period</h4>
                <div class="badge-update" style="background:var(--text-primary); color:var(--bg-body); font-size:0.9rem; border:1px solid var(--text-primary);">
                    Total Activity: <strong>${totalUpdates}</strong>
                </div>
            </div>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:0.75rem;">
                <div class="badge-update sub" style="font-size:0.9rem; padding:0.5rem 1rem; text-align:center;">
                    Submission Emails: <strong>${dailyStats.gotSubmission}</strong>
                </div>
                <div class="badge-update" style="background:#E0E7FF; color:#3730A3; font-size:0.9rem; padding:0.5rem 1rem; text-align:center;">
                    Files Submitted: <strong>${dailyStats.submitted}</strong>
                </div>
                <div class="badge-update corr" style="font-size:0.9rem; padding:0.5rem 1rem; text-align:center;">
                    Corrections: <strong>${dailyStats.correction}</strong>
                </div>
                <div class="badge-update app" style="font-size:0.9rem; padding:0.5rem 1rem; text-align:center;">
                    Appointments: <strong>${dailyStats.appointment}</strong>
                </div>
            </div>
        </div>
    `;

    // 2. Daily Breakdown Loop
    const sortedDates = Object.keys(weeklyUpdates).sort((a, b) => new Date(b) - new Date(a)); // Newest first

    if (sortedDates.length === 0) {
        html += '<p class="text-center" style="color:var(--text-muted); padding:2rem;">No updates found for this week.</p>';
    } else {
        html += '<h4 style="margin-bottom:1rem;color:var(--text-primary)">Daily Breakdown</h4>';

        sortedDates.forEach(dateKey => {
            html += `<span class="summary-date">${dateKey}</span>`;

            weeklyUpdates[dateKey].updates.forEach(upd => {
                let badge = '';
                let text = '';

                // Format helper
                const jDate = upd.joinDate ? new Date(upd.joinDate).toLocaleDateString() : 'Unknown';
                const joinedInfo = `<span style="color:var(--text-muted); font-size:0.85em; margin-left:4px;">(Joined: ${jDate})</span>`;


                if (upd.type === 'gotSubmission') {
                    badge = '<span class="badge-update sub">Got Submission Email</span>';
                    text = `<strong>${upd.name || 'Anonymous'}</strong> ${joinedInfo} received submission request.`;
                } else if (upd.type === 'submitted') {
                    badge = '<span class="badge-update" style="background:#E0E7FF; color:#3730A3">Submitted</span>';
                    text = `<strong>${upd.name || 'Anonymous'}</strong> ${joinedInfo} submitted their file.`;
                } else if (upd.type === 'correction') {
                    badge = '<span class="badge-update corr">Correction</span>';
                    // Show content if available, else generic message
                    const corrText = upd.content || 'received a correction request';
                    text = `<strong>${upd.name || 'Anonymous'}</strong> ${joinedInfo}: ${corrText}`;
                } else if (upd.type === 'appointment') {
                    badge = '<span class="badge-update app">Appointment</span>';
                    text = `<strong>${upd.name || 'Anonymous'}</strong> ${joinedInfo} booked an appointment!`;
                }

                html += `
                    <div class="summary-item">
                        <div style="min-width:120px">${badge}</div>
                        <div style="color:var(--text-secondary)">${text}</div>
                    </div>
                `;
            });
            html += '<br>';
        });
    }

    content.innerHTML = html;
}
