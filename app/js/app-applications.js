// app-applications.js - Handles the logic for the App Tracker page

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize SVG Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 2. Validate session on load
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    if (!session || sessionError) {
        window.location.replace('index.html');
        return;
    }
    const user = session.user;

    // Remove Fullscreen Loader smoothly
    setTimeout(() => {
        const loader = document.getElementById('fullscreen-loader');
        const content = document.getElementById('dashboard-content');
        if (loader) {
            loader.style.opacity = '0';
            loader.style.visibility = 'hidden';
            setTimeout(() => loader.remove(), 500);
        }
        if (content) content.style.opacity = '1';
    }, 600);

    // Populate Sidebar Profile securely
    const { data: profile } = await supabaseClient.from('profiles').select('username, full_name, role').eq('id', user.id).single();
    if (profile) {
        const displayName = profile.full_name || 'Anonymous User';
        document.getElementById('nav-fullname').textContent = displayName;
        document.getElementById('nav-role').textContent = profile.role || 'user';
        document.getElementById('welcome-message').textContent = `Track Applications`;

        const avatarEl = document.getElementById('avatar-initials');
        if (avatarEl) {
            avatarEl.textContent = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            avatarEl.classList.remove('skeleton');
            document.getElementById('nav-fullname').classList.remove('skeleton');
            document.getElementById('nav-role').classList.remove('skeleton');
        }
    }

    // Navbar Dropdown Logic
    const profileTrigger = document.getElementById('profile-trigger');
    const profileDropdown = document.getElementById('profile-dropdown');
    if (profileTrigger && profileDropdown) {
        profileTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            if (!profileTrigger.contains(e.target)) profileDropdown.classList.remove('active');
        });
    }

    // Logout
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.replace('index.html');
    });

    // ==========================================
    // PHASE 4: APPLICATION TRACKER LOGIC
    // ==========================================

    const modal = document.getElementById('app-modal');
    const addAppBtn = document.getElementById('add-app-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelModalBtn = document.getElementById('cancel-modal-btn');
    const addAppForm = document.getElementById('add-app-form');
    const submitBtn = document.getElementById('submit-app-btn');
    const gridEl = document.getElementById('applications-grid');
    const countEl = document.getElementById('tracker-count');

    // Make sure Modal is hidden organically on load
    modal.classList.add('hidden');

    // Modal Toggles
    const openModal = () => modal.classList.remove('hidden');
    const closeModal = () => {
        modal.classList.add('hidden');
        addAppForm.reset();
    };

    addAppBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);

    // 3. Form Submission (INSERT deeply to Supabase)
    addAppForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        const payload = {
            user_id: user.id, // CRITICAL: Link data to logged-in user
            university_name: document.getElementById('app-uni').value,
            program_name: document.getElementById('app-program').value,
            degree_level: document.getElementById('app-degree').value,
            status: document.getElementById('app-status').value,
            deadline: document.getElementById('app-deadline').value || null,
            url: document.getElementById('app-url').value || null,
            notes: document.getElementById('app-notes').value || null
        };

        const { error } = await supabaseClient.from('applications').insert([payload]);

        if (error) {
            alert("Error saving application: " + error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add Application';
        } else {
            closeModal();
            fetchApplications(); // Reload UI
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add Application';
        }
    });

    // 4. Fetch and Render Logic
    const getStatusClass = (status) => {
        const map = {
            'Researching': 'status-researching',
            'Preparing': 'status-preparing',
            'Applied': 'status-applied',
            'Interview': 'status-interview',
            'Decision': 'status-decision',
            'Accepted': 'status-accepted',
            'Rejected': 'status-rejected',
            'Enrolled': 'status-enrolled'
        };
        return map[status] || 'status-default';
    };

    const fetchApplications = async () => {
        const { data: apps, error } = await supabaseClient
            .from('applications')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching apps", error);
            return;
        }

        countEl.textContent = `${apps.length} application${apps.length === 1 ? '' : 's'} tracked`;

        if (apps.length === 0) {
            gridEl.innerHTML = `
               <div class="empty-state" id="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-secondary); border: 1px dashed var(--surface-border); border-radius: var(--radius-md);">
                   <i data-lucide="folder-open" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5;"></i>
                   <p>You aren't tracking any applications yet.</p>
                   <button class="primary-btn" onclick="document.getElementById('add-app-btn').click();" style="margin-top: 1rem;">Track First Application</button>
               </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        gridEl.innerHTML = ''; // Clear grid

        apps.forEach(app => {
            const card = document.createElement('div');
            card.className = 'app-card';

            const urlButtonHtml = app.url ? `<a href="${app.url}" target="_blank" class="secondary-btn" style="padding: 0.5rem; display: flex; align-items: center; justify-content: center;"><i data-lucide="external-link" style="width:16px;height:16px;"></i></a>` : '';

            card.innerHTML = `
                <div class="app-card-header">
                    <h3 class="app-card-title"><i data-lucide="graduation-cap" style="color:var(--primary); width:20px;"></i> ${app.university_name}</h3>
                    <div class="app-card-menu"><i data-lucide="more-vertical" style="width:18px;"></i></div>
                </div>
                <p class="app-card-program">${app.program_name}</p>
                
                <div class="app-card-footer">
                    <span class="status-pill ${getStatusClass(app.status)}">${app.status}</span>
                    <span class="app-card-degree">${app.degree_level}</span>
                </div>

                <div class="app-card-actions">
                    <button class="primary-btn" style="flex: 1; padding: 0.5rem; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 0.25rem;"><i data-lucide="eye" style="width:16px;height:16px;"></i> View Details</button>
                    ${urlButtonHtml}
                </div>
            `;
            gridEl.appendChild(card);
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    // Initial Fetch
    fetchApplications();
});
