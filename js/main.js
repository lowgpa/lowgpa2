document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        // Normalize URLs to handle 'index.html' and trailing slashes consistency
        const normalize = (url) => url.replace(/\/index\.html$/, '').replace(/\/$/, '');

        if (normalize(link.href) === normalize(window.location.href)) {
            link.classList.add('active');
        }
    });

    console.log('LowGPA.online loaded');
});
