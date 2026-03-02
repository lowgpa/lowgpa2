// auth.js - Handles dual-mode login/signup logic

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Process URL hash fragments (Supabase auth redirects come as #access_token=...)
    if (window.location.hash && window.location.hash.includes('access_token')) {
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);
        return;
    }

    // 2. Session check first
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
    const loginIdentifier = document.getElementById('login-identifier'); // Handle both Email OR Username
    const loginPassword = document.getElementById('login-password');
    const btnLogin = document.getElementById('btn-login');

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifier = loginIdentifier.value.trim();
        const password = loginPassword.value.trim();

        if (!identifier || !password) return;

        btnLogin.disabled = true;
        btnLogin.textContent = 'Authenticating...';
        hideMessage();

        try {
            let emailToLogin = identifier;

            // If the user did NOT type an '@', assume it's a username and hit our custom Postgres RPC
            if (!identifier.includes('@')) {
                const { data, error: rpcError } = await supabaseClient.rpc('login_with_username', {
                    _username: identifier,
                    _password: password
                });

                if (rpcError) throw new Error('Database connection failed while finding user.');
                if (data.error) throw new Error(data.error);

                // If found, use the mapped email securely retrieved by the database
                emailToLogin = data.mapped_email;
            }

            // Perform the actual secure login with Supabase Auth using the resolved email
            const { error: loginError } = await supabaseClient.auth.signInWithPassword({
                email: emailToLogin,
                password: password
            });

            if (loginError) throw new Error("Invalid username or password");

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
                    emailRedirectTo: window.location.origin + '/dashboard.html'
                }
            });

            if (error) throw error;

            if (data?.user && data.user.identities && data.user.identities.length === 0) {
                showMessage('An account with this email already exists.', false);
            } else if (data?.session) {
                window.location.href = 'dashboard.html';
            } else {
                showMessage('Account created! Please check your email.', true);
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
