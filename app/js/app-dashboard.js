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
    // Use fallbacks in case it's an old Phase 0 user who didn't supply metadata
    const displayName = profile?.full_name || 'Anonymous User';
    const displayUsername = profile?.username || 'Not set';
    const displayRole = profile?.role || 'user';

    // Topbar & Sidebar
    document.getElementById('welcome-message').textContent = `Welcome, ${displayName.split(' ')[0]}!`;
    document.getElementById('nav-fullname').textContent = displayName;
    document.getElementById('nav-role').textContent = displayRole;

    // Content Grid
    document.getElementById('profile-name').textContent = displayName;
    document.getElementById('profile-username').textContent = `@${displayUsername}`;
    document.getElementById('profile-email').textContent = user.email;
    document.getElementById('profile-role').textContent = displayRole;

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
