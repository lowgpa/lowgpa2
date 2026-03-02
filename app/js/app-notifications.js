// app-notifications.js - Handles fetching and rendering the notification dropdown

document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.getElementById('notification-trigger');
    const dropdown = document.getElementById('notification-dropdown');
    const badge = document.getElementById('notification-badge');
    const list = document.getElementById('notification-list');
    const markAllBtn = document.getElementById('mark-all-read');

    if (!trigger || !dropdown) return;

    // 1. Toggle Dropdown
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
        // Close profile dropdown if open to prevent overlap
        const profileDropdown = document.getElementById('profile-dropdown');
        if (profileDropdown && profileDropdown.classList.contains('active')) {
            profileDropdown.classList.remove('active');
        }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });

    // 2. Fetch Notifications function
    async function fetchNotifications() {
        const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();
        if (!session || sessionError) return;

        const { data, error } = await window.supabaseClient
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Error fetching notifications:', error);
            return;
        }

        renderNotifications(data);
    }

    // 3. Render Notifications
    function renderNotifications(notifications) {
        list.innerHTML = '';

        const unreadCount = notifications.filter(n => !n.is_read).length;

        // Update Badge and Mark All button
        if (unreadCount > 0) {
            badge.classList.remove('hidden');
            markAllBtn.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
            markAllBtn.classList.add('hidden');
        }

        if (notifications.length === 0) {
            list.innerHTML = `<div class="notification-empty">No new notifications</div>`;
            return;
        }

        notifications.forEach(n => {
            const date = new Date(n.created_at);
            // Format time nicely
            const timeString = date.toLocaleDateString() + ' \u2022 ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const item = document.createElement('div');
            item.className = `notification-item ${n.is_read ? '' : 'unread'}`;

            item.innerHTML = `
                <h4 class="notification-title">${escapeHTML(n.title)}</h4>
                <p class="notification-msg">${escapeHTML(n.message)}</p>
                <div class="notification-meta">
                    <span class="notification-time">${timeString}</span>
                    ${!n.is_read ? `<button class="mark-read-btn" data-id="${n.id}">Mark as read</button>` : '<span></span>'}
                </div>
            `;
            list.appendChild(item);
        });

        // Add event listeners to individual mark read buttons
        document.querySelectorAll('.mark-read-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = e.target.getAttribute('data-id');
                await markAsRead([id]);
            });
        });
    }

    // 4. Mark Specific as Read
    async function markAsRead(ids) {
        const { error } = await window.supabaseClient
            .from('notifications')
            .update({ is_read: true })
            .in('id', ids);

        if (error) {
            console.error('Error updating notifications:', error);
            return;
        }

        // Re-fetch to update UI states
        fetchNotifications();
    }

    // 5. Mark All Unread as Read
    markAllBtn.addEventListener('click', async (e) => {
        e.stopPropagation();

        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) return;

        const { error } = await window.supabaseClient
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', session.user.id)
            .eq('is_read', false);

        if (error) {
            console.error('Error marking all as read:', error);
            return;
        }

        fetchNotifications();
    });

    // Helper logic to prevent XSS injection
    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g,
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag])
        );
    }

    // Initialize
    fetchNotifications();
});
