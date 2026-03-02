// app-dashboard.js - Handles protected dashboard logic

document.addEventListener('DOMContentLoaded', async () => {
    const logoutBtn = document.getElementById('logout-btn');

    // 1. Validate session on load
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

    // If no session, redirect to login page immediately
    if (!session || sessionError) {
        window.location.replace('index.html');
        return;
    }

    const user = session.user;

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

    // Use fallbacks in case it's an old Phase 0 user who didn't supply metadata
    // Or if the SQL Trigger hasn't been updated to capture metadata yet!
    const displayName = profile?.full_name || 'Anonymous User';
    const displayUsername = profile?.username || 'Not set (Run SQL Script!)';
    const displayRole = profile?.role || 'user';

    // Topbar & Sidebar
    topWelcomeEl.textContent = `Welcome, ${displayName.split(' ')[0]}!`;
    document.getElementById('nav-fullname').textContent = displayName;
    document.getElementById('nav-role').textContent = displayRole;

    // Content Grid
    nameEl.textContent = displayName;
    usernameEl.textContent = `@${displayUsername}`;
    document.getElementById('profile-email').textContent = user.email;
    roleEl.textContent = displayRole;

    // Inject a warning if data is missing
    if (!profile?.username) {
        let warningDiv = document.createElement('div');
        warningDiv.style = "background: #fee2e2; color: #991b1b; padding: 1rem; border-radius: 8px; margin-top: 1rem; border: 1px solid #ef4444;";
        warningDiv.innerHTML = "<strong>Missing Data:</strong> It looks like your Username and Name weren't saved during signup. You need to run the Phase 1 & 2 SQL Scripts in your Supabase Dashboard so your database knows how to capture the metadata.";
        document.querySelector('.data-grid').parentElement.appendChild(warningDiv);
    }

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
