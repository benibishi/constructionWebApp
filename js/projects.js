// Projects Management Module

// Load all projects for the projects list page
function loadProjectsList() {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const container = document.getElementById('projectsListContainer');

    if (projects.length === 0) {
        container.innerHTML = `
            <div class="empty-state-full">
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

    container.innerHTML = projects.map(project => {
        const statusClass = `status-${project.status}`;
        const statusText = project.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

        return `
            <div class="project-card" onclick="showProjectDetails(${project.id})" style="cursor: pointer;">
                <div class="project-header">
                    <h3>${project.name}</h3>
                    <p>${project.description}</p>
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
            </div>
        `;
    }).join('');
}

// Show project details page
function showProjectDetails(projectId) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const project = projects.find(p => p.id === projectId);

    if (!project) {
        console.error('Project not found:', projectId);
        return;
    }

    // Switch to project details tab
    window.app.switchTab('project-details');

    // Load project details
    loadProjectDetails(projectId);
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
                                            <button class="btn btn-outline btn-sm" onclick="editTask(${task.id})">
                                                <i class="fas fa-edit"></i>
                                            </button>
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
    populateProjectDropdown();
    populateAssigneeDropdown();
    document.getElementById('taskModalTitle').textContent = 'Add New Task';
    window.app.showModal('taskModal');
}

function showProjectModal() {
    document.getElementById('projectModalTitle').textContent = 'Add New Project';
    document.getElementById('projectId').value = '';
    document.getElementById('projectForm').reset();
    app.showModal('projectModal');
}

function formatDate(dateString) {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getProgressColor(progress) {
    if (progress < 30) return '#ef4444'; // red
    if (progress < 70) return '#f59e0b'; // orange
    return '#10b981'; // green
}

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

// Initialize when tab is loaded
function loadProjects() {
    loadProjectsList();
}
// Add event listeners
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('addProjectBtnMain')) {
        document.getElementById('addProjectBtnMain').addEventListener('click', showProjectModal);
    }
});