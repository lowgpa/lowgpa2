// CONFIGURATION
const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyeSm-5xl0xBUJGZMsr4CZzHbmPyyk7KxdbWLv_uyUEzaTM9Pu5SxsXC9MbsVaI8XA8/exec";

document.addEventListener('DOMContentLoaded', () => {
    const trackerContainer = document.getElementById('tracker-container');
    const searchInput = document.getElementById('search-input');
    // Filters
    const filterIntake = document.getElementById('filter-intake');
    const filterPortal = document.getElementById('filter-portal');
    const filterStatus = document.getElementById('filter-status');
    const filterGpa = document.getElementById('filter-gpa');
    const filterAssessment = document.getElementById('filter-assessment');
    const filterFav = document.getElementById('filter-fav');

    // UI Elements
    const resultCount = document.getElementById('result-count');
    const lastUpdatedEl = document.getElementById('last-updated-date');

    // Pagination Controls
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const pageInfo = document.getElementById('page-info');
    const pageSizeSelect = document.getElementById('page-size-select');

    let allAdmissions = [];
    let currentFilteredData = [];
    let favorites = JSON.parse(localStorage.getItem('lowgpa_favorites') || '[]');

    // Pagination State
    let currentPage = 1;
    let itemsPerPage = 10;

    init();

    function init() {
        if (SHEET_API_URL && SHEET_API_URL.length > 10) {
            console.log("Fetching from Google Apps Script API...");
            fetch(SHEET_API_URL)
                .then(response => response.json())
                .then(data => {
                    allAdmissions = normalizeSheetData(data);
                    calculateLastUpdated(allAdmissions);
                    filterData(); // Initial Render
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
                allAdmissions = data; // Already normalized in local JSON usually, but robust to run it through
                // If local JSON keys exactly match, this is fine. 
                // However, our local JSON now has 'intakes' as array, while sheet might return string.
                // Let's normalize it to be safe if structure differs slightly or effectively simple pass-through.
                if (data.length > 0 && !data[0].gpa_req) {
                    // Fallback for old json structure if any
                }
                allAdmissions = data;
                filterData();
            })
            .catch(error => console.error('Error loading local data:', error));
    }

    function normalizeSheetData(sheetData) {
        return sheetData.map(item => {
            // Helper to get case-insensitive property
            const get = (key) => item[key] || item[key.toLowerCase()] || "";

            // Parse GPA: "2.5" -> 2.5
            let gpaRaw = get("GPA") || get("gpa_req") || "No Limit";
            let gpaVal = 99.0;
            if (gpaRaw !== "No Limit" && gpaRaw !== "None") {
                const match = gpaRaw.toString().match(/[0-9]\.[0-9]/);
                if (match) gpaVal = parseFloat(match[0]);
            }

            // Parse Intakes: "Winter, Summer" -> ["Winter", "Summer"]
            let intakesRaw = get("Intakes") || get("intakes");
            let intakes = [];
            if (Array.isArray(intakesRaw)) {
                intakes = intakesRaw;
            } else if (typeof intakesRaw === 'string') {
                intakes = intakesRaw.split(',').map(s => s.trim());
            }

            return {
                university: get("University") || get("university") || "Unknown",
                program: get("Program") || get("program") || "Unknown",
                intake: get("Intake") || get("intake") || "", // Primary intake focus
                intakes_list: intakes,
                opening_date: formatDate(get("Opening") || get("opening_date") || get("opening")),
                deadline_date: formatDate(get("Deadline") || get("deadline_date") || get("deadline")),
                portal_type: get("Portal") || get("portal_type") || get("portal") || "Direct",
                link: get("Link") || get("link") || "#",
                tags: (get("Tags") || get("tags") || "").toString().split(',').map(t => t.trim()),
                gpa_req: gpaRaw,
                gpa_val: gpaVal,
                assessment: get("Assessment") || get("assessment") || "None"
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
        // Don't re-render entire page to avoid scatter, just toggle class if element exists
        const btn = document.querySelector(`button[data-fav-id="${id}"]`);
        if (btn) {
            btn.innerHTML = favorites.includes(id) ? '★' : '☆';
            btn.classList.toggle('active');
        }
    }
    window.toggleFavorite = toggleFavorite;

    // --- Filtering Logic ---

    function filterData() {
        const searchTerm = searchInput.value.toLowerCase();
        const intakeValue = filterIntake.value;
        const portalValue = filterPortal.value;
        const statusValue = filterStatus.value;
        const gpaValue = filterGpa ? filterGpa.value : 'all';
        const assessmentValue = filterAssessment ? filterAssessment.value : 'all';
        const showFavs = filterFav ? filterFav.checked : false;

        currentFilteredData = allAdmissions.filter(item => {
            const uniqueId = (item.university + item.program).replace(/\s+/g, '').toLowerCase();

            // Search
            const matchesSearch = item.university.toLowerCase().includes(searchTerm) ||
                item.program.toLowerCase().includes(searchTerm) ||
                item.tags.some(tag => tag.toLowerCase().includes(searchTerm));

            // Dropdowns
            // Intake: Check if filtered intake is in the list of available intakes
            const matchesIntake = intakeValue === 'all' ||
                item.intake.includes(intakeValue) ||
                (item.intakes_list && item.intakes_list.some(i => i.includes(intakeValue)));

            const matchesPortal = portalValue === 'all' || item.portal_type.includes(portalValue);

            // Assessment
            let matchesAssessment = true;
            if (assessmentValue !== 'all') {
                const assess = item.assessment.toLowerCase();
                if (assessmentValue === 'none') matchesAssessment = assess.includes('none') || assess === '';
                if (assessmentValue === 'interview') matchesAssessment = assess.includes('interview');
                if (assessmentValue === 'test') matchesAssessment = assess.includes('test') || assess.includes('grey');
            }

            // GPA
            let matchesGpa = true;
            if (gpaValue !== 'all') {
                if (gpaValue === 'none') {
                    matchesGpa = item.gpa_val > 5.0; // Assuming encoded "No Limit" is 99.0
                } else {
                    const filterFloat = parseFloat(gpaValue);
                    // Match if Uni GPA Limit >= Filter Value (e.g. Uni 3.0 >= User 2.5 -> OK)
                    // OR if Uni has no limit
                    matchesGpa = (item.gpa_val >= filterFloat);
                }
            }

            // Status
            const today = new Date();
            const deadline = new Date(item.deadline_date);
            const matchesStatus = (statusValue === 'all') ||
                (statusValue === 'open' && deadline >= today) ||
                (statusValue === 'closed' && deadline < today);

            // Favorites Filter
            const matchesFav = showFavs ? favorites.includes(uniqueId) : true;

            return matchesSearch && matchesIntake && matchesPortal && matchesStatus && matchesFav && matchesGpa && matchesAssessment;
        });

        // Reset to Page 1 when filters change
        currentPage = 1;
        renderPaginationUI();
        renderPage();
    }

    // --- Pagination Logic ---

    function renderPaginationUI() {
        const totalItems = currentFilteredData.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        if (totalItems === 0) {
            resultCount.textContent = "0 results";
            pageInfo.textContent = "0-0 of 0";
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }

        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, totalItems);

        resultCount.textContent = `${totalItems} results`;
        pageInfo.textContent = `${startItem}-${endItem} of ${totalItems}`;

        prevBtn.disabled = (currentPage === 1);
        nextBtn.disabled = (currentPage === totalPages);
    }

    function changePage(direction) {
        const totalItems = currentFilteredData.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        const newPage = currentPage + direction;
        if (newPage > 0 && newPage <= totalPages) {
            currentPage = newPage;
            renderPaginationUI();
            renderPage();
            document.getElementById('tracker-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function renderPage() {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageData = currentFilteredData.slice(start, end);

        renderCards(pageData);
    }

    function renderCards(data) {
        trackerContainer.innerHTML = '';

        if (data.length === 0) {
            trackerContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted); animation: fadeInUp 0.3s ease;">No results match your filters.</div>';
            return;
        }

        data.forEach((item, index) => {
            const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;

            const today = new Date();
            const deadline = new Date(item.deadline_date);
            const opening = item.opening_date ? new Date(item.opening_date) : null;
            const timeDiff = deadline - today;
            const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
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
                isOpen = false;
                deadlineClass = 'badge-neutral';
                deadlineText = `Opens ${item.opening_date}`;
            }

            // Formatting Metadata
            let gpaBadge = '';
            if (item.gpa_val < 5.0) {
                gpaBadge = `<span class="meta-badge badge-gpa">🎓 GPA ${item.gpa_req}</span>`;
            } else {
                gpaBadge = `<span class="meta-badge badge-gpa">🎓 Any GPA</span>`;
            }

            let intakeBadge = '';
            // Assuming item.intake is raw string e.g. "Winter 2026", try to detect Seasons
            const isWinter = item.intake.includes('Winter') || (item.intakes_list && item.intakes_list.includes('Winter'));
            const isSummer = item.intake.includes('Summer') || (item.intakes_list && item.intakes_list.includes('Summer'));

            if (isWinter && isSummer) intakeBadge = `<span class="meta-badge badge-intake">❄️ Winter • ☀️ Summer</span>`;
            else if (isWinter) intakeBadge = `<span class="meta-badge badge-intake">❄️ Winter</span>`;
            else if (isSummer) intakeBadge = `<span class="meta-badge badge-intake">☀️ Summer</span>`;
            else intakeBadge = `<span class="meta-badge badge-intake">📅 ${item.intake}</span>`;

            let assessBadge = '';
            if (item.assessment && item.assessment !== 'None') {
                assessBadge = `<span class="meta-badge badge-assessment">📝 ${item.assessment}</span>`;
            } else {
                assessBadge = `<span class="meta-badge badge-assessment" style="background:#f0fdf4; color:#166534; border-color:#bbf7d0;">✅ Direct</span>`;
            }

            const card = document.createElement('div');
            card.className = `tracker-item ${!isOpen ? 'opacity-50' : ''} ${isFav ? 'fav-active-border' : ''}`;
            card.style.animationDelay = `${index * 0.05}s`;

            card.innerHTML = `
                <div class="tracker-col-num">#${globalIndex}</div>
                <div class="tracker-col-main">
                    <div style="display:flex; align-items:flex-start; gap:0.5rem;">
                        <button class="fav-btn ${isFav ? 'active' : ''}" data-fav-id="${uniqueId}" onclick="toggleFavorite('${uniqueId}')" title="Add to Shortlist">
                            ${isFav ? '★' : '☆'}
                        </button>
                        <div>
                            <h3 class="tracker-program">${item.program}</h3>
                            <div class="tracker-uni">${item.university}</div>
                            
                            <!-- Badges -->
                            <div class="badge-info-row">
                                ${gpaBadge}
                                ${intakeBadge}
                                ${assessBadge}
                            </div>
                            
                            <!-- Mobile Only Meta -->
                            <div class="mobile-meta-row">
                                <!-- Mobile row content injected here via CSS Flex Order -->
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="tracker-col-intake desktop-only">${item.intake}</div>
                <div class="tracker-col-opening desktop-only" style="font-size:0.85rem; color:var(--text-secondary);">${item.opening_date || '-'}</div>
                <div class="tracker-col-portal desktop-only">${item.portal_type}</div>
                
                <div class="tracker-col-deadline">
                   <div style="display:flex; flex-direction:column; align-items:flex-end;">
                       <div class="deadline-badge-row ${deadlineClass}">${deadlineText}</div>
                       <div style="font-size:0.75rem; color:var(--text-muted);">${item.deadline_date || 'TBA'}</div>
                   </div>
                   <!-- Mobile Only Deadline Label -->
                   <div class="mobile-only-meta" style="font-size:0.8rem; font-weight:600; color:var(--text-secondary); display:none;">Deadline:</div>
                </div>
                
                <div class="tracker-col-action">
                    <a href="${item.link}" target="_blank" class="btn btn-sm btn-secondary" ${!isOpen ? 'disabled style="pointer-events:none;"' : ''}>View &rarr;</a>
                </div>
            `;
            trackerContainer.appendChild(card);
        });
    }

    // Event Listeners
    searchInput.addEventListener('input', filterData);
    filterIntake.addEventListener('change', filterData);
    filterPortal.addEventListener('change', filterData);
    filterStatus.addEventListener('change', filterData);
    if (filterGpa) filterGpa.addEventListener('change', filterData);
    if (filterAssessment) filterAssessment.addEventListener('change', filterData);
    if (filterFav) filterFav.addEventListener('change', filterData);

    // Pagination Listeners
    pageSizeSelect.addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        renderPaginationUI();
        renderPage();
    });

    prevBtn.addEventListener('click', () => changePage(-1));
    nextBtn.addEventListener('click', () => changePage(1));
});
