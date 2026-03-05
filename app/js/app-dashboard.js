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

    // Make page visible (but still covered by preloader) now that session is verified
    document.body.style.visibility = 'visible';

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

    // 2.5 Fetch study profile for AI Prediction
    let { data: studyProfile, error: studyProfileError } = await supabaseClient
        .from('study_profile')
        .select('*')
        .eq('id', user.id)
        .single();

    if (studyProfileError && studyProfileError.code !== 'PGRST116') {
        console.error("Error fetching study profile:", studyProfileError);
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

    // --- AI PREDICTION LOGIC ---
    const aiSetupContainer = document.getElementById('ai-setup-container');
    const aiActionContainer = document.getElementById('ai-action-container');
    const aiLoadingContainer = document.getElementById('ai-loading-container');
    const aiResultContainer = document.getElementById('ai-result-container');
    const aiResultContent = document.getElementById('ai-result-content');
    const predictBtn = document.getElementById('predict-chances-btn');

    // Helper to check if profile is complete
    function isProfileComplete(sp) {
        if (!sp) return false;
        const requiredFields = [
            'nationality', 'bachelors_university', 'degree_name',
            'graduation_year', 'native_gpa',
            'english_proficiency', 'target_degree', 'desired_field'
        ];
        return requiredFields.every(field => sp[field]);
    }

    // Helper to render AI result as a clean, styled card
    function formatMarkdown(text) {
        if (!text) return '';

        // Determine verdict badge color
        let badgeColor = '#6b7280';
        let badgeBg = 'rgba(107,114,128,0.12)';
        if (/strong fit/i.test(text)) { badgeColor = '#16a34a'; badgeBg = 'rgba(22,163,74,0.1)'; }
        else if (/good fit|moderate fit/i.test(text)) { badgeColor = '#d97706'; badgeBg = 'rgba(217,119,6,0.1)'; }
        else if (/needs improvement|weak fit/i.test(text)) { badgeColor = '#ea580c'; badgeBg = 'rgba(234,88,12,0.1)'; }
        else if (/developing profile/i.test(text)) { badgeColor = '#7c3aed'; badgeBg = 'rgba(124,58,237,0.1)'; }

        const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        let html = escapeHtml(text)
            // Remove score breakdown table completely
            .replace(/\|.*?\|[\s\S]*?\n\n/g, '')
            // Verdict heading as badge
            .replace(/^## Result:\s*(.*?)$/gim, `<div style="display:inline-block;padding:0.35rem 1rem;border-radius:999px;background:${badgeBg};color:${badgeColor};font-weight:700;font-size:1.1rem;margin-bottom:1rem;">$1</div>`)
            // Remove total score line (internal logic)
            .replace(/\*\*Total Score:.*?\*\*/gi, '')
            // Section headings
            .replace(/^###\s+(.*?)$/gim, '<p style="font-weight:700;color:var(--text-primary);margin:1.2rem 0 0.4rem;font-size:0.95rem;text-transform:uppercase;letter-spacing:0.05em;">$1</p>')
            .replace(/^##\s+(.*?)$/gim, '<p style="font-weight:700;color:var(--text-primary);margin:1rem 0 0.3rem;">$1</p>')
            // Bold
            .replace(/\*\*(.*?)\*\*/gim, '<b>$1</b>')
            // Bullet points
            .replace(/^[-*]\s+(.*?)$/gim, '<li style="margin:0.3rem 0;color:var(--text-secondary);">$1</li>')
            // Wrap consecutive li items
            .replace(/(<li[^>]*>.*?<\/li>\n?)+/gim, (m) => `<ul style="margin:0.4rem 0;padding-left:1.4rem;">${m}</ul>`)
            // Disclaimer line
            .replace(/---\n\*(.*?)\*/gim, '<p style="margin-top:1rem;padding-top:0.75rem;border-top:1px solid var(--border-color);font-size:0.78rem;color:var(--text-muted);font-style:italic;">$1</p>')
            // Paragraphs
            .replace(/\n\n/gim, '</p><p style="margin:0.5rem 0;color:var(--text-secondary);">')
            .replace(/\n/gim, ' ');

        return `<div style="line-height:1.7;">${html}</div>`;
    }

    if (aiSetupContainer) {
        if (studyProfile && studyProfile.ai_prediction) {
            // Show existing prediction
            aiResultContent.innerHTML = formatMarkdown(studyProfile.ai_prediction);
            aiResultContainer.style.display = 'block';
        } else if (isProfileComplete(studyProfile)) {
            // Show predict button
            aiActionContainer.style.display = 'block';
        } else {
            // Ask to complete profile
            aiSetupContainer.style.display = 'block';
        }
    }

    if (predictBtn) {
        predictBtn.addEventListener('click', async () => {
            aiActionContainer.style.display = 'none';
            aiLoadingContainer.style.display = 'block';

            try {
                // Securely call the Supabase Edge Function - Worker URL is hidden server-side
                const { data, error } = await supabaseClient.functions.invoke('predict-chances', {
                    body: { profile: studyProfile }
                });

                if (error) {
                    console.error("Supabase Invoke Error:", error);
                    throw new Error(error.message || "Failed to trigger Edge Function.");
                }

                if (!data || !data.prediction) {
                    throw new Error("No prediction returned from AI.");
                }

                const prediction = data.prediction;

                // 3. Save to database
                const { error: updateError } = await supabaseClient
                    .from('study_profile')
                    .update({ ai_prediction: prediction })
                    .eq('id', user.id);

                if (updateError) {
                    console.error("Failed to save prediction to database:", updateError);
                    alert("Prediction generated, but failed to save. Ensure 'ai_prediction' column exists in database.");
                }

                // Show result
                aiLoadingContainer.style.display = 'none';
                aiResultContent.innerHTML = formatMarkdown(prediction);
                aiResultContainer.style.display = 'block';

            } catch (err) {
                console.error("AI Prediction Error:", err);
                aiLoadingContainer.style.display = 'none';
                aiActionContainer.style.display = 'block'; // Let them try again
                alert("Failed to generate prediction. Error: " + err.message);
            }
        });
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
