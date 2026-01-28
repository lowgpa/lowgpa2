document.addEventListener('DOMContentLoaded', () => {
    const trackerContainer = document.getElementById('tracker-container');
    const searchInput = document.getElementById('search-input');
    const filterIntake = document.getElementById('filter-intake');
    const filterPortal = document.getElementById('filter-portal');
    const filterStatus = document.getElementById('filter-status');
    const resultCount = document.getElementById('result-count');

    let allAdmissions = [];

    // Fetch Data
    fetch('data/admissions.json')
        .then(response => response.json())
        .then(data => {
            allAdmissions = data;
            renderCards(allAdmissions);
        })
        .catch(error => console.error('Error loading admissions data:', error));

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
            let isOpen = item.is_open;

            // Date Logic overrides manual 'is_open' if passed
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
            card.className = `tracker-card ${!isOpen ? 'opacity-50' : ''}`;
            
            card.innerHTML = `
                <div class="tracker-header">
                    <div>
                        <h3 class="tracker-program">${item.program}</h3>
                        <div class="tracker-uni">${item.university}</div>
                    </div>
                    <div class="tracker-intake">${item.intake}</div>
                </div>
                
                <div class="tracker-meta">
                    <span class="meta-tag">🏛 ${item.portal_type}</span>
                    <span class="meta-tag">💶 ${item.cost_type}</span>
                    <span class="meta-tag">🏷 ${item.tags.join(', ')}</span>
                </div>

                <div class="tracker-footer">
                    <div class="deadline-badge ${deadlineClass}">
                        ${deadlineText} <span style="font-weight:400; font-size: 0.8em;">(${item.deadline_date})</span>
                    </div>
                    <a href="${item.link}" target="_blank" class="btn btn-sm btn-secondary" ${!isOpen ? 'disabled style="pointer-events:none;"' : ''}>
                        ${isOpen ? 'Portal &rarr;' : 'Closed'}
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
            const isActuallyOpen = item.is_open && (deadline >= today);
            
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
