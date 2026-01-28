// CONFIGURATION
const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyeSm-5xl0xBUJGZMsr4CZzHbmPyyk7KxdbWLv_uyUEzaTM9Pu5SxsXC9MbsVaI8XA8/exec";

document.addEventListener('DOMContentLoaded', () => {
    const trackerContainer = document.getElementById('tracker-container');
    const searchInput = document.getElementById('search-input');
    const filterIntake = document.getElementById('filter-intake');
    const filterPortal = document.getElementById('filter-portal');
    const filterStatus = document.getElementById('filter-status');
    const filterFav = document.getElementById('filter-fav'); // New Favorites Toggle
    const resultCount = document.getElementById('result-count');
    const lastUpdatedEl = document.getElementById('last-updated-date');

    let allAdmissions = [];
    let favorites = JSON.parse(localStorage.getItem('lowgpa_favorites') || '[]');

    init();

    function init() {
        if (SHEET_API_URL && SHEET_API_URL.length > 10) {
            console.log("Fetching from Google Apps Script API...");
            fetch(SHEET_API_URL)
                .then(response => response.json())
                .then(data => {
                    allAdmissions = normalizeSheetData(data);
                    calculateLastUpdated(allAdmissions);
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

    function normalizeSheetData(sheetData) {
        return sheetData.map(item => {
            return {
                university: item.University || item.university || "Unknown",
                program: item.Program || item.program || "Unknown",
                intake: item.Intake || item.intake || "",
                opening_date: formatDate(item.Opening || item.opening), // New Column
                deadline_date: formatDate(item.Deadline || item.deadline),
                portal_type: item.Portal || item.portal || "Direct",
                // Cost removed
                link: item.Link || item.link || "#",
                tags: (item.Tags || item.tags || "").split(',').map(t => t.trim()),
                is_open: true
            };
        });
    }

    function formatDate(dateInput) {
        if (!dateInput) return "";
        if (dateInput.toString().includes('T')) {
            return dateInput.toString().split('T')[0];
        }
        return dateInput;
    }

    function calculateLastUpdated(data) {
        if (!lastUpdatedEl) return;
        const now = new Date();
        // Since we don't have a specific "updated_at" field, we'll use "Today" to signify Live Sync
        // or we could try to find the latest opening date?
        // Let's just say "Live" for now.
        const dateString = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        lastUpdatedEl.textContent = `Records updated on: ${dateString}`;
    }

    function toggleFavorite(id) {
        const index = favorites.indexOf(id);
        if (index === -1) {
            favorites.push(id);
        } else {
            favorites.splice(index, 1);
        }
        localStorage.setItem('lowgpa_favorites', JSON.stringify(favorites));
        filterData(); // Re-render
    }

    // Expose to window so onclick works
    window.toggleFavorite = toggleFavorite;

    function renderCards(data) {
        trackerContainer.innerHTML = '';

        if (data.length === 0) {
            trackerContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">No results match your filters.</div>';
            resultCount.textContent = '0 results';
            return;
        }

        resultCount.textContent = `${data.length} results`;

        data.forEach(item => {
            const today = new Date();
            const deadline = new Date(item.deadline_date);
            const opening = item.opening_date ? new Date(item.opening_date) : null;

            const timeDiff = deadline - today;
            const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

            // Generate unique ID for favorites
            const uniqueId = (item.university + item.program).replace(/\s+/g, '').toLowerCase();
            const isFav = favorites.includes(uniqueId);

            let deadlineClass = 'badge-neutral';
            let deadlineText = `${daysLeft} days left`;
            let isOpen = true;

            if (daysLeft < 0) {
                deadlineClass = 'badge-closed';
                deadlineText = 'Closed';
                isOpen = false;
            } else if (daysLeft < 14) {
                deadlineClass = 'badge-urgent';
            } else if (daysLeft > 60) {
                deadlineClass = 'badge-safe';
            } else if (opening && today < opening) {
                // Not open yet
                isOpen = false;
                deadlineClass = 'badge-neutral';
                deadlineText = `Opens ${item.opening_date}`;
            }

            const card = document.createElement('div');
            card.className = `tracker-item ${!isOpen ? 'opacity-50' : ''} ${isFav ? 'fav-active-border' : ''}`;

            card.innerHTML = `
                <div class="tracker-col-main">
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                        <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite('${uniqueId}')" title="Add to Shortlist">
                            ${isFav ? '★' : '☆'}
                        </button>
                        <h3 class="tracker-program">${item.program}</h3>
                    </div>
                    <div class="tracker-uni">${item.university}</div>
                    <div class="mobile-only-meta">
                        <span class="meta-tag-sm">${item.intake}</span>
                        <span class="meta-tag-sm">${item.portal_type}</span>
                    </div>
                </div>
                
                <div class="tracker-col-intake desktop-only">${item.intake}</div>
                <div class="tracker-col-opening desktop-only" style="font-size:0.85rem; color:var(--text-secondary);">
                    ${item.opening_date || '-'}
                </div>
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

    function filterData() {
        const searchTerm = searchInput.value.toLowerCase();
        const intakeValue = filterIntake.value;
        const portalValue = filterPortal.value;
        const statusValue = filterStatus.value;
        const showFavs = filterFav ? filterFav.checked : false;

        const filtered = allAdmissions.filter(item => {
            const uniqueId = (item.university + item.program).replace(/\s+/g, '').toLowerCase();

            // Search
            const matchesSearch = item.university.toLowerCase().includes(searchTerm) ||
                item.program.toLowerCase().includes(searchTerm) ||
                item.tags.some(tag => tag.toLowerCase().includes(searchTerm));

            // Dropdowns
            const matchesIntake = intakeValue === 'all' || item.intake.includes(intakeValue);
            const matchesPortal = portalValue === 'all' || item.portal_type.includes(portalValue);

            // Status
            const today = new Date();
            const deadline = new Date(item.deadline_date);
            const matchesStatus = (statusValue === 'all') ||
                (statusValue === 'open' && deadline >= today) ||
                (statusValue === 'closed' && deadline < today);

            // Favorites Filter
            const matchesFav = showFavs ? favorites.includes(uniqueId) : true;

            return matchesSearch && matchesIntake && matchesPortal && matchesStatus && matchesFav;
        });

        renderCards(filtered);
    }

    // Listeners
    searchInput.addEventListener('input', filterData);
    filterIntake.addEventListener('change', filterData);
    filterPortal.addEventListener('change', filterData);
    filterStatus.addEventListener('change', filterData);
    if (filterFav) filterFav.addEventListener('change', filterData);
});
