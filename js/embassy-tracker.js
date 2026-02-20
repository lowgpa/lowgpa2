
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
    // Show Loading
    const tbody = document.getElementById('tracker-body');
    const loading = document.getElementById('loading-indicator');
    const statsContainer = document.getElementById('overall-stats-container');

    tbody.innerHTML = '';

    // 1. Skeleton Stats (Detailed with Loading Bar)
    const skeletonCard = `
        <div class="stat-card" style="border-color: transparent;">
            <div class="skeleton" style="width: 52px; height: 52px; border-radius: 12px; flex-shrink: 0;"></div>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
                <div class="skeleton" style="height: 10px; width: 40%; border-radius: 4px;"></div>
                <div class="skeleton" style="height: 24px; width: 60%; border-radius: 4px;"></div>
                <div class="skeleton" style="height: 10px; width: 30%; border-radius: 4px;"></div>
                <div class="skeleton" style="height: 6px; width: 100%; border-radius: 99px; margin-top: 4px;"></div>
            </div>
        </div>
    `;

    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="stats-summary-container">
                ${skeletonCard}
                ${skeletonCard}
                ${skeletonCard}
            </div>
        `;
    }

    // Skeleton Table Rows
    const skeletonRow = `
        <tr>
            <td style="text-align: center;"><div class="skeleton" style="height: 15px; width: 20px; border-radius: 4px; display:inline-block;"></div></td>
            <td><div class="skeleton" style="height: 15px; width: 120px; border-radius: 4px;"></div></td>
            <td><div class="skeleton" style="height: 15px; width: 60px; border-radius: 4px;"></div></td>
            <td><div class="skeleton" style="height: 24px; width: 90px; border-radius: 99px;"></div></td>
            <td><div class="skeleton" style="height: 24px; width: 90px; border-radius: 99px;"></div></td>
            <td><div class="skeleton" style="height: 24px; width: 90px; border-radius: 99px;"></div></td>
        </tr>
    `;

    tbody.innerHTML = `
        <tr class="date-header">
            <td colspan="6" style="background:#F8FAFC; padding:1rem 1.5rem; border-top:1px solid var(--border-light); border-bottom:1px solid var(--border-light);">
                <div class="skeleton" style="height: 48px; width: 200px; border-radius: 8px;"></div>
            </td>
        </tr>
        ${skeletonRow.repeat(5)}
    `;

    // Hide standard loading text Since we use Skeleton
    loading.style.display = 'none';

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

        // Once data is returned, we need to clear the skeleton before rendering
        tbody.innerHTML = '';
        renderTable(data);

    } catch (error) {
        console.error("Error fetching data:", error);
        loading.innerHTML = `<span style="color:red">Error loading data. Please try again.</span>`;
    }
}

// Render Logic
function renderTable(data) {
    const tbody = document.getElementById('tracker-body');
    const statsContainer = document.getElementById('overall-stats-container');

    // Reset Container
    if (statsContainer) statsContainer.innerHTML = '';

    // Update Count
    const count = Array.isArray(data) ? data.length : 0;

    if (count === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">No data found.</td></tr>`;
        return;
    }

    // --- 1. Calculate Overall Stats ---
    let totalGotSubmission = 0;
    let totalAppointments = 0;

    // Pre-process for sorting and counting
    data.forEach(item => {
        if (item.gotSubmission) totalGotSubmission++;
        if (item.appointment) totalAppointments++;
    });

    const subPercent = Math.round((totalGotSubmission / count) * 100) || 0;
    const appPercent = Math.round((totalAppointments / count) * 100) || 0;

    // Render Stats Tile
    // Render Stats Tile
    if (statsContainer) {
        // SGV Icons
        const iconTotal = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
        const iconSub = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
        const iconApp = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;

        statsContainer.innerHTML = `
        <div class="stats-summary-container">
            <div class="stat-card fade-in-up delay-1">
                <div class="stat-icon-wrapper" style="background: #EEF2FF; color: #4F46E5;">
                    ${iconTotal}
                </div>
                <div class="stat-content">
                    <h4>Total Applicants</h4>
                    <div class="stat-value">${count}</div>
                    <div class="stat-meta">Tracking active cases</div>
                </div>
            </div>

            <div class="stat-card fade-in-up delay-2">
                <div class="stat-icon-wrapper" style="background: #ECFDF5; color: #059669;">
                    ${iconSub}
                </div>
                <div class="stat-content" style="width:100%">
                    <h4>Got Submission</h4>
                    <div class="stat-value">${totalGotSubmission}</div>
                    <div class="stat-meta">${subPercent}% of total</div>
                    <div class="progress-bg">
                        <div class="progress-fill" style="width: ${subPercent}%; background: #059669;"></div>
                    </div>
                </div>
            </div>

            <div class="stat-card fade-in-up delay-3">
                <div class="stat-icon-wrapper" style="background: #FFF7ED; color: #EA580C;">
                    ${iconApp}
                </div>
                <div class="stat-content" style="width:100%">
                    <h4>Appointments</h4>
                    <div class="stat-value">${totalAppointments}</div>
                    <div class="stat-meta">${totalAppointments} out of ${count} total</div>
                    <div class="progress-bg">
                        <div class="progress-fill" style="width: ${appPercent}%; background: #EA580C;"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    }



    // --- 3. Sort & Date Grouping Logic ---
    // Sort by Join Date (Oldest First)
    // Sort by Join Date (Oldest First), then by Join Time
    data.sort((a, b) => {
        const dateA = new Date(a.joinDate);
        const dateB = new Date(b.joinDate);
        const diff = dateA - dateB;
        if (diff !== 0) return diff;

        // Secondary sort by time
        const getTime = (t) => {
            if (!t) return '';
            // If ISO string with T, extract time part
            if (typeof t === 'string' && t.includes('T')) {
                return t.split('T')[1];
            }
            return t; // Fallback
        };

        return getTime(a.joinTime).localeCompare(getTime(b.joinTime));
    });

    // Pre-calculate counts per join date
    const dateCounts = {};
    data.forEach(item => {
        const jDate = item.joinDate ? new Date(item.joinDate).toDateString() : 'Unknown';
        dateCounts[jDate] = (dateCounts[jDate] || 0) + 1;
    });

    let lastJoinDate = '';

    let rowNumber = 1;

    data.forEach(item => {

        // Helper to format dates safely
        const formatDate = (dateString, isTime = false) => {
            if (!dateString) return '<span class="no-date">-</span>';

            // Special handling for joinTime to avoid timezone conversion
            if (isTime && typeof dateString === 'string' && dateString.includes('T')) {
                const timePart = dateString.split('T')[1];
                if (timePart) {
                    return timePart.substring(0, 5); // Returns HH:mm in 24h format
                }
            }

            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString; // If valid string but not date

            if (isTime) {
                // Determine 24-hour format fallback or just time string
                return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            }
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        };

        const currentJoinDateObj = item.joinDate ? new Date(item.joinDate) : null;
        const currentJoinDateStr = currentJoinDateObj ? formatDate(item.joinDate) : 'Unknown Date';
        const currentJoinDateKey = currentJoinDateObj ? currentJoinDateObj.toDateString() : 'Unknown';

        // Date Header with Count (Feature R)
        if (currentJoinDateStr !== lastJoinDate) {
            const dayCount = dateCounts[currentJoinDateKey] || 0;
            const headerRow = document.createElement('tr');
            headerRow.className = 'date-header';

            let dateDisplayHtml = '';
            if (currentJoinDateObj && !isNaN(currentJoinDateObj.getTime())) {
                const shortMonth = currentJoinDateObj.toLocaleDateString('en-US', { month: 'short' });
                const dayNum = currentJoinDateObj.getDate();
                const yearNum = currentJoinDateObj.getFullYear();
                const fullDayName = currentJoinDateObj.toLocaleDateString('en-US', { weekday: 'long' });

                dateDisplayHtml = `
                    <div style="display:flex; align-items:center; gap:1.25rem;">
                        <div class="calendar-badge" style="transform: scale(0.95); transform-origin: left center; margin-right: -5px;">
                            <div class="calendar-badge-month">${shortMonth}</div>
                            <div class="calendar-badge-day">${dayNum}</div>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:2px;">
                            <span style="font-size:1.05rem; font-weight:700; color:var(--text-primary); text-transform:none; letter-spacing:normal;">${fullDayName}, ${shortMonth} ${dayNum}, ${yearNum}</span>
                            <span class="date-header-count" style="margin-left:0; align-self:flex-start; background:#F1F5F9; border:1px solid #E2E8F0; color:var(--text-secondary); padding: 2px 8px; border-radius:12px; font-weight:600; font-size: 0.75rem; text-transform:none;">${dayCount} Applicant${dayCount !== 1 ? 's' : ''} Joined</span>
                        </div>
                    </div>
                `;
            } else {
                dateDisplayHtml = `
                    <div style="display:flex; align-items:center; gap:1rem;">
                        <span style="font-size:1.05rem; font-weight:700; color:var(--text-primary); text-transform:none;">Unknown Date</span>
                        <span class="date-header-count" style="margin-left:0; background:#F1F5F9; border:1px solid #E2E8F0; color:var(--text-secondary); padding: 2px 8px; border-radius:12px; font-weight:600; font-size: 0.75rem; text-transform:none;">${dayCount} Applicant${dayCount !== 1 ? 's' : ''}</span>
                    </div>
                `;
            }

            headerRow.innerHTML = `
                <td colspan="6" style="background:#F8FAFC; padding:1rem 1.5rem; border-top:1px solid var(--border-light); border-bottom:1px solid var(--border-light);">
                    ${dateDisplayHtml}
                </td>
                `;
            tbody.appendChild(headerRow);
            lastJoinDate = currentJoinDateStr;
        }

        const formatStatusDate = (dateString, type) => {
            if (!dateString) return '<span class="status-badge no-date">-</span>';

            let badgeClass = 'status-badge has-date';
            if (type === 'appointment') badgeClass = 'status-badge appointment';

            let content = `<span class="${badgeClass}">${formatDate(dateString)}</span>`;

            // Wait Time Calculation (Feature Q)
            if (type === 'appointment' && item.joinDate) {
                const appDate = new Date(dateString);
                const joinDate = new Date(item.joinDate);
                if (!isNaN(appDate) && !isNaN(joinDate)) {
                    // Difference in milliseconds
                    const diffTime = Math.abs(appDate - joinDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    let clockClass = 'wait-time-badge';
                    if (diffDays > 60) clockClass += ' long';
                    else if (diffDays < 30) clockClass += ' short';

                    const clockIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:2px; position:relative; top:-1px"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;

                    content += `<div class="${clockClass}" style="margin-top:4px; display:inline-flex; align-items:center;" title="Days from joining to appointment">${clockIcon}${diffDays} days</div>`;
                }
            }
            return content;
        };

        const formatCorrection = (text) => {
            if (!text) return '<span class="status-badge no-date">-</span>';
            const display = text.length > 36 ? text.substring(0, 36) + '...' : text;
            return `<span class="status-badge correction" title="${text}">${display}</span>`;
        };

        const isNew = currentJoinDateObj && (new Date() - currentJoinDateObj) < (24 * 60 * 60 * 1000); // 24 hours
        const newBadge = isNew ? `<div style="width:8px; height:8px; background:var(--accent-primary); border-radius:50%; display:inline-block; margin-left:6px; animation: pulse 2s infinite;" title="Brand New!"></div>` : '';

        const row = document.createElement('tr');

        row.innerHTML = `
            <td style="text-align: center; color: var(--text-muted); font-weight: 500; font-size: 0.85rem;">${rowNumber++}</td>
            <td data-label="Full Name">
                <div style="font-weight:600; padding-left:1.5rem; position:relative; display:flex; align-items:center;">
                    ${item.fullName || 'Anonymous'}
                    ${newBadge}
                </div>
            </td>
            <td data-label="Time" style="color:var(--text-secondary); font-variant-numeric:tabular-nums;">${formatDate(item.joinTime, true)}</td>
            <td data-label="Got Submission" class="status-cell">${formatStatusDate(item.gotSubmission, 'submission')}</td>
            <td data-label="Correction" class="status-cell">${formatCorrection(item.correction)}</td>
            <td data-label="Appointment" class="status-cell">
                <div style="display:flex; flex-direction:column; align-items:flex-start;">
                    ${formatStatusDate(item.appointment, 'appointment')}
                </div>
            </td>
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
    const today = new Date();

    const currentDay = today.getDay();
    const diffToMonday = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const currentWeekMonday = new Date(today);
    currentWeekMonday.setDate(diffToMonday);
    currentWeekMonday.setHours(0, 0, 0, 0);

    const targetMonday = new Date(currentWeekMonday);
    targetMonday.setDate(targetMonday.getDate() + (offset * 7));

    const targetSunday = new Date(targetMonday);
    targetSunday.setDate(targetMonday.getDate() + 6);
    targetSunday.setHours(23, 59, 59, 999);

    const dateRangeStr = `${targetMonday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${targetSunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} `;

    let navHtml = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; background:var(--bg-body); padding:0.5rem; border-radius:8px; border:1px solid var(--border-light);">
            <button onclick="changeWeek(-1)" style="border:none; background:none; cursor:pointer; font-weight:600; color:var(--accent-primary); padding:0.5rem;">&larr; Prev Week</button>
            <span style="font-weight:600; font-size:0.9rem;">${dateRangeStr}</span>
            <button onclick="changeWeek(1)" style="border:none; background:none; cursor:pointer; font-weight:600; color:var(--accent-primary); padding:0.5rem;">Next Week &rarr;</button>
        </div>
    `;

    const weeklyUpdates = {};
    const dailyStats = { correction: 0, appointment: 0, gotSubmission: 0 };

    const addUpdate = (rawContent, type, personName, joinDate) => {
        if (!rawContent) return;

        let datesToProcess = [];
        const strictDate = new Date(rawContent);
        if (!isNaN(strictDate.getTime())) {
            datesToProcess.push(strictDate);
        }

        if (type === 'correction') {
            const months = 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec';
            const regex = new RegExp(`\\b(?:(\\d{1,2}[-\\s](?:${months})[a-z]*(?:[-\\s]\\d{4}|[-\\s]\\d{2}(?![-A-Za-z]))?)|((?:${months})[a-z]*[-\\s]\\d{1,2}(?:[-\\s],?\\s?\\d{2,4})?)|(\\d{1,2}[\\/\\-\\.]\\d{1,2}[\\/\\-\\.]\\d{2,4}))\\b`, 'gi');
            const matches = [...String(rawContent).matchAll(regex)];

            if (matches.length > 0) {
                datesToProcess = [];
                matches.forEach(match => {
                    let dateString = match[0];
                    dateString = dateString.replace(/[.,;]$/, '');
                    if (!/\d{4}/.test(dateString)) {
                        dateString += ` ${new Date().getFullYear()} `;
                    }
                    const d = new Date(dateString);
                    if (!isNaN(d.getTime())) {
                        datesToProcess.push(d);
                    }
                });
            }
        }

        datesToProcess.forEach(date => {
            if (date >= targetMonday && date <= targetSunday) {
                const dateKey = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
                if (!weeklyUpdates[dateKey]) {
                    weeklyUpdates[dateKey] = { updates: [] };
                }
                weeklyUpdates[dateKey].updates.push({ type, name: personName, joinDate, content: rawContent });
                dailyStats[type]++;
            }
        });
    };

    data.forEach(item => {
        addUpdate(item.gotSubmission, 'gotSubmission', item.fullName, item.joinDate);
        addUpdate(item.correction, 'correction', item.fullName, item.joinDate);
        addUpdate(item.appointment, 'appointment', item.fullName, item.joinDate);
    });

    let html = navHtml;
    const totalUpdates = dailyStats.gotSubmission + dailyStats.correction + dailyStats.appointment;

    html += `
        <div class="summary-block" style="background:#F8FAFC; border:1px solid #E2E8F0; padding:1.5rem; border-radius:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem">
                <h4 style="margin:0; color:var(--text-primary); font-size:1.1rem;">Summary for this Period</h4>
                <div class="stat-total" style="background:var(--accent-primary); box-shadow:0 2px 4px rgba(0,0,0,0.1);">Total Activity: ${totalUpdates}</div>
            </div>
            <div class="stats-grid">
                <div class="stat-item sub badge-update" style="display:flex; flex-direction:column; padding:1.25rem; border-radius:12px; background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); border: 1px solid #BFDBFE; align-items:center; text-align:center;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:0.75rem;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    <span style="font-size:0.85rem; text-transform:uppercase; letter-spacing:0.05em; color:#1E40AF; font-weight:700;">Submissions</span>
                    <strong style="font-size:2rem; margin-top:0.25rem; color:#1E3A8A; line-height:1;">${dailyStats.gotSubmission}</strong>
                </div>
                <div class="stat-item corr badge-update" style="display:flex; flex-direction:column; padding:1.25rem; border-radius:12px; background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border: 1px solid #FCD34D; align-items:center; text-align:center;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:0.75rem;"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    <span style="font-size:0.85rem; text-transform:uppercase; letter-spacing:0.05em; color:#92400E; font-weight:700;">Corrections</span>
                    <strong style="font-size:2rem; margin-top:0.25rem; color:#78350F; line-height:1;">${dailyStats.correction}</strong>
                </div>
                <div class="stat-item app badge-update" style="display:flex; flex-direction:column; padding:1.25rem; border-radius:12px; background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); border: 1px solid #A7F3D0; align-items:center; text-align:center;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:0.75rem;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <span style="font-size:0.85rem; text-transform:uppercase; letter-spacing:0.05em; color:#065F46; font-weight:700;">Appointments</span>
                    <strong style="font-size:2rem; margin-top:0.25rem; color:#064E3B; line-height:1;">${dailyStats.appointment}</strong>
                </div>
            </div>
        </div>
    `;

    const sortedDates = Object.keys(weeklyUpdates).sort((a, b) => new Date(b) - new Date(a));

    if (sortedDates.length === 0) {
        html += '<p class="text-center" style="color:var(--text-muted); padding:2rem;">No updates found for this week.</p>';
    } else {
        html += '<h4 style="margin-bottom:1rem; margin-top:2.5rem; color:var(--text-primary); font-size:1.25rem;">Daily Breakdown</h4>';
        sortedDates.forEach(dateKey => {
            const dateObj = new Date(dateKey);
            const shortMonth = dateObj.toLocaleDateString('en-US', { month: 'short' });
            const dayNum = dateObj.getDate();
            const dateTitle = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
            const dayUpdatesCount = weeklyUpdates[dateKey].updates.length;

            html += `
            <div class="daily-header-flex">
                <div class="calendar-badge">
                    <div class="calendar-badge-month">${shortMonth}</div>
                    <div class="calendar-badge-day">${dayNum}</div>
                </div>
                <div>
                    <h5 class="daily-date-title">${dateTitle}</h5>
                    <span class="daily-total-badge" style="display:inline-block; margin-top:0.25rem;">${dayUpdatesCount} Update${dayUpdatesCount !== 1 ? 's' : ''}</span>
                </div>
            </div>
            `;

            weeklyUpdates[dateKey].updates.forEach(upd => {
                let badge = '';
                let text = '';
                const jDate = upd.joinDate ? new Date(upd.joinDate).toLocaleDateString() : 'Unknown';
                const joinedInfo = `<span style="color:var(--text-muted); font-size:0.85em; margin-left:4px;">(Joined: ${jDate})</span>`;

                if (upd.type === 'gotSubmission') {
                    badge = '<span class="badge-update sub">Submission</span>';
                    text = `<strong>${upd.name || 'Anonymous'}</strong>${joinedInfo} received a submission request.`;
                } else if (upd.type === 'correction') {
                    badge = '<span class="badge-update corr">Correction</span>';
                    const corrText = upd.content || 'received a correction request';
                    text = `<strong>${upd.name || 'Anonymous'}</strong>${joinedInfo}: <span style="color:var(--text-primary); font-weight:500;">${corrText}</span>`;
                } else if (upd.type === 'appointment') {
                    badge = '<span class="badge-update app">Appointment</span>';
                    text = `<strong>${upd.name || 'Anonymous'}</strong>${joinedInfo} booked an appointment! 🎉`;
                }

                html += `
                    <div class="summary-item" style="position:relative; margin-left:10px;">
                        <div style="min-width:110px; display:flex; justify-content:flex-start;">${badge}</div>
                        <div style="color:var(--text-secondary); line-height:1.4;">${text}</div>
                    </div>
                `;
            });
        });
    }


    content.innerHTML = html;
}
