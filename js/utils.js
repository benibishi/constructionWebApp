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
// js/utils.js - Add these functions at the end of the file

/**
 * Sorts the rows of a table based on the values in a specific column.
 * @param {HTMLTableElement} table - The table element to sort.
 * @param {number} columnIndex - The index of the column to sort by (0-based).
 * @param {boolean} ascending - True for ascending order, false for descending.
 */
function sortTableByColumn(table, columnIndex, ascending = true) {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    // Define how to get the value for sorting from a cell
    const getCellValue = (tr, idx) => {
        // Try to get text content, or data-sort attribute if available for custom sorting
        const cell = tr.cells[idx];
        const sortValue = cell?.dataset.sort; // Check for data-sort attribute first
        if (sortValue !== undefined && sortValue !== null) {
            return sortValue;
        }
        // Fallback to text content, trimmed and lowercased for text comparison
        return cell?.textContent.trim().toLowerCase() || '';
    };

    // Determine sort direction multiplier
    const multiplier = ascending ? 1 : -1;

    // Perform the sort
    const sortedRows = rows.sort((rowA, rowB) => {
        const aValue = getCellValue(rowA, columnIndex);
        const bValue = getCellValue(rowB, columnIndex);

        // Attempt to compare as numbers first
        const aNum = parseFloat(aValue);
        const bNum = parseFloat(bValue);
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return multiplier * (aNum - bNum);
        }

        // If not numbers, compare as strings
        return multiplier * aValue.localeCompare(bValue);
    });

    // Re-append sorted rows to the tbody
    // This automatically removes them from their previous position
    sortedRows.forEach(row => tbody.appendChild(row));
}

/**
 * Makes a table sortable by attaching click listeners to sortable headers.
 * Headers with the class 'sortable' will be made sortable.
 * @param {string} tableId - The ID of the table element.
 */
function makeTableSortable(tableId) {
    const table = document.getElementById(tableId);
    if (!table) {
        console.warn(`Table with ID '${tableId}' not found for sorting.`);
        return;
    }

    const headers = table.querySelectorAll('thead th.sortable'); // Only make 'sortable' headers interactive
    let currentSortColumn = null;
    let isAscending = true;

    headers.forEach((header, index) => {
        // Add visual indicator that header is sortable
        header.style.cursor = 'pointer';
        header.setAttribute('tabindex', '0'); // Make headers focusable for accessibility

        // Add initial sort indicator (e.g., arrows)
        const sortIndicator = document.createElement('span');
        sortIndicator.className = 'sort-indicator';
        sortIndicator.style.marginLeft = '5px';
        sortIndicator.innerHTML = ' ↕️'; // Neutral indicator
        header.appendChild(sortIndicator);

        // Attach click listener
        header.addEventListener('click', () => {
            // Determine sort direction
            if (currentSortColumn === index) {
                // Clicking the same column toggles direction
                isAscending = !isAscending;
            } else {
                // Clicking a new column sorts ascending by default
                isAscending = true;
                currentSortColumn = index;
            }

            // Update visual indicators for ALL headers
            headers.forEach((h, i) => {
                const indicator = h.querySelector('.sort-indicator');
                if (indicator) {
                    if (i === index) {
                        // Update indicator for the clicked column
                        indicator.innerHTML = isAscending ? ' ↑' : ' ↓';
                    } else {
                        // Reset indicators for other columns
                        indicator.innerHTML = ' ↕️';
                    }
                }
            });

            // Perform the sort
            sortTableByColumn(table, index, isAscending);
        });

        // Optional: Add keyboard support (Enter/Space to sort)
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                header.click(); // Trigger the click event
            }
        });
    });
}

// Ensure these functions are available globally
if (typeof window !== 'undefined') {
    window.sortTableByColumn = sortTableByColumn;
    window.makeTableSortable = makeTableSortable;
}

function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "<")
        .replace(/>/g, ">")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
// Export if using modules (optional)
// export { sortTableByColumn, makeTableSortable };
