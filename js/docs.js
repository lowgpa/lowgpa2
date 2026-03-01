/**
 * Document Directory Data & Logic - LowGPA to Germany
 */

const docsData = [
    {
        title: "Ebook: Guide to Master's Study in Germany",
        url: "https://lowgpa.online/docs/masters-ebook.pdf",
        category: "guides",
        type: "pdf",
        author: "Umair",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>`
    },
    {
        title: "Ebook: Guide to Bachelor's Study in Germany",
        url: "http://lowgpa.online/docs/bachelor-ebook.pdf",
        category: "guides",
        type: "pdf",
        author: "Umair",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>`
    },
    {
        title: "Student's Guide to German Life",
        url: "/Students-Guide.pdf",
        category: "guides",
        type: "pdf",
        author: "Community",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>`
    },
    {
        title: "CS Universities with No Application Fees",
        url: "https://docs.google.com/spreadsheets/d/11341h4_s0Fi3myrDZ8U9PI57VFRotRwr/edit?usp=sharing&ouid=116626364849550091049&rtpof=true&sd=true",
        category: "application",
        type: "spreadsheet",
        author: "Community",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
    },
    {
        title: "Universities with Low IELTS Requirements (CS)",
        url: "https://docs.google.com/spreadsheets/d/11kALfBUVlvNXqn7k4aigj4zwchQSU5DE/edit?usp=sharing&ouid=116626364849550091049&rtpof=true&sd=true",
        category: "application",
        type: "spreadsheet",
        author: "Community",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
    },
    {
        title: "All Computer Related Universities [Complete List]",
        url: "/All-Computer-Related-Universities.pdf",
        category: "application",
        type: "pdf",
        author: "Community",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
    },
    {
        title: "Universities Offering English-Taught IT Bachelor's",
        url: "https://docs.google.com/spreadsheets/d/1p3qVzcaUzaLYH9Tuao1zwT8BM43eQw8O/edit?usp=sharing&ouid=116626364849550091049&rtpof=true&sd=true",
        category: "application",
        type: "spreadsheet",
        author: "Community",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
    },
    {
        title: "German-Pakistan GPA Calculator",
        url: "/tools.html",
        category: "application",
        type: "link",
        author: "LowGPA",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="14.01"></line><line x1="12" y1="14" x2="12" y2="14.01"></line><line x1="8" y1="14" x2="8" y2="14.01"></line><line x1="16" y1="10" x2="16" y2="10.01"></line><line x1="12" y1="10" x2="12" y2="10.01"></line><line x1="8" y1="10" x2="8" y2="10.01"></line><line x1="16" y1="18" x2="16" y2="18.01"></line><line x1="12" y1="18" x2="12" y2="18.01"></line><line x1="8" y1="18" x2="8" y2="18.01"></line></svg>`
    },
    {
        title: "Motivation Letter for Masters [Template]",
        url: "/Motivation Letter Masters by Umair.pdf",
        category: "application",
        type: "pdf",
        author: "Umair",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
    },
    {
        title: "Motivation Letter for Bachelors [Template]",
        url: "/LOM for BS by Umair.pdf",
        category: "application",
        type: "pdf",
        author: "Umair",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
    },
    {
        title: "University Recommendation Letter Sample",
        url: "/University-LOR.pdf",
        category: "application",
        type: "pdf",
        author: "Community",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
    },
    {
        title: "Guide: MOFA & IBCC Attestation",
        url: "/MOFA&IBCC-Attestation.pdf",
        category: "visa",
        type: "pdf",
        author: "Nadia Rehman",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>`
    },
    {
        title: "Coracle Block Account Opening Process",
        url: "/Coracle-Block-Account-Opening.pdf",
        category: "visa",
        type: "pdf",
        author: "Community",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>`
    },
    {
        title: "LOM: Visa Officer LOM [Template]",
        url: "/LOM-Visa Officer.pdf",
        category: "visa",
        type: "pdf",
        author: "Community",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
    },
    {
        title: "Sponsorship Letter [Sample]",
        url: "/Sponsorship-Letter.pdf",
        category: "visa",
        type: "pdf",
        author: "Community",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
    },
    {
        title: "Biometric Photos [Samples]",
        url: "/Biometric-Photos.pdf",
        category: "visa",
        type: "pdf",
        author: "Community",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`
    },
    {
        title: "Notarize Stamp [Samples]",
        url: "/Notarize-stamp-samples.jpg",
        category: "visa",
        type: "image",
        author: "Community",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`
    },
    {
        title: "Checklist for Packing to Germany",
        url: "/Packing-Checklist.pdf",
        category: "living",
        type: "pdf",
        author: "Nouman Gulzar",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M9 15l2 2 4-4"></path></svg>`
    },
    {
        title: "Guide to Finding Accommodation in Germany",
        url: "/Accommodation-in-germany-site.pdf",
        category: "living",
        type: "pdf",
        author: "Community",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`
    }
];

// Map category IDs to friendly display names and styles
const categoryLabels = {
    guides: "Guide 📚",
    application: "Application 🎓",
    visa: "Visa 🛂",
    living: "Living 🧳"
};

const categoryColors = {
    guides: "color: #0D9488; background: #CCFBF1;", // Teal
    application: "color: #4F46E5; background: #E0E7FF;", // Indigo
    visa: "color: #DB2777; background: #FCE7F3;", // Pink
    living: "color: #D97706; background: #FEF3C7;" // Amber
};

let currentFilter = 'all';
let currentSearch = '';

document.addEventListener('DOMContentLoaded', () => {

    // Initial Render
    renderDocs();

    // Set up search listener
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase();
        renderDocs();
    });

    // Set up category tab listeners
    const categoryTabs = document.querySelectorAll('.tab-btn');
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // Update UI
            categoryTabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');

            // Update State & Render
            currentFilter = e.target.dataset.filter;
            renderDocs();
        });
    });
});

/**
 * Filter and render the cards to the grid container
 */
function renderDocs() {
    const gridContainer = document.getElementById('docsGridContainer');
    gridContainer.innerHTML = ''; // Clear existing

    // Filter documents based on active category and search input
    const filteredDocs = docsData.filter(doc => {
        const matchesCategory = currentFilter === 'all' || doc.category === currentFilter;
        const matchesSearch = doc.title.toLowerCase().includes(currentSearch) ||
            doc.author.toLowerCase().includes(currentSearch);
        return matchesCategory && matchesSearch;
    });

    // Handle empty state
    if (filteredDocs.length === 0) {
        gridContainer.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <h3>No documents found</h3>
                <p>Try adjusting your search criteria or selecting a different category.</p>
            </div>
        `;
        return;
    }

    // Render cards
    filteredDocs.forEach(doc => {
        const cardNode = document.createElement('div');
        cardNode.className = `doc-card type-${doc.type}`;

        const actionText = (doc.type === 'spreadsheet' || doc.type === 'link') ? 'Open Link' : 'View File';

        cardNode.innerHTML = `
            <div class="doc-header">
                <div class="doc-icon-wrapper">
                    ${doc.icon}
                </div>
                <div class="doc-info">
                    <span class="doc-category" style="${categoryColors[doc.category]} padding: 2px 6px; border-radius: 4px; display: inline-block; width: fit-content;">
                        ${categoryLabels[doc.category]}
                    </span>
                    <h3 class="doc-title">${doc.title}</h3>
                </div>
            </div>
            
            <div class="doc-footer">
                <div class="doc-author">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    By ${doc.author}
                </div>
                <a href="${doc.url}" target="_blank" rel="noopener noreferrer" class="doc-action-btn">
                    ${actionText}
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
            </div>
        `;

        gridContainer.appendChild(cardNode);
    });
}
