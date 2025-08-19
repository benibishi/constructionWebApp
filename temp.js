// --- Add/Replace this function ---
/**
 * Renders the list of projects into the specified container.
 * @param {string} containerId - The ID of the HTML element to render the projects into.
 */
function renderProjectList(containerId) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const container = document.getElementById(containerId); // Use the passed ID

    if (!container) {
        console.warn(`Container with ID '${containerId}' not found for project list rendering.`);
        return; // Exit if container not found
    }

    if (projects.length === 0) {
        // Use a generic empty state that can be used in both contexts or customize based on containerId if needed
        // For simplicity, using a generic one here. You might differentiate if UI needs differ significantly.
        container.innerHTML = `
            <div class="empty-state-full"> <!-- Using empty-state-full for consistency -->
                <i class="fas fa-project-diagram"></i>
                <h3>No Projects Found</h3>
                <p>Get started by creating your first project.</p>
                <button class="btn btn-primary" onclick="showProjectModal()">
                    <i class="fas fa-plus"></i> Create Project
                </button>
            </div>
        `;
        return;
    }

    // Generate project cards HTML
    const projectCardsHtml = projects.map(project => {
        const statusClass = `status-${project.status}`;
        // Capitalize status text consistently
        const statusText = project.status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        // Use consistent HTML structure for project cards
        return `
            <div class="project-card" onclick="showProjectDetails(${project.id})" style="cursor: pointer;">
                <div class="project-header">
                    <h3>${escapeHtml(project.name)}</h3> <!-- Escape HTML for safety -->
                    <p>${escapeHtml(project.description)}</p>
                </div>
                <div class="project-body">
                    <div class="project-meta">
                        <span><i class="far fa-calendar"></i> ${formatDate(project.startDate)}</span>
                        <span><i class="far fa-calendar-check"></i> ${formatDate(project.endDate)}</span>
                    </div>
                    <div class="project-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${project.progress}%; background: ${getProgressColor(project.progress)}"></div>
                        </div>
                        <div class="progress-info">
                            <span>${project.progress}% Complete</span>
                            <span>${statusText}</span>
                        </div>
                    </div>
                    <span class="project-status ${statusClass}">${statusText}</span>
                </div>
                <div class="project-actions">
                    <button class="btn btn-outline" onclick="editProject(${project.id}); event.stopPropagation();">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = projectCardsHtml;
}