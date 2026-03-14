// app-queue-estimator.js — Protected Queue Estimator logic

document.addEventListener('DOMContentLoaded', async () => {
    // ── Init Icons ──────────────────────────────────────────────
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // ── Auth Guard ──────────────────────────────────────────────
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    if (!session || sessionError) {
        window.location.replace('index.html');
        return;
    }
    const user = session.user;
    document.body.style.visibility = 'visible';

    // ── Fetch profile ─────────────────────────────────────────────
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role, username, full_name')
        .eq('id', user.id)
        .single();

    const displayName = profile?.full_name || 'User';
    const displayRole = profile?.role || 'user';
    const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    document.getElementById('nav-fullname').textContent = displayName;
    document.getElementById('nav-fullname').classList.remove('skeleton');
    document.getElementById('nav-role').textContent = displayRole;
    document.getElementById('nav-role').classList.remove('skeleton');
    document.getElementById('avatar-initials').textContent = initials;
    document.getElementById('avatar-initials').classList.remove('skeleton');

    // ── Reveal page ───────────────────────────────────────────────
    const preloader = document.getElementById('brand-preloader');
    const content = document.getElementById('dashboard-content');
    if (preloader) { preloader.style.opacity = '0'; preloader.style.visibility = 'hidden'; setTimeout(() => preloader.remove(), 400); }
    setTimeout(() => { if (content) content.style.opacity = '1'; }, 100);

    // ── Profile dropdown ──────────────────────────────────────────
    const profileTrigger = document.getElementById('profile-trigger');
    const profileDropdown = document.getElementById('profile-dropdown');
    if (profileTrigger && profileDropdown) {
        profileTrigger.addEventListener('click', e => { e.stopPropagation(); profileDropdown.classList.toggle('active'); });
        document.addEventListener('click', e => { if (!profileTrigger.contains(e.target)) profileDropdown.classList.remove('active'); });
    }

    // ── Logout ────────────────────────────────────────────────────
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.replace('index.html');
    });
    supabaseClient.auth.onAuthStateChange(event => {
        if (event === 'SIGNED_OUT') window.location.replace('index.html');
    });

    // ════════════════════════════════════════════════════════════
    //  LOAD MONTHLY DATA FROM DATA FILE (data/queue-months-data.js)
    // ════════════════════════════════════════════════════════════

    let monthlyData = [];

    if (window.queueMonthsData && Array.isArray(window.queueMonthsData)) {
        monthlyData = window.queueMonthsData;
    } else {
        console.warn('queue-months-data.js not loaded — using built-in defaults.');
        monthlyData = [
            { month: 'July 2025', students: 315, processed: true },
            { month: 'August 2025', students: 120, processed: false },
            { month: 'September 2025', students: 120, processed: false },
            { month: 'October 2025', students: 130, processed: false },
            { month: 'November 2025', students: 110, processed: false },
            { month: 'December 2025', students: 110, processed: false },
            { month: 'January 2026', students: 130, processed: false },
            { month: 'February 2026', students: 100, processed: false },
        ];
    }

    // ════════════════════════════════════════════════════════════
    //  COLLAPSIBLE TABLE TOGGLE
    // ════════════════════════════════════════════════════════════

    const tableCollapsible = document.getElementById('table-collapsible');
    const btnToggleTable = document.getElementById('btn-toggle-table');
    let tableOpen = false;

    btnToggleTable.addEventListener('click', () => {
        tableOpen = !tableOpen;
        tableCollapsible.classList.toggle('open', tableOpen);
        btnToggleTable.innerHTML = tableOpen
            ? `<i data-lucide="eye-off" style="width:14px;height:14px;"></i> <span>Hide Data</span>`
            : `<i data-lucide="eye" style="width:14px;height:14px;"></i> <span>Show Data</span>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    });

    // ════════════════════════════════════════════════════════════
    //  INLINE ERROR HELPER
    // ════════════════════════════════════════════════════════════

    const errorBanner = document.getElementById('calc-error');

    function showError(msg) {
        errorBanner.querySelector('span').textContent = msg;
        errorBanner.style.display = 'flex';
        if (typeof lucide !== 'undefined') lucide.createIcons();
        clearTimeout(errorBanner._hideTimer);
        errorBanner._hideTimer = setTimeout(() => clearError(), 4000);
    }
    function clearError() {
        errorBanner.style.display = 'none';
        errorBanner.querySelector('span').textContent = '';
    }

    // ════════════════════════════════════════════════════════════
    //  QUEUE ESTIMATOR LOGIC
    // ════════════════════════════════════════════════════════════

    const todayStr = new Date().toISOString().split('T')[0];
    document.getElementById('input-current-date').value = todayStr;

    let selectedWeek = null;

    const weekPillsContainer = document.getElementById('week-pills');
    weekPillsContainer.addEventListener('click', e => {
        const btn = e.target.closest('.week-pill');
        if (!btn) return;
        weekPillsContainer.querySelectorAll('.week-pill').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        selectedWeek = parseInt(btn.dataset.week, 10);
        clearError();
        if (document.getElementById('results-output').style.display !== 'none') calculate();
    });

    // ── Helpers ──────────────────────────────────────────────────
    function formatDate(date) {
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    function addDays(date, days) {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
    }

    // ── Stats Bar ─────────────────────────────────────────────────
    function updateStats() {
        const processingRate = parseFloat(document.getElementById('input-rate').value) || 25;
        const inQueue = monthlyData.filter(r => !r.processed).reduce((s, r) => s + r.students, 0);
        const weeksToClear = (inQueue / processingRate).toFixed(1);

        document.getElementById('stat-total-months').textContent = monthlyData.length;
        document.getElementById('stat-in-queue').textContent = inQueue.toLocaleString();
        document.getElementById('stat-weeks-clear').textContent = weeksToClear;
    }

    // ── Month Timeline ────────────────────────────────────────────
    function renderTimeline() {
        let container = document.getElementById('month-timeline');
        if (!container) {
            container = document.createElement('div');
            container.id = 'month-timeline';
            container.className = 'month-timeline';
            // Insert at top of the collapsible, before the table
            const collapsible = document.getElementById('table-collapsible');
            collapsible.insertBefore(container, collapsible.firstChild);
        }
        container.innerHTML = '';
        monthlyData.forEach(row => {
            const pill = document.createElement('div');
            pill.className = `timeline-pill ${row.processed ? 'done' : 'pending'}`;
            // Abbreviate month name: "Aug \n '25"
            const parts = row.month.split(' ');
            const shortMonth = parts[0].substring(0, 3);
            const year = parts[1] ? "'" + parts[1].slice(-2) : '';
            pill.innerHTML = `<span class="tl-month">${shortMonth} ${year}</span><span class="tl-count">${row.students}</span>`;
            pill.title = `${row.month}: ${row.students} students — ${row.processed ? 'Processed ✓' : 'Pending'}`;
            container.appendChild(pill);
        });
    }

    // ── Render Table ─────────────────────────────────────────────
    function renderTable() {
        const tbody = document.getElementById('monthly-tbody');
        tbody.innerHTML = '';

        monthlyData.forEach((row, index) => {
            const isDone = row.processed;
            const tr = document.createElement('tr');
            if (isDone) tr.classList.add('processed-row');

            tr.innerHTML = `
                <td>${row.month}</td>
                <td id="students-display-${index}">${row.students.toLocaleString()}</td>
                <td>
                    <button class="toggle-processed ${isDone ? 'done' : ''}" data-index="${index}">
                        ${isDone
                    ? '<i data-lucide="check-circle-2" style="width:12px;height:12px;"></i> Processed'
                    : '<i data-lucide="circle" style="width:12px;height:12px;"></i> Pending'}
                    </button>
                </td>
                <td>
                    <button class="btn-edit" id="btn-edit-${index}" data-index="${index}">
                        <i data-lucide="pencil" style="width:12px;height:12px;display:inline;margin-right:4px;"></i>Edit
                    </button>
                    <span id="edit-controls-${index}" style="display:none;align-items:center;gap:0.5rem;">
                        <input type="number" id="edit-input-${index}" value="${row.students}" min="0" style="width:80px;">
                        <button class="btn-save" data-index="${index}">Save</button>
                    </span>
                </td>`;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.toggle-processed').forEach(btn => {
            btn.addEventListener('click', () => {
                const i = Number(btn.dataset.index);
                monthlyData[i].processed = !monthlyData[i].processed;
                renderTable(); renderTimeline(); repopulateMonthDropdown(); updateStats(); resetResults();
                if (typeof lucide !== 'undefined') lucide.createIcons();
            });
        });

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const i = Number(btn.dataset.index);
                document.getElementById(`students-display-${i}`).style.display = 'none';
                btn.style.display = 'none';
                document.getElementById(`edit-controls-${i}`).style.display = 'flex';
                const inp = document.getElementById(`edit-input-${i}`);
                inp.focus(); inp.select();
            });
        });

        document.querySelectorAll('.btn-save').forEach(btn => {
            btn.addEventListener('click', () => {
                const i = Number(btn.dataset.index);
                const val = parseInt(document.getElementById(`edit-input-${i}`).value, 10);
                if (!isNaN(val) && val >= 0) monthlyData[i].students = val;
                renderTable(); renderTimeline(); repopulateMonthDropdown(); updateStats(); resetResults();
                if (typeof lucide !== 'undefined') lucide.createIcons();
            });
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // ── Month Dropdown ───────────────────────────────────────────
    function repopulateMonthDropdown() {
        const sel = document.getElementById('select-month');
        const prev = sel.value;
        sel.innerHTML = '<option value="" disabled selected>— Select month —</option>';
        monthlyData.forEach(row => {
            if (row.processed) return;
            const opt = document.createElement('option');
            opt.value = row.month; opt.textContent = row.month;
            sel.appendChild(opt);
        });
        if (prev && [...sel.options].some(o => o.value === prev)) sel.value = prev;
    }

    // ── Reset Results ────────────────────────────────────────────
    function resetResults() {
        document.getElementById('results-placeholder').style.display = '';
        document.getElementById('results-output').style.display = 'none';
        ['rc-position', 'rc-weeks', 'rc-date'].forEach(id => {
            document.getElementById(id).classList.remove('visible', 'urgent-soon', 'urgent-mid', 'urgent-far');
        });
        document.getElementById('queue-progress-fill').style.width = '0%';
    }

    function urgencyClass(weeks) {
        if (weeks <= 8) return 'urgent-soon';
        if (weeks <= 20) return 'urgent-mid';
        return 'urgent-far';
    }

    // ── Calculation ──────────────────────────────────────────────
    function calculate() {
        clearError();
        const selectedMonth = document.getElementById('select-month').value;
        const processingRate = parseFloat(document.getElementById('input-rate').value);
        const currentDateStr = document.getElementById('input-current-date').value;

        if (!selectedMonth) { showError('Please select the month you joined.'); return; }
        if (!selectedWeek) { showError('Please select the week you joined (Week 1–4).'); return; }
        if (!processingRate || processingRate <= 0) { showError('Processing rate must be greater than 0.'); return; }
        if (!currentDateStr) { showError('Please enter a current date.'); return; }

        const monthIndex = monthlyData.findIndex(r => r.month === selectedMonth);
        if (monthIndex === -1) { showError('Selected month not found in data.'); return; }

        const monthEntry = monthlyData[monthIndex];
        const studentsPerWeek = monthEntry.students / 4;

        const studentsBefore = monthlyData
            .slice(0, monthIndex)
            .filter(r => !r.processed)
            .reduce((sum, r) => sum + r.students, 0);

        const queuePosition = Math.round(studentsBefore + ((selectedWeek - 1) * studentsPerWeek));
        const weeksUntil = queuePosition / processingRate;
        const totalInQueue = monthlyData.filter(r => !r.processed).reduce((s, r) => s + r.students, 0);
        const progressPct = totalInQueue > 0 ? Math.min((queuePosition / totalInQueue) * 100, 100) : 0;

        const currentDate = new Date(currentDateStr + 'T00:00:00');
        const estimatedCentre = addDays(currentDate, Math.round(weeksUntil * 7));
        const estimatedEarly = addDays(estimatedCentre, -7);
        const estimatedLate = addDays(estimatedCentre, 14);

        document.getElementById('results-placeholder').style.display = 'none';
        document.getElementById('results-output').style.display = 'block';
        document.getElementById('rv-position').textContent = queuePosition.toLocaleString();
        document.getElementById('rv-weeks').textContent = weeksUntil.toFixed(1);
        document.getElementById('rv-date-from').textContent = formatDate(estimatedEarly);
        document.getElementById('rv-date-to').textContent = formatDate(estimatedLate);

        const pct = Math.round(progressPct);
        document.getElementById('rv-progress-pct').textContent = `${pct}% through`;
        setTimeout(() => { document.getElementById('queue-progress-fill').style.width = `${pct}%`; }, 100);

        const urg = urgencyClass(weeksUntil);
        ['rc-position', 'rc-weeks', 'rc-date'].forEach((id, i) => {
            const el = document.getElementById(id);
            el.classList.remove('visible', 'urgent-soon', 'urgent-mid', 'urgent-far');
            setTimeout(() => { el.classList.add('visible', urg); }, 80 * (i + 1));
        });

        // WhatsApp share URL
        const waText = encodeURIComponent(
            `*Queue Estimate — Islamabad Embassy*\n`
            + `*Month:* ${selectedMonth} (Week ${selectedWeek})\n`
            + `*Queue Position:* ~${queuePosition.toLocaleString()} students\n`
            + `*Est. Weeks Remaining:* ${weeksUntil.toFixed(1)}\n`
            + `*Estimated Window:* ${formatDate(estimatedEarly)} - ${formatDate(estimatedLate)}\n`
            + `*Note:* Prediction only. Actual dates may vary.\n`
            + `\n*Check your estimate:* https://lowgpa.online/app/queue-estimator`
        );
        document.getElementById('whatsapp-share-btn').href = `https://wa.me/?text=${waText}`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    document.getElementById('btn-calculate').addEventListener('click', calculate);

    ['input-rate', 'input-current-date', 'select-month'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            updateStats();
            if (document.getElementById('results-output').style.display !== 'none') calculate();
        });
    });

    // ── Copy Result ──────────────────────────────────────────────
    document.getElementById('copy-result-btn').addEventListener('click', () => {
        const pos = document.getElementById('rv-position').textContent;
        const weeks = document.getElementById('rv-weeks').textContent;
        const from = document.getElementById('rv-date-from').textContent;
        const to = document.getElementById('rv-date-to').textContent;
        const month = document.getElementById('select-month').value;
        const week = selectedWeek ? `Week ${selectedWeek}` : '—';

        const text = `📋 Queue Estimate — Islamabad Embassy\n`
            + `Month: ${month} (${week})\n`
            + `Queue Position: ${pos} students\n`
            + `Est. Weeks Remaining: ${weeks}\n`
            + `Estimated Window: ${from} – ${to}\n`
            + `⚠️ Prediction only. Actual dates may vary ±1–2 weeks.`;

        navigator.clipboard.writeText(text).then(() => {
            const btn = document.getElementById('copy-result-btn');
            btn.classList.add('copied');
            btn.innerHTML = '<i data-lucide="check" style="width:13px;height:13px;"></i> Copied!';
            if (typeof lucide !== 'undefined') lucide.createIcons();
            setTimeout(() => {
                btn.classList.remove('copied');
                btn.innerHTML = '<i data-lucide="copy" style="width:13px;height:13px;"></i> Copy Result';
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }, 2500);
        }).catch(() => showError('Could not copy to clipboard.'));
    });

    // ── Add New Month ─────────────────────────────────────────────
    document.getElementById('btn-add-month').addEventListener('click', () => {
        const nameEl = document.getElementById('new-month-name');
        const studentsEl = document.getElementById('new-month-students');
        const name = nameEl.value.trim();
        const students = parseInt(studentsEl.value, 10);

        if (!name) { showError('Please enter a month name.'); nameEl.focus(); return; }
        if (isNaN(students) || students < 0) { showError('Please enter a valid student count.'); studentsEl.focus(); return; }
        if (monthlyData.some(r => r.month.toLowerCase() === name.toLowerCase())) {
            showError('This month already exists in the table.'); return;
        }

        monthlyData.push({ month: name, students, processed: false });
        nameEl.value = ''; studentsEl.value = '';
        renderTable(); renderTimeline(); repopulateMonthDropdown(); updateStats(); resetResults();
    });

    // ── Initial render ─────────────────────────────────────────────
    renderTable();
    renderTimeline();
    repopulateMonthDropdown();
    updateStats();
});
