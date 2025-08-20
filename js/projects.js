// Projects Management Module

// --- This is the primary function for loading the projects page list ---
function loadProjectsList() {
    // This function specifically targets the container for the main projects page
    renderProjectList('projectsListContainer');
}

// --- Add/Replace this function ---
/*
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
// --- Add a simple HTML escaping helper (good practice) ---
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "<")
         .replace(/>/g, ">")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// Show project details page
function showProjectDetails(projectId) {
    // Prevent multiple clicks from causing recursion
    if (document.body.classList.contains('loading')) {
        return;
    }

    // Add loading state to prevent multiple calls
    document.body.classList.add('loading');

    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const project = projects.find(p => p.id === projectId);

    if (!project) {
        console.error('Project not found:', projectId);
        document.body.classList.remove('loading');
        return;
    }

    // Switch to project details tab
    window.app.switchTab('project-details');

    // Load project details after a small delay
    setTimeout(() => {
        loadProjectDetails(projectId);
        document.body.classList.remove('loading');
    }, 100);
}
/**
 * Loads the project list for the main projects page.
 * This is the entry point called by main.js for the 'projects' tab.
 */
function loadProjectsList() {
    // Delegate to the unified renderer, specifying the container for the projects list page
    renderProjectList('projectsListContainer');
}
// Load detailed project information
function loadProjectDetails(projectId) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const project = projects.find(p => p.id === projectId);
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const team = JSON.parse(localStorage.getItem('team') || '[]');

    if (!project) return;

    // Get project-specific data
    const projectTasks = tasks.filter(task => task.projectId === projectId);
    const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
    const inProgressTasks = projectTasks.filter(task => task.status === 'in-progress').length;
    const pendingTasks = projectTasks.filter(task => task.status === 'pending').length;

    // Get assigned team members
    const assignedMemberIds = [...new Set(projectTasks.map(task => task.assignee).filter(id => id !== null))];
    const assignedMembers = team.filter(member => assignedMemberIds.includes(member.id));

    // Calculate project duration
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);
    const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    // Update page title
    document.getElementById('projectDetailTitle').textContent = project.name;

    // Set up action buttons
    document.getElementById('editProjectDetailBtn').onclick = () => editProject(projectId);
    document.getElementById('addTaskToProjectBtn').onclick = () => {
        // Set the project in the task form and show task modal
        document.getElementById('taskProject').value = projectId;
        populateProjectDropdown();
        populateAssigneeDropdown();
        document.getElementById('taskModalTitle').textContent = 'Add New Task';
        window.app.showModal('taskModal');
    };

    // Generate project details HTML
    const content = document.getElementById('projectDetailsContent');
    content.innerHTML = `
        <!-- Project Overview Section -->
        <div class="project-detail-section">
            <h2><i class="fas fa-info-circle"></i> Project Overview</h2>
            <div class="project-overview-grid">
                <div class="overview-card">
                    <h4><i class="far fa-calendar"></i> Timeline</h4>
                    <div class="overview-stats">
                        <div class="stat-item">
                            <span class="stat-label">Start Date</span>
                            <span class="stat-value">${formatDate(project.startDate)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">End Date</span>
                            <span class="stat-value">${formatDate(project.endDate)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Duration</span>
                            <span class="stat-value">${durationDays} days</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Status</span>
                            <span class="stat-value">
                                <span class="project-status status-${project.status}">${project.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="overview-card">
                    <h4><i class="fas fa-chart-line"></i> Progress</h4>
                    <div class="overview-stats">
                        <div class="stat-item">
                            <span class="stat-label">Overall Progress</span>
                            <span class="stat-value">${project.progress}%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Progress Bar</span>
                            <span class="stat-value">
                                <div class="progress-bar" style="height: 10px;">
                                    <div class="progress-fill" style="width: ${project.progress}%; background: ${getProgressColor(project.progress)}; height: 100%;"></div>
                                </div>
                            </span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Completion Rate</span>
                            <span class="stat-value">${projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="overview-card">
                    <h4><i class="fas fa-tasks"></i> Task Statistics</h4>
                    <div class="overview-stats">
                        <div class="stat-item">
                            <span class="stat-label">Total Tasks</span>
                            <span class="stat-value">${projectTasks.length}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Completed</span>
                            <span class="stat-value">${completedTasks}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">In Progress</span>
                            <span class="stat-value">${inProgressTasks}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Pending</span>
                            <span class="stat-value">${pendingTasks}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tasks Section -->
        <div class="project-detail-section">
            <h2><i class="fas fa-list"></i> Project Tasks (${projectTasks.length})</h2>
            ${projectTasks.length > 0 ? `
                <div class="table-responsive">
                    <table class="tasks-table">
                        <thead>
                            <tr>
                                <th>Task Name</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Due Date</th>
                                <th>Assignee</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${projectTasks.map(task => {
        const assignee = team.find(m => m.id === task.assignee);
        const priorityClass = `priority-${task.priority}`;
        const priorityText = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
        const statusClass = `status-${task.status.replace(' ', '-')}`;
        const statusText = task.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

        return `
                                    <tr>
                                        <td class="task-name-cell">${task.name}</td>
                                        <td><span class="task-priority ${priorityClass}">${priorityText}</span></td>
                                        <td><span class="task-status ${statusClass}">${statusText}</span></td>
                                        <td>${formatDate(task.dueDate)}</td>
                                        <td>${assignee ? assignee.name : 'Unassigned'}</td>
                                        <td class="task-actions-cell">
                                            <div class="task-action-buttons">
                                                <button class="btn btn-outline btn-sm" onclick="editTask(${task.id})">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <div class="dropdown">
                                                    <button class="btn btn-outline btn-sm dropdown-toggle" onclick="toggleTaskDropdown(${task.id})">
                                                        <i class="fas fa-ellipsis-v"></i>
                                                    </button>
                                                    <div class="dropdown-menu" id="task-dropdown-${task.id}">
                                                        <a href="#" onclick="event.preventDefault(); viewTaskDetails(${task.id})"><i class="fas fa-eye"></i> View Details</a>
                                                        <a href="#" onclick="event.preventDefault(); editTask(${task.id})"><i class="fas fa-edit"></i> Edit Task</a>
                                                        <a href="#" onclick="event.preventDefault(); startTask(${task.id})"><i class="fas fa-play"></i> Start Task</a>
                                                        <a href="#" onclick="event.preventDefault(); completeTask(${task.id})"><i class="fas fa-check"></i> Mark Complete</a>
                                                        <a href="#" onclick="event.preventDefault(); assignTask(${task.id})"><i class="fas fa-user-plus"></i> Assign</a>
                                                        <a href="#" onclick="event.preventDefault(); addTaskComment(${task.id})"><i class="fas fa-comment"></i> Add Comment</a>
                                                        <a href="#" onclick="event.preventDefault(); deleteTask(${task.id})" class="danger"><i class="fas fa-trash"></i> Delete</a>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                `;
    }).join('')}
                        </tbody>
                    </table>
                </div>
            ` : `
                <div class="empty-state-full">
                    <i class="fas fa-tasks"></i>
                    <h3>No Tasks Found</h3>
                    <p>This project doesn't have any tasks yet.</p>
                    <button class="btn btn-primary" onclick="addTaskToProject(${projectId})">
                        <i class="fas fa-plus"></i> Add First Task
                    </button>
                </div>
            `}
        </div>

        <!-- Team Section -->
        <div class="project-detail-section">
            <h2><i class="fas fa-users"></i> Assigned Team (${assignedMembers.length})</h2>
            ${assignedMembers.length > 0 ? `
                <div class="team-members-grid">
                    ${assignedMembers.map(member => `
                        <div class="team-member-card">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random" 
                                 alt="${member.name}" class="team-member-avatar">
                            <div class="team-member-info">
                                <h4>${member.name}</h4>
                                <p>${getRoleText(member.role)}</p>
                                <p>${member.email}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="empty-state-full">
                    <i class="fas fa-users"></i>
                    <h3>No Team Members Assigned</h3>
                    <p>No team members are currently assigned to tasks in this project.</p>
                </div>
            `}
        </div>
    `;
}

// Helper functions
function goBackToProjects() {
    window.app.switchTab('projects');
}

function addTaskToProject(projectId) {
    // Set the project in the task form and show task modal
    document.getElementById('taskProject').value = projectId;

    // Try to populate dropdowns
    if (typeof populateProjectDropdown === 'function') {
        populateProjectDropdown();
    }
    if (typeof populateAssigneeDropdown === 'function') {
        populateAssigneeDropdown();
    }

    document.getElementById('taskModalTitle').textContent = 'Add New Task';

    // Show modal
    if (window.app && typeof window.app.showModal === 'function') {
        window.app.showModal('taskModal');
    } else {
        document.getElementById('taskModal').style.display = 'block';
    }
}

function showProjectModal() {
    document.getElementById('projectModalTitle').textContent = 'Add New Project';
    document.getElementById('projectId').value = '';

    // Reset form if it exists
    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
        projectForm.reset();
    }

    // Show modal
    if (window.app && typeof window.app.showModal === 'function') {
        window.app.showModal('projectModal');
    } else {
        document.getElementById('projectModal').style.display = 'block';
    }
}

function viewProjectDetails(projectId) {
    // This would open a project details modal
    alert(`Viewing details for project ID: ${projectId}`);
}

function deleteProject(projectId) {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
        let projects = JSON.parse(localStorage.getItem('projects') || '[]');
        projects = projects.filter(project => project.id !== projectId);
        localStorage.setItem('projects', JSON.stringify(projects));

        // Refresh the projects list
        loadProjectsList();

        // Show notification
        if (typeof showNotification === 'function') {
            showNotification('Project deleted successfully!', 'success');
        }
    }
}

// Dropdown functionality
function toggleProjectDropdown(projectId) {
    // Close all other dropdowns
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.remove('show');
    });

    // Find and show current dropdown
    const dropdown = document.getElementById(`project-dropdown-${projectId}`);
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

function toggleTaskDropdown(taskId) {
    // Close all other dropdowns
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.remove('show');
    });

    // Find and show current dropdown
    const dropdown = document.getElementById(`task-dropdown-${taskId}`);
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function (e) {
    if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    }
});