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
    const btnLogin = document.getElementById('btn-login');

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginEmail.value.trim();
        if (!email) return;

        btnLogin.disabled = true;
        btnLogin.textContent = 'Sending...';
        hideMessage();

        try {
            const { error } = await supabaseClient.auth.signInWithOtp({
                email: email,
                options: {
                    emailRedirectTo: window.location.origin + '/dashboard.html'
                }
            });

            if (error) throw error;
            showMessage('Check your email for the secure magic link!', true);
            loginEmail.value = '';
        } catch (error) {
            showMessage(error.message);
        } finally {
            btnLogin.disabled = false;
            btnLogin.textContent = 'Log In with Magic Link';
        }
    });

    // --- Signup Logic ---
    const formSignup = document.getElementById('form-signup');
    const signupName = document.getElementById('signup-name');
    const signupUsername = document.getElementById('signup-username');
    const signupEmail = document.getElementById('signup-email');
    const btnSignup = document.getElementById('btn-signup');

    formSignup.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = signupName.value.trim();
        const username = signupUsername.value.trim();
        const email = signupEmail.value.trim();

        if (!email || !name || !username) return;

        btnSignup.disabled = true;
        btnSignup.textContent = 'Creating account...';
        hideMessage();

        try {
            // Include metadata so Postgres trigger can read it
            const { error } = await supabaseClient.auth.signInWithOtp({
                email: email,
                options: {
                    data: {
                        full_name: name,
                        username: username
                    },
                    emailRedirectTo: window.location.origin + '/dashboard.html'
                }
            });

            if (error) throw error;
            showMessage('Account created! Check your email to verify and log in.', true);

            // Clear fields on success
            signupName.value = '';
            signupUsername.value = '';
            signupEmail.value = '';

        } catch (error) {
            showMessage(error.message);
        } finally {
            btnSignup.disabled = false;
            btnSignup.textContent = 'Create Account';
        }
    });
});
