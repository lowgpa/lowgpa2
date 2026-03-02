// app-settings.js - Handles fetching user details and updating account settings (password)

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

    // 2. Fetch basic profile info for dropdown/header
    let { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single();

    if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error fetching profile:", profileError);
    }

    if (!profile) profile = {};

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

    // Remove loading overlay smoothly once header data is mapped
    setTimeout(() => {
        const loader = document.getElementById('fullscreen-loader');
        const content = document.getElementById('dashboard-content');

        if (loader) {
            loader.style.opacity = '0';
            loader.style.visibility = 'hidden';
            setTimeout(() => loader.remove(), 500);
        }

        if (content) {
            content.style.opacity = '1';
        }
    }, 400);

    // --- POPULATE FORM & HANDLE UPDATE ---

    const settingsForm = document.getElementById('settings-password-form');

    if (settingsForm) {
        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (newPassword !== confirmPassword) {
                showToastNotification("New passwords do not match.", "error");
                return;
            }

            if (newPassword.length < 6) {
                showToastNotification("Password must be at least 6 characters long.", "error");
                return;
            }

            const submitBtn = settingsForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Updating...';
            submitBtn.disabled = true;

            // Optional: Supabase doesn't strictly require current password if session is active
            // but for better security practices we could re-authenticate using currentPassword 
            // if we really wanted to. Here, we just rely on an active session to update.

            // Re-authenticate to prove current password is correct
            const { error: verifyError } = await supabaseClient.auth.signInWithPassword({
                email: user.email,
                password: currentPassword
            });

            if (verifyError) {
                console.error("Verification Error:", verifyError);
                showToastNotification("Current password is incorrect.", "error");
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
                return;
            }

            // If verification succeeds, proceed to update the password
            const { error: updateError } = await supabaseClient.auth.updateUser({
                password: newPassword
            });

            if (updateError) {
                console.error("Password Update Error:", updateError);
                showToastNotification(updateError.message || "Failed to update password.", "error");
            } else {
                showToastNotification("Password updated successfully!", "success");
                settingsForm.reset();
            }

            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        });
    }

    // Custom Toast Notification Function
    function showToastNotification(message, type = "success") {
        // Remove existing toast if any
        const existingToast = document.getElementById('settings-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.id = 'settings-toast';

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
