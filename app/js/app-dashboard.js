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
            'graduation_year', 'native_gpa'
        ];
        return requiredFields.every(field => sp[field]);
    }

    // Helper to format basic markdown safely
    function formatMarkdown(text) {
        if (!text) return '';
        // Escape HTML
        const escapeHtml = (unsafe) => unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        let safeText = escapeHtml(text);

        let html = safeText
            .replace(/^### (.*$)/gim, '<h4 style="margin-top: 1rem; margin-bottom: 0.5rem; color: var(--text-primary);">$1</h4>')
            .replace(/^## (.*$)/gim, '<h3 style="margin-top: 1.5rem; margin-bottom: 0.5rem; color: var(--text-primary);">$1</h3>')
            .replace(/^# (.*$)/gim, '<h2 style="margin-top: 1.5rem; margin-bottom: 0.5rem; color: var(--text-primary);">$1</h2>')
            .replace(/\*\*(.*?)\*\*/gim, '<b>$1</b>')
            .replace(/\*(.*?)\*/gim, '<i>$1</i>')
            .replace(/^\* (.*$)/gim, '<ul style="margin: 0.5rem 0; padding-left: 1.5rem;"><li>$1</li></ul>')
            .replace(/<\/ul>\n<ul style=".*">/gim, '') // merge adjacent uls
            .replace(/\n\n/gim, '<br/><br/>')
            .replace(/\n/gim, ' ');
        return html;
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
                // 1. Fetch API Key securely from the database
                const { data: secretData, error: secretError } = await supabaseClient
                    .from('system_secrets')
                    .select('key_value')
                    .eq('key_name', 'GEMINI_API_KEY')
                    .single();

                if (secretError || !secretData || !secretData.key_value) {
                    throw new Error("API Key not found in database. Please ask the admin to configure system_secrets.");
                }

                const activeKey = secretData.key_value;

                // 2. Call Gemini API directly
                const promptText = `You are an expert admission counselor for German Public Universities.
Please evaluate the following student profile for their chances of admission:

Nationality: ${studyProfile.nationality || 'N/A'}
Bachelor's University: ${studyProfile.bachelors_university || 'N/A'}
Degree Type: ${studyProfile.degree_name || 'N/A'}
Graduation Year: ${studyProfile.graduation_year || 'N/A'}
Native GPA: ${studyProfile.native_gpa || 'N/A'}
German Grade Equivalent: ${studyProfile.german_grade || 'N/A'}
English Proficiency: ${studyProfile.english_proficiency || 'N/A'} (${studyProfile.english_score || 'N/A'})
German Proficiency: ${studyProfile.german_proficiency || 'N/A'}
Work Experience: ${studyProfile.work_experience_years || '0'} years
Recent Role: ${studyProfile.recent_role || 'N/A'}
Target Degree: ${studyProfile.target_degree || 'N/A'}
Target Field: ${studyProfile.desired_field || 'N/A'}

Instructions:
1. Provide a realistic and concise assessment of their chances (High, Medium, Low).
2. Detail 2-3 key strengths and 2-3 key weaknesses.
3. Be highly objective based on German public university standards.
4. Format your response beautifully in Markdown using headings, bold text, and bullet points. Keep it professional but encouraging.`;

                const payload = {
                    contents: [{
                        parts: [{ text: promptText }]
                    }]
                };

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (data.error) {
                    throw new Error(data.error.message || "Failed to call Gemini API");
                }

                const prediction = data.candidates?.[0]?.content?.parts?.[0]?.text;

                if (!prediction) throw new Error("No prediction returned from AI.");

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
