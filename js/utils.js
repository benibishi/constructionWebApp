// js/utils.js - Common utility functions

/**
 * Formats a date string into a human-readable format (e.g., Jan 15, 2024).
 * @param {string} dateString - The date string to format (expected in ISO format like YYYY-MM-DD).
 * @param {string} format - Optional format specifier ('short' for abbreviated month/day).
 * @returns {string} The formatted date string or 'No date set' if input is falsy.
 */
function formatDate(dateString, format = 'full') {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);

    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };

    if (format === 'short') {
        // For short format, you might want just month/day or a different representation
        // This example keeps it similar but you can adjust
        options.year = undefined; // Remove year for short format if desired
        // Or use: return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // Adjust based on the 'short' requirement if needed
    if (format === 'short') {
         return date.toLocaleDateString('en-US', {
             month: 'short',
             day: 'numeric'
        });
    }

    return date.toLocaleDateString('en-US', options);
}

/**
 * Converts a role key into a human-readable role name.
 * @param {string} role - The role key (e.g., 'project-manager').
 * @returns {string} The formatted role name or the original key if not found.
 */
function getRoleText(role) {
    const roles = {
        'project-manager': 'Project Manager',
        'site-supervisor': 'Site Supervisor',
        'engineer': 'Engineer',
        'foreman': 'Foreman',
        'worker': 'Worker'
    };
    return roles[role] || role;
}

/**
 * Determines the color associated with a progress percentage.
 * @param {number} progress - The progress percentage (0-100).
 * @returns {string} The hex color code.
 */
function getProgressColor(progress) {
    if (progress < 30) return '#ef4444'; // red
    if (progress < 70) return '#f59e0b'; // orange
    return '#10b981'; // green
}

// Export functions for global access (assuming they are attached to window in main.js context)
// This makes them available globally like other functions
if (typeof window !== 'undefined') {
    window.formatDate = formatDate;
    window.getRoleText = getRoleText;
    window.getProgressColor = getProgressColor;
}

// If using ES6 modules (would require type="module" in script tags or a build step)
// export { formatDate, getRoleText, getProgressColor };