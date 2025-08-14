// Add the formatDate function here at the top:
function formatDate(dateString) {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
// Task Management Module
function loadTasks() {
    loadTaskFilters();
    loadTaskList();
}

function loadTaskFilters() {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const projectFilter = document.getElementById('projectFilter');

    // Clear existing options
    projectFilter.innerHTML = '<option value="">All Projects</option>';

    // Add project options
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        projectFilter.appendChild(option);
    });
}
// Add these new functions to js/tasks.js

function toggleTaskDropdown(taskId) {
    const dropdown = document.getElementById(`dropdown-${taskId}`);
    const isOpen = dropdown.classList.contains('show');

    // Close all other dropdowns
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.remove('show');
    });

    // Toggle current dropdown
    if (!isOpen) {
        dropdown.classList.add('show');
    }

    // Close dropdown when clicking outside
    if (!isOpen) {
        setTimeout(() => {
            document.addEventListener('click', function closeDropdown(e) {
                if (!e.target.closest(`#task-${taskId}`)) {
                    dropdown.classList.remove('show');
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }, 10);
    }
}

function updateTaskStatus(taskId, newStatus) {
    let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const taskIndex = tasks.findIndex(task => task.id === taskId);

    if (taskIndex !== -1) {
        tasks[taskIndex].status = newStatus;
        localStorage.setItem('tasks', JSON.stringify(tasks));
        loadTaskList();

        // Show confirmation
        showNotification(`Task status updated to ${newStatus.replace('-', ' ')}`, 'success');
    }
}

function viewTaskDetails(taskId) {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const task = tasks.find(t => t.id === taskId);
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const team = JSON.parse(localStorage.getItem('team') || '[]');

    if (!task) {
        console.error('Task not found:', taskId);
        return;
    }

    const project = projects.find(p => p.id === task.projectId);
    const assignee = team.find(m => m.id === task.assignee);

    // Create a more professional layout
    let detailsHTML = `
        <div class="task-details-container">
            <!-- Header Section -->
            <div class="task-detail-header">
                <div class="task-detail-title">
                    <h3>${task.name}</h3>
                    <span class="task-priority priority-${task.priority}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
                    <span class="task-status status-${task.status.replace(' ', '-')}">${task.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                </div>
                <p class="task-detail-description">${task.description || 'No description provided'}</p>
            </div>

            <!-- Main Details Grid -->
            <div class="task-details-grid">
                <div class="detail-card">
                    <div class="detail-card-header">
                        <i class="fas fa-project-diagram"></i>
                        <h4>Project Information</h4>
                    </div>
                    <div class="detail-card-body">
                        <div class="detail-item">
                            <span class="detail-label">Project Name</span>
                            <span class="detail-value">${project ? project.name : 'No project assigned'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Project Status</span>
                            <span class="detail-value">${project ? project.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-card">
                    <div class="detail-card-header">
                        <i class="far fa-calendar"></i>
                        <h4>Timeline</h4>
                    </div>
                    <div class="detail-card-body">
                        <div class="detail-item">
                            <span class="detail-label">Due Date</span>
                            <span class="detail-value">${formatDate(task.dueDate)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Created</span>
                            <span class="detail-value">${task.createdAt ? formatDate(task.createdAt) : 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-card">
                    <div class="detail-card-header">
                        <i class="fas fa-user"></i>
                        <h4>Assignment</h4>
                    </div>
                    <div class="detail-card-body">
    `;

    if (assignee) {
        detailsHTML += `
                        <div class="detail-item">
                            <span class="detail-label">Assignee</span>
                            <span class="detail-value">${assignee.name}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Role</span>
                            <span class="detail-value">${getRoleText(assignee.role)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Contact</span>
                            <span class="detail-value">${assignee.email}</span>
                        </div>
        `;
    } else {
        detailsHTML += `
                        <div class="detail-item">
                            <span class="detail-label">Assignee</span>
                            <span class="detail-value">Unassigned</span>
                        </div>
        `;
    }

    detailsHTML += `
                    </div>
                </div>

                <div class="detail-card">
                    <div class="detail-card-header">
                        <i class="fas fa-tasks"></i>
                        <h4>Task Properties</h4>
                    </div>
                    <div class="detail-card-body">
                        <div class="detail-item">
                            <span class="detail-label">Priority</span>
                            <span class="detail-value">
                                <span class="task-priority priority-${task.priority}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Status</span>
                            <span class="detail-value">
                                <span class="task-status status-${task.status.replace(' ', '-')}">${task.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Task ID</span>
                            <span class="detail-value">#${task.id}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="task-detail-actions">
                <button class="btn btn-outline" onclick="editTask(${task.id})">
                    <i class="fas fa-edit"></i> Edit Task
                </button>
                <button class="btn btn-primary" onclick="updateTaskStatus(${task.id}, 'in-progress')">
                    <i class="fas fa-play"></i> Start Task
                </button>
                <button class="btn btn-success" onclick="updateTaskStatus(${task.id}, 'completed')">
                    <i class="fas fa-check"></i> Complete Task
                </button>
            </div>
        </div>
    `;

    // Populate modal content
    document.getElementById('taskDetailsBody').innerHTML = detailsHTML;
    document.getElementById('taskDetailsTitle').textContent = 'Task Details';

    // Show the modal
    if (window.app && typeof window.app.showModal === 'function') {
        window.app.showModal('taskDetailsModal');
    } else {
        document.getElementById('taskDetailsModal').style.display = 'block';
    }
}

function assignTask(taskId) {
    // This would open an assignment modal in a full implementation
    alert(`Assign task ${taskId} - This would open assignment interface`);
}

function addTaskComment(taskId) {
    // This would open a comment modal in a full implementation
    alert(`Add comment to task ${taskId} - This would open comment interface`);
}

function showNotification(message, type = 'info') {
    // Simple notification system
    console.log(`[${type.toUpperCase()}] ${message}`);
}
// Enhanced notification function
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}
function loadTaskList() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const team = JSON.parse(localStorage.getItem('team') || '[]');
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');

    const projectFilter = document.getElementById('projectFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const searchFilter = document.getElementById('searchTasks').value.toLowerCase();

    // Apply filters
    let filteredTasks = tasks.filter(task => {
        // Project filter
        if (projectFilter && task.projectId != projectFilter) return false;

        // Status filter
        if (statusFilter && task.status !== statusFilter) return false;

        // Search filter
        if (searchFilter) {
            const taskName = task.name.toLowerCase();
            const taskDesc = task.description.toLowerCase();
            return taskName.includes(searchFilter) || taskDesc.includes(searchFilter);
        }

        return true;
    });

    const container = document.getElementById('tasksContainer');

    if (filteredTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <h3>No Tasks Found</h3>
                <p>Try adjusting your filters or create a new task.</p>
                <button class="btn btn-primary" onclick="app.showModal('taskModal')">
                    <i class="fas fa-plus"></i> Create Task
                </button>
            </div>
        `;
        return;
    }

    // Update the task card generation in loadTaskList function
    container.innerHTML = filteredTasks.map(task => {
        const project = projects.find(p => p.id === task.projectId);
        const assignee = team.find(m => m.id === task.assignee);
        const priorityClass = `priority-${task.priority}`;
        const priorityText = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
        const statusClass = `status-${task.status.replace(' ', '-')}`;
        const statusText = task.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

        // Get dependency task names
        let dependencyInfo = '';
        if (task.dependencies && task.dependencies.length > 0) {
            const dependencyTasks = tasks.filter(t => task.dependencies.includes(t.id));
            const dependencyNames = dependencyTasks.map(t => t.name);
            dependencyInfo = `
            <div class="task-dependencies">
                <strong>Depends on:</strong> ${dependencyNames.join(', ')}
            </div>
        `;
        }

        return `
        <div class="task-card ${task.priority}" id="task-${task.id}">
            <div class="task-header">
                <h3 class="task-title">${task.name}</h3>
                <span class="task-priority ${priorityClass}">${priorityText}</span>
            </div>
            <p class="task-description">${task.description}</p>
            ${dependencyInfo}
            <div class="task-meta">
                <span><i class="fas fa-project-diagram"></i> ${project ? project.name : 'Unknown Project'}</span>
                <span><i class="far fa-calendar"></i> Due: ${formatDate(task.dueDate)}</span>
                ${assignee ? `<span><i class="fas fa-user"></i> ${assignee.name}</span>` : ''}
            </div>
            <div class="task-footer">
                <span class="task-status ${statusClass}">${statusText}</span>
                <div class="task-actions">
                    <div class="dropdown">
                        <button class="btn btn-outline btn-sm dropdown-toggle" onclick="toggleTaskDropdown(${task.id})">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div class="dropdown-menu" id="dropdown-${task.id}">
                            <a href="#" onclick="viewTaskDetails(${task.id})"><i class="fas fa-eye"></i> View Details</a>
                            <a href="#" onclick="editTask(${task.id})"><i class="fas fa-edit"></i> Edit Task</a>
                            <a href="#" onclick="updateTaskStatus(${task.id}, 'in-progress')"><i class="fas fa-play"></i> Start Task</a>
                            <a href="#" onclick="updateTaskStatus(${task.id}, 'completed')"><i class="fas fa-check"></i> Mark Complete</a>
                            <a href="#" onclick="assignTask(${task.id})"><i class="fas fa-user-plus"></i> Assign</a>
                            <a href="#" onclick="addTaskComment(${task.id})"><i class="fas fa-comment"></i> Add Comment</a>
                            <a href="#" onclick="deleteTask(${task.id})" class="danger"><i class="fas fa-trash"></i> Delete</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

// Updated editTask function
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

        // Populate dropdowns
        populateProjectDropdown();
        populateAssigneeDropdown();
        safelyPopulateDependencies(taskId);

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
        app.showModal('taskModal');
    }
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        tasks = tasks.filter(task => task.id !== taskId);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        loadTaskList();
    }
}

// Update populateProjectDropdown function
function populateProjectDropdown() {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const select = document.getElementById('taskProject');

    // Clear existing options except the first one
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }

    // Add project options
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        select.appendChild(option);
    });
}

// Update populateAssigneeDropdown function
function populateAssigneeDropdown() {
    const team = JSON.parse(localStorage.getItem('team') || '[]');
    const select = document.getElementById('taskAssignee');

    // Clear existing options except the first one
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }

    // Add team member options
    team.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = member.name;
        select.appendChild(option);
    });
}

// Update the populateDependenciesDropdown function
function populateDependenciesDropdown(currentTaskId = null) {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const select = document.getElementById('taskDependencies');

    // Clear existing options
    select.innerHTML = '<option value="">No dependencies</option>';

    // Add task options (exclude current task to prevent self-dependency)
    tasks.forEach(task => {
        // If editing a task, exclude the current task from dependencies
        if (currentTaskId && task.id === currentTaskId) return;

        const option = document.createElement('option');
        option.value = task.id;
        option.textContent = `${task.name} (#${task.id})`;
        select.appendChild(option);
    });
}

// Update the task form submit event listener with better error handling
document.getElementById('taskForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const taskId = document.getElementById('taskId').value;
    const dependenciesSelect = document.getElementById('taskDependencies');

    // Get selected dependencies safely
    let selectedDependencies = [];
    if (dependenciesSelect) {
        selectedDependencies = Array.from(dependenciesSelect.selectedOptions || [])
            .map(option => parseInt(option.value))
            .filter(value => !isNaN(value) && value !== ''); // Filter out invalid values
    }

    const task = {
        id: taskId ? parseInt(taskId) : Date.now(),
        projectId: parseInt(document.getElementById('taskProject').value),
        name: document.getElementById('taskName').value,
        description: document.getElementById('taskDescription').value,
        dueDate: document.getElementById('taskDueDate').value,
        priority: document.getElementById('taskPriority').value,
        status: taskId ? document.getElementById('taskStatus')?.value || 'pending' : 'pending',
        assignee: document.getElementById('taskAssignee').value ? parseInt(document.getElementById('taskAssignee').value) : null,
        dependencies: selectedDependencies
    };

    let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

    if (taskId) {
        // Update existing task
        const index = tasks.findIndex(t => t.id === parseInt(taskId));
        if (index !== -1) {
            tasks[index] = task;
        }
    } else {
        // Add new task
        tasks.push(task);
    }

    localStorage.setItem('tasks', JSON.stringify(tasks));

    // Reset form and close modal
    this.reset();
    document.getElementById('taskId').value = '';
    document.getElementById('taskModalTitle').textContent = 'Add New Task';
    app.hideModal('taskModal');

    // Refresh task list
    if (typeof loadTaskList === 'function') {
        loadTaskList();
    }
});

document.getElementById('cancelTask').addEventListener('click', function () {
    document.getElementById('taskForm').reset();
    document.getElementById('taskId').value = '';
    document.getElementById('taskModalTitle').textContent = 'Add New Task';
    app.hideModal('taskModal');
});

// Updated add task button handler
document.getElementById('addTaskBtn').addEventListener('click', function () {
    // Reset the form
    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.reset();
    }

    document.getElementById('taskId').value = '';
    document.getElementById('taskModalTitle').textContent = 'Add New Task';

    // Populate dropdowns
    populateProjectDropdown();
    populateAssigneeDropdown();
    safelyPopulateDependencies(); // No current task ID for new tasks

    app.showModal('taskModal');
});
// Add event listeners for closing the task details modal
document.addEventListener('DOMContentLoaded', function () {
    const closeButtons = document.querySelectorAll('#closeTaskDetails, #closeTaskDetailsBtn');
    closeButtons.forEach(button => {
        button.addEventListener('click', function () {
            if (window.app && typeof window.app.hideModal === 'function') {
                window.app.hideModal('taskDetailsModal');
            } else {
                document.getElementById('taskDetailsModal').style.display = 'none';
            }
        });
    });


    // Close modal when clicking outside
    const modal = document.getElementById('taskDetailsModal');
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                if (window.app && typeof window.app.hideModal === 'function') {
                    window.app.hideModal('taskDetailsModal');
                } else {
                    modal.style.display = 'none';
                }
            }
        });
    }
});
// Add this helper function to safely populate the dependencies dropdown
function safelyPopulateDependencies(currentTaskId = null) {
    const dependenciesSelect = document.getElementById('taskDependencies');
    if (!dependenciesSelect) {
        console.warn('Dependencies dropdown not found');
        return;
    }

    populateDependenciesDropdown(currentTaskId);
}
// Add this helper function to check if dependencies are met
function areTaskDependenciesMet(taskId) {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const task = tasks.find(t => t.id === taskId);

    if (!task || !task.dependencies || task.dependencies.length === 0) {
        return true; // No dependencies to check
    }

    // Check if all dependency tasks are completed
    const dependencyTasks = tasks.filter(t => task.dependencies.includes(t.id));
    return dependencyTasks.every(t => t.status === 'completed');
}

// Add this function to update task status with dependency checking
function updateTaskStatus(taskId, newStatus) {
    let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const taskIndex = tasks.findIndex(task => task.id === taskId);

    if (taskIndex !== -1) {
        // If trying to start or complete a task, check dependencies
        if ((newStatus === 'in-progress' || newStatus === 'completed') &&
            !areTaskDependenciesMet(taskId)) {
            alert('Cannot start this task. Please complete all dependent tasks first.');
            return;
        }

        tasks[taskIndex].status = newStatus;
        localStorage.setItem('tasks', JSON.stringify(tasks));
        loadTaskList();

        // Show notification
        showNotification(`Task status updated to ${newStatus.replace('-', ' ')}`, 'success');
    }
}
// Add this helper function if it doesn't exist
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
// Filter event listeners
document.getElementById('projectFilter').addEventListener('change', loadTaskList);
document.getElementById('statusFilter').addEventListener('change', loadTaskList);
document.getElementById('searchTasks').addEventListener('input', loadTaskList);