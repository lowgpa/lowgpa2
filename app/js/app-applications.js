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

    // Make page visible (but still covered by preloader) now that session is verified
    document.body.style.visibility = 'visible';

    // Populate Sidebar Profile securely
    const { data: profile } = await supabaseClient.from('profiles').select('username, full_name, role').eq('id', user.id).single();
    if (profile) {
        const displayName = profile.full_name || 'Anonymous User';
        document.getElementById('nav-fullname').textContent = displayName;
        document.getElementById('nav-role').textContent = profile.role || 'user';

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

    const modalTitle = modal.querySelector('h3');
    const deleteAppBtn = document.getElementById('delete-app-btn');

    // View Modal Elements
    const viewModal = document.getElementById('view-app-modal');
    const closeViewModalBtn = document.getElementById('close-view-modal-btn');
    const closeViewBtn = document.getElementById('close-view-btn');

    // Make sure Modal is hidden organically on load
    modal.classList.add('hidden');
    if (viewModal) viewModal.classList.add('hidden');

    // Modal Toggles
    const openModal = () => {
        document.getElementById('app-id').value = '';
        modalTitle.textContent = 'Add New Application';
        submitBtn.textContent = 'Add Application';
        if (deleteAppBtn) deleteAppBtn.classList.add('hidden');
        modal.classList.remove('hidden');
    };

    const openViewModal = (app) => {
        document.getElementById('view-app-uni').textContent = app.university_name;
        document.getElementById('view-app-program').textContent = app.program_name;
        document.getElementById('view-app-degree').textContent = app.degree_level;

        const statusSpan = document.getElementById('view-app-status');
        statusSpan.textContent = app.status;
        statusSpan.className = `status-pill ${getStatusClass(app.status)}`;

        document.getElementById('view-app-deadline').textContent = app.deadline || 'Not set';

        const urlEl = document.getElementById('view-app-url');
        if (app.url) {
            urlEl.href = app.url;
            urlEl.textContent = app.url;
            urlEl.style.cssText = 'color: var(--primary); text-decoration: underline; word-break: break-all;';
        } else {
            urlEl.removeAttribute('href');
            urlEl.textContent = 'No URL provided';
            urlEl.style.cssText = 'color: var(--text-secondary); text-decoration: none; word-break: break-all;';
        }

        document.getElementById('view-app-notes').textContent = app.notes || 'No notes available.';

        if (viewModal) viewModal.classList.remove('hidden');
    };

    const closeViewModal = () => {
        if (viewModal) viewModal.classList.add('hidden');
    };

    if (closeViewModalBtn) closeViewModalBtn.addEventListener('click', closeViewModal);
    if (closeViewBtn) closeViewBtn.addEventListener('click', closeViewModal);

    const openEditModal = (app) => {
        document.getElementById('app-id').value = app.id;
        document.getElementById('app-uni').value = app.university_name;
        document.getElementById('app-program').value = app.program_name;
        document.getElementById('app-degree').value = app.degree_level;
        document.getElementById('app-status').value = app.status;
        document.getElementById('app-deadline').value = app.deadline || '';
        document.getElementById('app-url').value = app.url || '';
        document.getElementById('app-notes').value = app.notes || '';

        modalTitle.textContent = 'Edit Application Overview';
        submitBtn.textContent = 'Save Changes';
        if (deleteAppBtn) deleteAppBtn.classList.remove('hidden');
        modal.classList.remove('hidden');
    };

    const closeModal = () => {
        modal.classList.add('hidden');
        addAppForm.reset();
        document.getElementById('app-id').value = '';
    };

    addAppBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);

    if (deleteAppBtn) {
        deleteAppBtn.addEventListener('click', async () => {
            const appId = document.getElementById('app-id').value;
            if (!appId) return;

            if (confirm('Are you sure you want to delete this application tracking data? This cannot be undone.')) {
                deleteAppBtn.textContent = 'Deleting...';
                const { error } = await supabaseClient.from('applications').delete().eq('id', appId);
                if (error) {
                    alert("Error deleting application: " + error.message);
                    deleteAppBtn.textContent = 'Delete';
                } else {
                    closeModal();
                    fetchApplications();
                    deleteAppBtn.textContent = 'Delete';
                }
            }
        });
    }

    // 3. Form Submission (INSERT or UPDATE to Supabase)
    addAppForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        const appId = document.getElementById('app-id').value;

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

        let result;
        if (appId) {
            // Update existing
            result = await supabaseClient.from('applications').update(payload).eq('id', appId);
        } else {
            // Insert new
            result = await supabaseClient.from('applications').insert([payload]);
        }

        if (result.error) {
            alert("Error saving application: " + result.error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = appId ? 'Save Changes' : 'Add Application';
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
            'Decision Pending': 'status-decision',
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

        // --- DATA LOADED: REVEAL PAGE ---
        const preloader = document.getElementById('brand-preloader');
        const content = document.getElementById('dashboard-content');

        if (preloader) {
            preloader.style.opacity = '0';
            preloader.style.visibility = 'hidden';
            setTimeout(() => preloader.remove(), 400); // Wait for fade to finish
        }

        setTimeout(() => {
            if (content) content.style.opacity = '1';
        }, 100);

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
                </div>
                <p class="app-card-program">${app.program_name}</p>
                
                <div class="app-card-footer">
                    <span class="status-pill ${getStatusClass(app.status)}">${app.status}</span>
                    <span class="app-card-degree">${app.degree_level}</span>
                </div>

                <div class="app-card-actions" style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                    <button class="secondary-btn view-details-btn" data-id="${app.id}" style="flex: 1; padding: 0.5rem; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 0.25rem;"><i data-lucide="eye" style="width:16px;height:16px;"></i> View</button>
                    <button class="primary-btn edit-app-btn" data-id="${app.id}" style="flex: 1; padding: 0.5rem; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 0.25rem;"><i data-lucide="edit" style="width:16px;height:16px;"></i> Edit</button>
                    ${urlButtonHtml}
                </div>
            `;

            // Attach event listeners to dynamically created buttons
            const viewBtn = card.querySelector('.view-details-btn');
            if (viewBtn) {
                viewBtn.addEventListener('click', () => {
                    openViewModal(app);
                });
            }
            const editBtn = card.querySelector('.edit-app-btn');
            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    openEditModal(app);
                });
            }
            gridEl.appendChild(card);
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    // Initial Fetch
    fetchApplications();
});
