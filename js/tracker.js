// CONFIGURATION
// REPLACE with your Google Apps Script Web App URL
const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyeSm-5xl0xBUJGZMsr4CZzHbmPyyk7KxdbWLv_uyUEzaTM9Pu5SxsXC9MbsVaI8XA8/exec";

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
        if (SHEET_API_URL && SHEET_API_URL.length > 10) {
            console.log("Fetching from Google Apps Script API...");
            fetch(SHEET_API_URL)
                .then(response => response.json())
                .then(data => {
                    // Apps Script returns raw objects with header keys
                    // We map them to ensure our internal variable names match
                    allAdmissions = normalizeSheetData(data);
                    renderCards(allAdmissions);
                })
                .catch(err => {
                    console.error("API Fetch Error, falling back to local JSON:", err);
                    fetchLocalJSON();
                });
        } else {
            console.log("No API URL configured, using local JSON.");
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

    // Convert Sheet Columns to our Internal Schema
    function normalizeSheetData(sheetData) {
        return sheetData.map(item => {
            return {
                university: item.University || item.university || "Unknown",
                program: item.Program || item.program || "Unknown",
                intake: item.Intake || item.intake || "",
                deadline_date: formatDate(item.Deadline || item.deadline), // Helper to ensure YYYY-MM-DD
                portal_type: item.Portal || item.portal || "Direct",
                cost_type: item.Cost || item.cost || "Free",
                link: item.Link || item.link || "#",
                tags: (item.Tags || item.tags || "").split(',').map(t => t.trim()),
                is_open: true // Handled by date calculation
            };
        });
    }

    // Helper to handle Sheet Date Strings if they come in weird formats
    function formatDate(dateInput) {
        if (!dateInput) return "2026-01-01";
        // If it's already a standard string, return it. 
        // Google Script might return ISO string "2026-07-15T00:00:00.000Z" which is fine.
        if (dateInput.toString().includes('T')) {
            return dateInput.toString().split('T')[0];
        }
        return dateInput;
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
