// app-dashboard.js - Handles protected dashboard logic

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize SVG Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    const logoutBtn = document.getElementById('logout-btn');

    // 1. Validate session on load
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

    // If no session, redirect to login page immediately
    if (!session || sessionError) {
        window.location.replace('index.html');
        return;
    }

    const user = session.user;

    // Make page visible smoothly now that session is verified
    document.body.style.visibility = 'visible';
    setTimeout(() => {
        const content = document.getElementById('dashboard-content');
        if (content) content.style.opacity = '1';
    }, 50);

    // 2. Fetch extended profile from profiles table
    // (username and full_name are populated by our trigger during signup)
    const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('role, username, full_name')
        .eq('id', user.id)
        .single();

    if (profileError) {
        console.error("Error fetching profile:", profileError);
    }

    // 3. Populate DOM Elements
    const nameEl = document.getElementById('profile-name');
    const usernameEl = document.getElementById('profile-username');
    const roleEl = document.getElementById('profile-role');
    const topWelcomeEl = document.getElementById('welcome-message');

    // Remove loading states
    nameEl.classList.remove('skeleton');
    usernameEl.classList.remove('skeleton');
    roleEl.classList.remove('skeleton');
    topWelcomeEl.classList.remove('skeleton');

    const emailEl = document.getElementById('profile-email');
    if (emailEl) emailEl.classList.remove('skeleton');

    const navFullnameEl = document.getElementById('nav-fullname');
    if (navFullnameEl) navFullnameEl.classList.remove('skeleton');

    const navRoleEl = document.getElementById('nav-role');
    if (navRoleEl) navRoleEl.classList.remove('skeleton');

    // Use fallbacks in case it's an old Phase 0 user who didn't supply metadata
    // Or if the SQL Trigger hasn't been updated to capture metadata yet!
    const displayName = profile?.full_name || 'Anonymous User';
    const displayUsername = profile?.username || 'Not set (Run SQL Script!)';
    const displayRole = profile?.role || 'user';

    // Topbar & Sidebar
    topWelcomeEl.textContent = `Welcome, ${displayName.split(' ')[0]}!`;
    document.getElementById('nav-fullname').textContent = displayName;
    document.getElementById('nav-role').textContent = displayRole;

    // Generate Avatar Initials
    const initials = displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    const avatarInitialsEl = document.getElementById('avatar-initials');
    if (avatarInitialsEl) {
        avatarInitialsEl.textContent = initials;
        avatarInitialsEl.classList.remove('skeleton');
    }

    // Profile Dropdown Logic
    const profileTrigger = document.getElementById('profile-trigger');
    const profileDropdown = document.getElementById('profile-dropdown');

    if (profileTrigger && profileDropdown) {
        profileTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!profileTrigger.contains(e.target)) {
                profileDropdown.classList.remove('active');
            }
        });
    }

    // Content Grid
    nameEl.textContent = displayName;
    usernameEl.textContent = `@${displayUsername}`;
    document.getElementById('profile-email').textContent = user.email;
    roleEl.textContent = displayRole;
    // 4. Handle Logout
    logoutBtn.addEventListener('click', async () => {
        logoutBtn.disabled = true;
        logoutBtn.textContent = 'Logging out...';

        await supabaseClient.auth.signOut();
        window.location.replace('index.html');
    });

    // 5. Listen for auth changes
    supabaseClient.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') {
            window.location.replace('index.html');
        }
    });
});
