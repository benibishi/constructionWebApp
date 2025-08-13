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
            <div class="project-card">
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
                        <button class="btn btn-outline" onclick="editProject(${project.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-primary" onclick="viewProjectDetails(${project.id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
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

function viewProjectDetails(projectId) {
    alert(`Viewing details for project ID: ${projectId}`);
    // In a full implementation, this would show project details
}

// Form handling
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
document.getElementById('addProjectBtn').addEventListener('click', function () {
    app.showModal('projectModal');
});