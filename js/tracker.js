// CONFIGURATION
// REPLACE THE URL BELOW with your "Publish to Web > CSV" link from Google Sheets
const SHEET_CSV_URL = "";

document.addEventListener('DOMContentLoaded', () => {
    const trackerContainer = document.getElementById('tracker-container');
    const searchInput = document.getElementById('search-input');
    const filterIntake = document.getElementById('filter-intake');
    const filterPortal = document.getElementById('filter-portal');
    const filterStatus = document.getElementById('filter-status');
    const resultCount = document.getElementById('result-count');

    let allAdmissions = [];

    init();

    function init() {
        if (SHEET_CSV_URL && SHEET_CSV_URL.length > 10) {
            console.log("Fetching from Google Sheets...");
            fetch(SHEET_CSV_URL)
                .then(response => response.text())
                .then(csvText => {
                    const data = parseCSV(csvText);
                    allAdmissions = data;
                    renderCards(allAdmissions);
                })
                .catch(err => {
                    console.error("Sheet Fetch Error, falling back to local JSON:", err);
                    fetchLocalJSON();
                });
        } else {
            console.log("No Sheet URL configured, using local JSON.");
            fetchLocalJSON();
        }
    }

    function fetchLocalJSON() {
        fetch('data/admissions.json')
            .then(response => response.json())
            .then(data => {
                allAdmissions = data;
                renderCards(allAdmissions);
            })
            .catch(error => console.error('Error loading local data:', error));
    }

    // Simple CSV Parser
    function parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '')); // Remove quotes

        const results = [];

        for (let i = 1; i < lines.length; i++) {
            // Handle commas inside quotes properly-ish (Basic regex split)
            const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            if (!row) continue;

            // Normalize row data
            const cleanRow = row.map(val => val.replace(/^"|"$/g, '').trim()); // Remove quotes

            // Map to our Object Structure
            // Expected Sheet Cols: University, Program, Intake, Deadline, Portal, Cost, Link, Tags
            const entry = {
                university: cleanRow[0] || "Unknown Uni",
                program: cleanRow[1] || "Unknown Program",
                intake: cleanRow[2] || "Unknown",
                deadline_date: cleanRow[3] || "2026-01-01",
                portal_type: cleanRow[4] || "Direct",
                cost_type: cleanRow[5] || "Free",
                link: cleanRow[6] || "#",
                tags: (cleanRow[7] || "").split(',').map(t => t.trim()),
                is_open: true // Calculated dynamically by date usually
            };
            results.push(entry);
        }
        return results;
    }

    // Render Logic
    function renderCards(data) {
        trackerContainer.innerHTML = '';

        if (data.length === 0) {
            trackerContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">No results match your filters.</div>';
            resultCount.textContent = '0 results';
            return;
        }

        resultCount.textContent = `${data.length} results`;

        data.forEach(item => {
            // Calculate Days Left
            const today = new Date();
            const deadline = new Date(item.deadline_date);
            const timeDiff = deadline - today;
            const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

            let deadlineClass = 'badge-neutral';
            let deadlineText = `${daysLeft} days left`;
            let isOpen = true;

            // Date Logic overrides manual 'is_open'
            if (daysLeft < 0) {
                deadlineClass = 'badge-closed';
                deadlineText = 'Closed';
                isOpen = false;
            } else if (daysLeft < 14) {
                deadlineClass = 'badge-urgent';
            } else if (daysLeft > 60) {
                deadlineClass = 'badge-safe';
            }

            const card = document.createElement('div');
            card.className = `tracker-item ${!isOpen ? 'opacity-50' : ''}`;

            card.innerHTML = `
                <div class="tracker-col-main">
                    <h3 class="tracker-program">${item.program}</h3>
                    <div class="tracker-uni">${item.university}</div>
                    <div class="mobile-only-meta">
                        <span class="meta-tag-sm">${item.intake}</span>
                        <span class="meta-tag-sm">${item.portal_type}</span>
                    </div>
                </div>
                
                <div class="tracker-col-intake desktop-only">${item.intake}</div>
                <div class="tracker-col-portal desktop-only">${item.portal_type}</div>
                
                <div class="tracker-col-deadline">
                   <div class="deadline-badge-row ${deadlineClass}">
                        ${deadlineText}
                   </div>
                   <div style="font-size:0.75rem; color:var(--text-muted);">${item.deadline_date}</div>
                </div>

                <div class="tracker-col-action">
                    <a href="${item.link}" target="_blank" class="btn btn-sm btn-secondary" ${!isOpen ? 'disabled style="pointer-events:none;"' : ''}>
                        View &rarr;
                    </a>
                </div>
            `;

            trackerContainer.appendChild(card);
        });
    }

    // Filter Logic
    function filterData() {
        const searchTerm = searchInput.value.toLowerCase();
        const intakeValue = filterIntake.value;
        const portalValue = filterPortal.value;
        const statusValue = filterStatus.value; // 'all', 'open', 'closed'

        const filtered = allAdmissions.filter(item => {
            // Search Text
            const matchesSearch = item.university.toLowerCase().includes(searchTerm) ||
                item.program.toLowerCase().includes(searchTerm) ||
                item.tags.some(tag => tag.toLowerCase().includes(searchTerm));

            // Intake
            const matchesIntake = intakeValue === 'all' || item.intake.includes(intakeValue);

            // Portal
            const matchesPortal = portalValue === 'all' || item.portal_type.includes(portalValue);

            // Status (Calculated)
            const today = new Date();
            const deadline = new Date(item.deadline_date);
            const isActuallyOpen = (deadline >= today);

            let matchesStatus = true;
            if (statusValue === 'open') matchesStatus = isActuallyOpen;
            if (statusValue === 'closed') matchesStatus = !isActuallyOpen;

            return matchesSearch && matchesIntake && matchesPortal && matchesStatus;
        });

        renderCards(filtered);
    }

    // Event Listeners
    searchInput.addEventListener('input', filterData);
    filterIntake.addEventListener('change', filterData);
    filterPortal.addEventListener('change', filterData);
    filterStatus.addEventListener('change', filterData);
});
