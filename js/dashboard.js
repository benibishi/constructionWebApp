// Dashboard Module
function loadDashboard() {
    updateStats();
    // loadProjects(); // This is handled by the projects tab
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
    // Delegate to the unified renderer from projects.js
    // The dashboard projects container is 'projectsContainer'
    if (typeof renderProjectList === 'function') {
        renderProjectList('projectsContainer', false); // `false` to not show checkboxes
    } else {
        console.error("Dashboard.js: renderProjectList function not found. Ensure projects.js is loaded first.");
    }
}

function loadActivityFeed() {
    // This is sample data. In a real app, this would come from an API or a more robust source.
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

// Task Management Functions for Project Page
function editTask(taskId) {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const task = tasks.find(t => t.id === taskId);

    if (task) {
        document.getElementById('taskId').value = task.id;
        document.getElementById('taskName').value = task.name;
        document.getElementById('taskDescription').value = task.description;
        document.getElementById('taskProject').value = task.projectId;
        document.getElementById('taskDueDate').value = task.dueDate;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskAssignee').value = task.assignee || '';

        // Populate dependencies
        if (typeof populateDependenciesDropdown === 'function') {
            populateDependenciesDropdown(taskId);
        }

        // Set selected dependencies
        const dependenciesSelect = document.getElementById('taskDependencies');
        if (dependenciesSelect && task.dependencies && task.dependencies.length > 0) {
            Array.from(dependenciesSelect.options).forEach(option => {
                if (task.dependencies.includes(parseInt(option.value))) {
                    option.selected = true;
                }
            });
        }

        document.getElementById('taskModalTitle').textContent = 'Edit Task';

        // Populate dropdowns
        if (typeof populateProjectDropdown === 'function') {
            populateProjectDropdown();
        }
        if (typeof populateAssigneeDropdown === 'function') {
            populateAssigneeDropdown();
        }

        // If we're editing from project page, disable project dropdown
        if (window.currentProjectId && window.currentProjectId === task.projectId) {
            const projectSelect = document.getElementById('taskProject');
            if (projectSelect) {
                projectSelect.value = task.projectId;
                projectSelect.disabled = true;
            }
        }

        if (window.app && typeof window.app.showModal === 'function') {
            window.app.showModal('taskModal');
        } else {
            document.getElementById('taskModal').style.display = 'block';
        }
    }
}

function viewTaskDetails(taskId) {
    // Check if the function exists in tasks.js
    if (typeof window.viewTaskDetails === 'function') {
        window.viewTaskDetails(taskId);
    } else {
        alert(`View task details for task ID: ${taskId}`);
    }
}

function deleteTaskFromProject(taskId) {
    if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
        let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const taskToDelete = tasks.find(task => task.id === taskId);
        const taskName = taskToDelete ? taskToDelete.name : 'Unknown Task';

        tasks = tasks.filter(task => task.id !== taskId);
        localStorage.setItem('tasks', JSON.stringify(tasks));

        // Show notification
        if (typeof showNotification === 'function') {
            showNotification(`Task "${taskName}" deleted successfully!`, 'success');
        } else {
            // Fallback notification
            alert(`Task "${taskName}" deleted successfully!`);
        }

        // Refresh the current project view
        if (window.currentProjectId && typeof loadCurrentProjectDetails === 'function') {
            loadCurrentProjectDetails(window.currentProjectId);
        }
    }
}

function toggleTaskDropdown(taskId) {
    const dropdownMenu = document.getElementById(`dropdown-menu-${taskId}`);
    if (dropdownMenu) {
        // If dropdown is currently visible, hide it
        if (dropdownMenu.style.display === 'block') {
            dropdownMenu.style.display = 'none';
        } else {
            // Hide all other dropdowns first
            document.querySelectorAll('.task-dropdown-menu').forEach(menu => {
                menu.style.display = 'none';
            });
            // Show this dropdown
            dropdownMenu.style.display = 'block';
        }
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function (e) {
    if (!e.target.closest('.task-dropdown')) {
        document.querySelectorAll('.task-dropdown-menu').forEach(menu => {
            menu.style.display = 'none';
        });
    }
});

// Add these helper functions
function startTask(taskId) {
    updateTaskStatus(taskId, 'in-progress');
}

function completeTask(taskId) {
    updateTaskStatus(taskId, 'completed');
}

function updateTaskStatus(taskId, newStatus) {
    let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const taskIndex = tasks.findIndex(task => task.id === taskId);

    if (taskIndex !== -1) {
        tasks[taskIndex].status = newStatus;
        localStorage.setItem('tasks', JSON.stringify(tasks));

        // Refresh the project view
        if (window.currentProjectId && typeof loadCurrentProjectDetails === 'function') {
            loadCurrentProjectDetails(window.currentProjectId);
        }

        // Show notification
        if (typeof showNotification === 'function') {
            showNotification('Task status updated successfully!', 'success');
        } else {
            // Fallback notification
            alert('Task status updated successfully!');
        }
    }
}

// js/dashboard.js

document.addEventListener('DOMContentLoaded', function () {
    console.log("Dashboard.js DOMContentLoaded executing..."); // Debug log

    // --- Project Form Submission (Handles Add/Edit) ---
    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
        projectForm.addEventListener('submit', function (e) {
            console.log("Project form submit triggered..."); // Debug log
            e.preventDefault();

            // --- Existing logic for saving project ---
            const projectId = document.getElementById('projectId').value;
            const project = {
                id: projectId ? parseInt(projectId) : Date.now(),
                name: document.getElementById('projectName').value,
                description: document.getElementById('projectDescription').value,
                startDate: document.getElementById('startDate').value,
                endDate: document.getElementById('endDate').value,
                status: document.getElementById('projectStatus').value,
                progress: 0 // Or calculate based on tasks if needed elsewhere
            };

            let projects = JSON.parse(localStorage.getItem('projects') || '[]');

            if (projectId) {
                // Update existing project
                const index = projects.findIndex(p => p.id === parseInt(projectId));
                if (index !== -1) {
                    projects[index] = project;
                    console.log(`Project ${projectId} updated.`); // Debug log
                } else {
                    console.warn(`Project with ID ${projectId} not found for update.`);
                }
            } else {
                // Add new project
                projects.push(project);
                console.log(`New project added with ID ${project.id}.`); // Debug log
            }

            localStorage.setItem('projects', JSON.stringify(projects));
            console.log("Projects saved to localStorage."); // Debug log
            // --- End of existing saving logic ---

            // --- Reset form and close modal (existing logic) ---
            this.reset();
            document.getElementById('projectId').value = '';
            document.getElementById('projectModalTitle').textContent = 'Add New Project';
            if (window.app && typeof window.app.hideModal === 'function') {
                window.app.hideModal('projectModal');
                console.log("Project modal hidden via app controller."); // Debug log
            } else {
                document.getElementById('projectModal').style.display = 'none';
                console.log("Project modal hidden via direct style."); // Debug log
            }
            // --- End of reset/close logic ---

            // --- CRITICAL: Refresh ALL relevant views ---
            console.log("Refreshing views..."); // Debug log

            // 1. Refresh dashboard stats (if function exists)
            if (typeof updateStats === 'function') {
                console.log("Calling updateStats()..."); // Debug log
                updateStats(); // Update dashboard stats
            } else {
                console.warn("updateStats function not found.");
            }

            // 2. Refresh project list on the DASHBOARD view (uses #projectsContainer)
            // The loadProjects function in dashboard.js now calls renderProjectList('projectsContainer')
            if (typeof loadProjects === 'function') {
                console.log("Calling loadProjects() for dashboard..."); // Debug log
                loadProjects(); // Refresh project list on the DASHBOARD
            } else {
                console.warn("loadProjects function not found.");
            }

            // 3. ALSO refresh the project list on the MAIN PROJECTS PAGE (uses #projectsListContainer)
            // This calls the loadProjectsList function in projects.js, which now calls renderProjectList('projectsListContainer')
            if (typeof loadProjectsList === 'function') {
                console.log("Calling loadProjectsList() for projects page..."); // Debug log
                loadProjectsList(); // Refresh project list on the PROJECTS PAGE
            } else {
                console.warn("loadProjectsList function not found. Make sure projects.js is loaded correctly.");
            }
            console.log("View refresh attempts completed."); // Debug log
            // --- END OF CRITICAL REFRESH ---
        });
    } else {
        console.warn("Project form element (#projectForm) not found in dashboard.js DOMContentLoaded.");
    }

    // --- Cancel Project Button ---
    const cancelProjectBtn = document.getElementById('cancelProject');
    if (cancelProjectBtn) {
        cancelProjectBtn.addEventListener('click', function () {
            console.log("Cancel project button clicked."); // Debug log
            const form = document.getElementById('projectForm');
            if (form) form.reset();
            document.getElementById('projectId').value = '';
            document.getElementById('projectModalTitle').textContent = 'Add New Project';
            // Use app controller if available, otherwise fallback
            if (window.app && typeof window.app.hideModal === 'function') {
                window.app.hideModal('projectModal');
            } else {
                document.getElementById('projectModal').style.display = 'none';
            }
        });
    } else {
        console.warn("Cancel project button (#cancelProject) not found.");
    }

    // --- Add Project Button on Dashboard ---
    const addProjectBtn = document.getElementById('addProjectBtn');
    if (addProjectBtn) {
        addProjectBtn.addEventListener('click', function () {
            console.log("Add project button (dashboard) clicked."); // Debug log
            // Ensure modal title and form are reset for a new project
            document.getElementById('projectModalTitle').textContent = 'Add New Project';
            const form = document.getElementById('projectForm');
            if (form) {
                form.reset();
            }
            document.getElementById('projectId').value = ''; // Clear ID for new project

            // Show the modal using the app controller
            if (window.app && typeof window.app.showModal === 'function') {
                window.app.showModal('projectModal');
                console.log("Project modal shown via app controller.");
            } else {
                // Fallback if app.showModal is not available
                const modal = document.getElementById('projectModal');
                if (modal) {
                    modal.style.display = 'block';
                    console.log("Project modal shown via direct style.");
                } else {
                    console.error("Project modal element (#projectModal) not found.");
                }
            }
        });
    } else {
        console.warn("Add project button (#addProjectBtn) not found on dashboard.");
    }

    // --- You might have other DOMContentLoaded logic for dashboard here ---
    // e.g., loading initial dashboard data if not handled by loadDashboard()
    // --- End of other potential logic ---
});

// The incorrect loadProjectsList function has been removed from this file.
// The correct version is now in js/projects.js and will be used instead.