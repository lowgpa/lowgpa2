// auth.js - Handles dual-mode login/signup logic

document.addEventListener('DOMContentLoaded', async () => {
    // Session check first
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Auth state listener
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            window.location.href = 'dashboard.html';
        }
    });

    // --- View Toggling Logic ---
    const viewLogin = document.getElementById('view-login');
    const viewSignup = document.getElementById('view-signup');
    const toggleToSignup = document.getElementById('toggle-to-signup');
    const toggleToLogin = document.getElementById('toggle-to-login');
    const statusMessage = document.getElementById('status-message');

    function showMessage(msg, isSuccess = false) {
        statusMessage.textContent = msg;
        statusMessage.className = `message ${isSuccess ? 'success' : 'error'}`;
    }

    function hideMessage() {
        statusMessage.className = 'message hidden';
    }

    toggleToSignup.addEventListener('click', () => {
        viewLogin.classList.add('hidden');
        viewSignup.classList.remove('hidden');
        hideMessage();
    });

    toggleToLogin.addEventListener('click', () => {
        viewSignup.classList.add('hidden');
        viewLogin.classList.remove('hidden');
        hideMessage();
    });

    // --- Login Logic ---
    const formLogin = document.getElementById('form-login');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const btnLogin = document.getElementById('btn-login');

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();

        if (!email || !password) return;

        btnLogin.disabled = true;
        btnLogin.textContent = 'Logging in...';
        hideMessage();

        try {
            const { error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            // Success! Immediately redirect.
            window.location.href = 'dashboard.html';

        } catch (error) {
            showMessage(error.message);
        } finally {
            btnLogin.disabled = false;
            btnLogin.textContent = 'Log In';
        }
    });

    // --- Signup Logic ---
    const formSignup = document.getElementById('form-signup');
    const signupName = document.getElementById('signup-name');
    const signupUsername = document.getElementById('signup-username');
    const signupEmail = document.getElementById('signup-email');
    const signupPassword = document.getElementById('signup-password');
    const btnSignup = document.getElementById('btn-signup');

    formSignup.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = signupName.value.trim();
        const username = signupUsername.value.trim();
        const email = signupEmail.value.trim();
        const password = signupPassword.value.trim();

        if (!email || !name || !username || !password) return;

        btnSignup.disabled = true;
        btnSignup.textContent = 'Creating account...';
        hideMessage();

        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name,
                        username: username
                    },
                    // By default Supabase requires email confirmation
                    // This redirects user to dashboard after they click verification link
                    emailRedirectTo: window.location.origin + '/dashboard.html'
                }
            });

            if (error) throw error;

            // Check if email confirmation is required
            if (data?.user && data.user.identities && data.user.identities.length === 0) {
                showMessage('An account with this email already exists.', false);
            } else if (data?.session) {
                // If auto-confirm is enabled in Supabase settings
                window.location.href = 'dashboard.html';
            } else {
                showMessage('Account created! Please check your email to verify your account.', true);
                // Clear fields
                signupName.value = '';
                signupUsername.value = '';
                signupEmail.value = '';
                signupPassword.value = '';
            }

        } catch (error) {
            showMessage(error.message);
        } finally {
            btnSignup.disabled = false;
            btnSignup.textContent = 'Create Account';
        }
    });
});
