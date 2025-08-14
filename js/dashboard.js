// Dashboard Module
function loadDashboard() {
    updateStats();
    loadProjects();
    loadActivityFeed();
}

function updateStats() {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const team = JSON.parse(localStorage.getItem('team') || '[]');

    // Total Projects
    document.getElementById('totalProjects').textContent = projects.length;

    // Completed Tasks
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    document.getElementById('completedTasks').textContent = completedTasks;

    // Overdue Tasks
    const today = new Date();
    const overdueTasks = tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        return dueDate < today && task.status !== 'completed';
    }).length;
    document.getElementById('overdueTasks').textContent = overdueTasks;

    // Team Members
    document.getElementById('teamMembers').textContent = team.length;
}

// Main loadProjects function for dashboard
function loadProjects() {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const container = document.getElementById('projectsContainer');

    if (projects.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-project-diagram"></i>
                <h3>No Projects Found</h3>
                <p>Get started by creating your first project.</p>
                <button class="btn btn-primary" onclick="app.showModal('projectModal')">
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
                    <div class="project-actions">
                        <button class="btn btn-outline" onclick="editProject(${project.id}); event.stopPropagation();">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-primary" onclick="showProjectDetails(${project.id}); event.stopPropagation();">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Project Details Navigation Functions
function showProjectDetails(projectId) {
    // Store the project ID globally
    window.currentProjectId = projectId;

    // Switch to projects tab and show details
    window.app.switchTab('projects');

    // Use timeout to ensure tab switching is complete
    setTimeout(() => {
        showProjectDetailsInProjectsTab(projectId);
    }, 100);
}

function showProjectDetailsInProjectsTab(projectId) {
    const projectsTab = document.getElementById('projects');
    if (projectsTab) {
        // Create project details page within projects tab
        projectsTab.innerHTML = `
            <div class="page-header">
                <div class="header-actions">
                    <button class="btn btn-outline" onclick="goBackToProjectsList()">
                        <i class="fas fa-arrow-left"></i> Back to Projects
                    </button>
                    <h1 id="projectDetailPageTitle">Project Details</h1>
                </div>
                <div class="header-actions">
                    <button class="btn btn-outline" onclick="editCurrentProject()">
                        <i class="fas fa-edit"></i> Edit Project
                    </button>
                    <button class="btn btn-primary" onclick="addTaskToCurrentProject()">
                        <i class="fas fa-plus"></i> Add Task
                    </button>
                </div>
            </div>
            <div class="project-details-content" id="currentProjectDetails">
                <div class="loading">Loading project details...</div>
            </div>
        `;

        // Load the actual project details
        loadCurrentProjectDetails(projectId);
    }
}

// Load detailed project information
function loadCurrentProjectDetails(projectId) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const project = projects.find(function (p) { return p.id === projectId; });
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const team = JSON.parse(localStorage.getItem('team') || '[]');

    if (!project) {
        document.getElementById('currentProjectDetails').innerHTML = `
            <div class="empty-state-full">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Project Not Found</h3>
                <p>The requested project could not be found.</p>
                <button class="btn btn-primary" onclick="goBackToProjectsList()">
                    <i class="fas fa-arrow-left"></i> Back to Projects
                </button>
            </div>
        `;
        return;
    }

    // Update page title
    document.getElementById('projectDetailPageTitle').textContent = project.name;

    // Get project-specific data
    const projectTasks = tasks.filter(function (task) { return task.projectId === projectId; });
    const completedTasks = projectTasks.filter(function (task) { return task.status === 'completed'; }).length;
    const inProgressTasks = projectTasks.filter(function (task) { return task.status === 'in-progress'; }).length;
    const pendingTasks = projectTasks.filter(function (task) { return task.status === 'pending'; }).length;

    // Get assigned team members
    const assignedMemberIds = [];
    projectTasks.forEach(function (task) {
        if (task.assignee !== null) {
            assignedMemberIds.push(task.assignee);
        }
    });
    // Remove duplicates
    const uniqueAssignedMemberIds = [];
    assignedMemberIds.forEach(function (id) {
        if (uniqueAssignedMemberIds.indexOf(id) === -1) {
            uniqueAssignedMemberIds.push(id);
        }
    });

    const assignedMembers = team.filter(function (member) {
        return uniqueAssignedMemberIds.indexOf(member.id) !== -1;
    });

    // Calculate project duration
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);
    const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    // Generate task rows
    let taskRows = '';
    projectTasks.forEach(function (task) {
        const assignee = team.find(function (m) { return m.id === task.assignee; });
        const priorityClass = 'priority-' + task.priority;
        const priorityText = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
        const statusClass = 'status-' + task.status.replace(' ', '-');
        const statusText = task.status.replace('-', ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); });

        taskRows += `
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
    });

    // Generate team member cards
    let teamMemberCards = '';
    assignedMembers.forEach(function (member) {
        teamMemberCards += `
            <div class="team-member-card">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random" 
                     alt="${member.name}" class="team-member-avatar">
                <div class="team-member-info">
                    <h4>${member.name}</h4>
                    <p>${getRoleText(member.role)}</p>
                    <p>${member.email}</p>
                </div>
            </div>
        `;
    });

    // Generate project details HTML
    const content = document.getElementById('currentProjectDetails');
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
                                <span class="project-status status-${project.status}">${project.status.replace('-', ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); })}</span>
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
                            ${taskRows}
                        </tbody>
                    </table>
                </div>
            ` : `
                <div class="empty-state-full">
                    <i class="fas fa-tasks"></i>
                    <h3>No Tasks Found</h3>
                    <p>This project doesn't have any tasks yet.</p>
                    <button class="btn btn-primary" onclick="addTaskToCurrentProject()">
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
                    ${teamMemberCards}
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

// Navigation functions
function goBackToProjectsList() {
    // Reload the projects list
    loadProjects();
}

function editCurrentProject() {
    if (window.currentProjectId) {
        editProject(window.currentProjectId);
    }
}

function addTaskToCurrentProject() {
    if (window.currentProjectId) {
        // Set the project in the task form and show task modal
        document.getElementById('taskProject').value = window.currentProjectId;

        // We need to populate dropdowns - but these functions might be in tasks.js
        setTimeout(() => {
            if (typeof populateProjectDropdown === 'function') {
                populateProjectDropdown();
            }
            if (typeof populateAssigneeDropdown === 'function') {
                populateAssigneeDropdown();
            }
            document.getElementById('taskModalTitle').textContent = 'Add New Task';
            window.app.showModal('taskModal');
        }, 100);
    }
}

function loadActivityFeed() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const team = JSON.parse(localStorage.getItem('team') || '[]');

    // Sample activity data (in a real app, this would come from actual activity logs)
    const activities = [
        {
            id: 1,
            type: 'task-completed',
            message: 'Foundation Excavation completed',
            time: '2 hours ago',
            icon: 'check-circle'
        },
        {
            id: 2,
            type: 'task-assigned',
            message: 'Steel Framework Installation assigned to Maria Garcia',
            time: '1 day ago',
            icon: 'user-plus'
        },
        {
            id: 3,
            type: 'project-created',
            message: 'Downtown Office Complex project created',
            time: '2 days ago',
            icon: 'project-diagram'
        }
    ];

    const container = document.getElementById('activityFeed');
    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <h4>${activity.message}</h4>
                <p>System notification</p>
            </div>
            <div class="activity-time">${activity.time}</div>
        </div>
    `).join('');
}

// Helper functions
function formatDate(dateString) {
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

// Project Management Functions
function editProject(projectId) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const project = projects.find(p => p.id === projectId);

    if (project) {
        document.getElementById('projectId').value = project.id;
        document.getElementById('projectName').value = project.name;
        document.getElementById('projectDescription').value = project.description;
        document.getElementById('startDate').value = project.startDate;
        document.getElementById('endDate').value = project.endDate;
        document.getElementById('projectStatus').value = project.status;

        document.getElementById('projectModalTitle').textContent = 'Edit Project';
        app.showModal('projectModal');
    }
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

// Form handling
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('projectForm')) {
        document.getElementById('projectForm').addEventListener('submit', function (e) {
            e.preventDefault();

            const projectId = document.getElementById('projectId').value;
            const project = {
                id: projectId ? parseInt(projectId) : Date.now(),
                name: document.getElementById('projectName').value,
                description: document.getElementById('projectDescription').value,
                startDate: document.getElementById('startDate').value,
                endDate: document.getElementById('endDate').value,
                status: document.getElementById('projectStatus').value,
                progress: 0
            };

            let projects = JSON.parse(localStorage.getItem('projects') || '[]');

            if (projectId) {
                // Update existing project
                const index = projects.findIndex(p => p.id === parseInt(projectId));
                if (index !== -1) {
                    projects[index] = project;
                }
            } else {
                // Add new project
                projects.push(project);
            }

            localStorage.setItem('projects', JSON.stringify(projects));

            // Reset form and close modal
            this.reset();
            document.getElementById('projectId').value = '';
            document.getElementById('projectModalTitle').textContent = 'Add New Project';
            app.hideModal('projectModal');

            // Refresh dashboard
            loadProjects();
            updateStats();
        });

        document.getElementById('cancelProject').addEventListener('click', function () {
            document.getElementById('projectForm').reset();
            document.getElementById('projectId').value = '';
            document.getElementById('projectModalTitle').textContent = 'Add New Project';
            app.hideModal('projectModal');
        });

        // Add Project Button
        if (document.getElementById('addProjectBtn')) {
            document.getElementById('addProjectBtn').addEventListener('click', function () {
                app.showModal('projectModal');
            });
        }
    }
});