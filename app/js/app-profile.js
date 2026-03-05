// app-profile.js - Handles fetching and saving extended user profile data

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize SVG Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    const logoutBtn = document.getElementById('logout-btn');

    // 1. Validate session on load
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

    if (!session || sessionError) {
        window.location.replace('index.html');
        return;
    }

    const user = session.user;

    // Make page visible (but still covered by preloader) now that session is verified
    document.body.style.visibility = 'visible';

    // 2. Fetch basic profile info for dropdown/header
    let { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error fetching profile:", profileError);
    }

    if (!profile) profile = {};

    // 3. Fetch structured study profile data
    let { data: studyProfile, error: studyError } = await supabaseClient
        .from('study_profile')
        .select('*')
        .eq('id', user.id)
        .single();

    if (studyError && studyError.code !== 'PGRST116') {
        console.error("Error fetching study profile:", studyError);
    }

    if (!studyProfile) studyProfile = {};

    const displayName = profile?.full_name || 'Anonymous User';
    const displayRole = profile?.role || 'user';

    // Topbar initialization
    const navFullnameEl = document.getElementById('nav-fullname');
    if (navFullnameEl) {
        navFullnameEl.textContent = displayName;
        navFullnameEl.classList.remove('skeleton');
    }

    const navRoleEl = document.getElementById('nav-role');
    if (navRoleEl) {
        navRoleEl.textContent = displayRole;
        navRoleEl.classList.remove('skeleton');
    }

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

    // --- TABS LOGIC ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    if (tabBtns.length > 0 && tabPanes.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));

                // Add active class to clicked button
                btn.classList.add('active');

                // Show corresponding pane
                const targetId = btn.getAttribute('data-target');
                const targetPane = document.getElementById(targetId);
                if (targetPane) {
                    targetPane.classList.add('active');
                }
            });
        });
    }

    // --- POPULATE FORM FROM STUDY PROFILE ---

    // Personal Details
    if (studyProfile.dob) document.getElementById('profile-dob').value = studyProfile.dob;
    if (studyProfile.nationality) document.getElementById('profile-nationality').value = studyProfile.nationality;
    if (studyProfile.phone) document.getElementById('profile-phone').value = studyProfile.phone;

    // Academic Details
    if (studyProfile.bachelors_university) document.getElementById('acad-uni').value = studyProfile.bachelors_university;
    if (studyProfile.degree_name) document.getElementById('acad-degree').value = studyProfile.degree_name;
    if (studyProfile.graduation_year) document.getElementById('acad-year').value = studyProfile.graduation_year;
    if (studyProfile.native_gpa) document.getElementById('acad-native-gpa').value = studyProfile.native_gpa;
    if (studyProfile.german_grade) document.getElementById('acad-german-grade').value = studyProfile.german_grade;

    // Language & Tests
    if (studyProfile.english_proficiency) document.getElementById('lang-english').value = studyProfile.english_proficiency;
    if (studyProfile.english_score) document.getElementById('lang-english-score').value = studyProfile.english_score;
    if (studyProfile.german_proficiency) document.getElementById('lang-german').value = studyProfile.german_proficiency;
    if (studyProfile.standardized_tests) document.getElementById('acad-tests').value = studyProfile.standardized_tests;

    // Experience & Extracurriculars
    if (studyProfile.work_experience_years) document.getElementById('exp-years').value = studyProfile.work_experience_years;
    if (studyProfile.recent_role) document.getElementById('exp-role').value = studyProfile.recent_role;
    if (studyProfile.research_publications) document.getElementById('exp-research').value = studyProfile.research_publications;

    // Study Preferences
    if (studyProfile.target_degree) document.getElementById('pref-target-degree').value = studyProfile.target_degree;
    if (studyProfile.target_intake) document.getElementById('pref-intake').value = studyProfile.target_intake;
    if (studyProfile.desired_field) document.getElementById('pref-field').value = studyProfile.desired_field;
    if (studyProfile.preferred_medium) document.getElementById('pref-medium').value = studyProfile.preferred_medium;

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

    // Handle Form Submit
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Smart tab-aware required field validation
            const requiredFields = [
                { id: 'profile-nationality', label: 'Nationality', tab: 'tab-personal' },
                { id: 'profile-phone', label: 'Phone Number', tab: 'tab-personal' },
                { id: 'acad-uni', label: "Bachelor's University", tab: 'tab-academic' },
                { id: 'acad-degree', label: 'Degree Type', tab: 'tab-academic' },
                { id: 'acad-year', label: 'Graduation Year', tab: 'tab-academic' },
                { id: 'acad-native-gpa', label: 'Native GPA / Percentage', tab: 'tab-academic' },
            ];

            const missing = requiredFields.find(f => {
                const el = document.getElementById(f.id);
                return !el || !el.value.trim();
            });

            if (missing) {
                // Switch to the tab containing the missing field
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                document.querySelector(`[data-target="${missing.tab}"]`)?.classList.add('active');
                document.getElementById(missing.tab)?.classList.add('active');

                // Highlight the missing field
                const el = document.getElementById(missing.id);
                if (el) {
                    el.style.borderColor = '#ef4444';
                    el.focus();
                    el.addEventListener('input', () => el.style.borderColor = '', { once: true });
                }

                showToastNotification(`Please fill in: ${missing.label}`, 'error');
                return;
            }

            const submitBtn = profileForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Saving...';
            submitBtn.disabled = true;

            // Collect form data into object matching the new expected columns
            const profileUpdates = {
                dob: document.getElementById('profile-dob').value || null,
                nationality: document.getElementById('profile-nationality').value || null,
                phone: document.getElementById('profile-phone').value || null,

                bachelors_university: document.getElementById('acad-uni').value || null,
                degree_name: document.getElementById('acad-degree').value || null,
                graduation_year: document.getElementById('acad-year').value || null,
                native_gpa: document.getElementById('acad-native-gpa').value || null,
                german_grade: document.getElementById('acad-german-grade').value || null,

                english_proficiency: document.getElementById('lang-english').value || null,
                english_score: document.getElementById('lang-english-score').value || null,
                german_proficiency: document.getElementById('lang-german').value || null,
                standardized_tests: document.getElementById('acad-tests').value || null,

                work_experience_years: document.getElementById('exp-years').value || null,
                recent_role: document.getElementById('exp-role').value || null,
                research_publications: document.getElementById('exp-research').value || null,

                target_degree: document.getElementById('pref-target-degree').value || null,
                target_intake: document.getElementById('pref-intake').value || null,
                desired_field: document.getElementById('pref-field').value || null,
                preferred_medium: document.getElementById('pref-medium').value || null,

                updated_at: new Date().toISOString()
            };

            // Attempt to update Supabase row
            const { error: updateError } = await supabaseClient
                .from('study_profile')
                .upsert({ id: user.id, ...profileUpdates });

            if (updateError) {
                console.error("Update Error:", updateError);
                showToastNotification("Error saving profile. Please ensure database schema is updated.", "error");
            } else {
                showToastNotification("Profile settings saved successfully!", "success");
            }

            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        });
    }

    // Custom Toast Notification Function
    function showToastNotification(message, type = "success") {
        // Remove existing toast if any
        const existingToast = document.getElementById('profile-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.id = 'profile-toast';

        // Styling the toast matching the application's theme
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.backgroundColor = type === "success" ? '#10b981' : '#ef4444'; // Emerald for success, Red for error
        toast.style.color = 'white';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '8px';
        toast.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
        toast.style.fontFamily = 'Inter, sans-serif';
        toast.style.fontSize = '14px';
        toast.style.fontWeight = '500';
        toast.style.zIndex = '9999';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

        // Add optional icon based on type (using text icon for simplicity)
        toast.innerHTML = `<span style="margin-right:8px;">${type === 'success' ? '✓' : '⚠️'}</span> ${message}`;

        document.body.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => {
                toast.remove();
            }, 300); // Wait for transition to finish
        }, 3000);
    }

    // Handle Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            logoutBtn.disabled = true;
            logoutBtn.textContent = 'Logging out...';

            await supabaseClient.auth.signOut();
            window.location.replace('index.html');
        });
    }

    // Listen for auth changes
    supabaseClient.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') {
            window.location.replace('index.html');
        }
    });

});
