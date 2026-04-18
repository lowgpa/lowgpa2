/**
 * ╔══════════════════════════════════════════════════════════╗
 *  QUEUE DATA — ISLAMABAD EMBASSY
 *  Edit this file to update monthly student counts.
 *  Fields:
 *    month     — Display name  (e.g. "August 2025")
 *    students  — Total students who joined that month
 *    processed — true  = fully processed by embassy (skipped in queue)
 *                false = still waiting (fully or partially)
 *    covered   — (optional) Number of students already covered
 *                from a partially-processed month. Only used when
 *                processed = false.
 *  Last updated: 19 April 2026
 * ╚══════════════════════════════════════════════════════════╝
 */
window.queueMonthsData = [
    { "month": "July 2025",      "students": 315, "processed": true },
    { "month": "August 2025",    "students": 205, "processed": true },
    { "month": "September 2025", "students": 110, "processed": false, "covered": 40 },
    { "month": "October 2025",   "students": 120, "processed": false },
    { "month": "November 2025",  "students": 100, "processed": false },
    { "month": "December 2025",  "students": 160, "processed": false },
    { "month": "January 2026",   "students": 150, "processed": false },
    { "month": "February 2026",  "students": 135, "processed": false },
    { "month": "March 2026",     "students": 100, "processed": false },
    { "month": "April 2026",     "students": 50,  "processed": false }
];
