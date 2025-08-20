// Task Management Module

function loadTasks() {
    loadTaskFilters();
    loadTaskList();
}

function loadTaskFilters() {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const projectFilter = document.getElementById('projectFilter');

    // Clear existing options
    if (projectFilter) {
        projectFilter.innerHTML = '<option value="">All Projects</option>';

        // Add project options
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectFilter.appendChild(option);
        });
    }
}

// Dropdown functionality for tasks
function toggleTaskPageDropdown(taskId) {
    const currentDropdown = document.getElementById(`dropdown-${taskId}`);
    if (!currentDropdown) return;

    const isCurrentlyOpen = currentDropdown.classList.contains('show');

    // Close all dropdowns
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        menu.classList.remove('show');
    });

    // If the clicked dropdown was not open, open it
    if (!isCurrentlyOpen) {
        currentDropdown.classList.add('show');
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function (e) {
    const isClickInsideDropdown = e.target.closest('.dropdown');
    const isClickOnMenuItem = e.target.closest('.dropdown-menu a');

    if (!isClickInsideDropdown || isClickOnMenuItem) {
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
            menu.classList.remove('show');
        });
    }
});

// Task action functions
function viewTaskDetails(taskId) {
    // Implementation depends on your needs
    console.log(`View task details for task ID: ${taskId}`);
    // You can replace this with your actual view task details function
    alert(`View task details for task ID: ${taskId}`);
}

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
        populateDependenciesDropdown(taskId);

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
        populateProjectDropdown();
        populateAssigneeDropdown();

        if (window.app && typeof window.app.showModal === 'function') {
            window.app.showModal('taskModal');
        } else {
            document.getElementById('taskModal').style.display = 'block';
        }
    }
}

function startTask(taskId) {
    updateTaskStatus(taskId, 'in-progress');
}

function completeTask(taskId) {
    updateTaskStatus(taskId, 'completed');
}

function assignTask(taskId) {
    // Implementation depends on your needs
    console.log(`Assign task ${taskId}`);
    alert(`Assign task ${taskId}`);
}

function addTaskComment(taskId) {
    // Implementation depends on your needs
    console.log(`Add comment to task ${taskId}`);
    alert(`Add comment to task ${taskId}`);
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        tasks = tasks.filter(task => task.id !== taskId);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        loadTaskList();

        // Show notification
        if (typeof showNotification === 'function') {
            showNotification('Task deleted successfully!', 'success');
        }
    }
}

function updateTaskStatus(taskId, newStatus) {
    let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const taskIndex = tasks.findIndex(task => task.id === taskId);

    if (taskIndex !== -1) {
        tasks[taskIndex].status = newStatus;
        localStorage.setItem('tasks', JSON.stringify(tasks));
        loadTaskList();

        // Show notification
        if (typeof showNotification === 'function') {
            showNotification(`Task status updated to ${newStatus.replace('-', ' ')}`, 'success');
        }
    }
}

// js/tasks.js

function loadTaskList() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const team = JSON.parse(localStorage.getItem('team') || '[]');
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');

    const projectFilter = document.getElementById('projectFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const searchFilter = document.getElementById('searchTasks')?.value.toLowerCase() || '';

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

    // --- Generate task rows HTML ---
    let taskRows = '';
    filteredTasks.forEach(task => {
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

        taskRows += `
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
                    <button class="btn btn-outline btn-sm" onclick="editTask(${task.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <div class="dropdown">
                        <button class="btn btn-outline btn-sm dropdown-toggle" data-task-id="${task.id}">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div class="dropdown-menu" id="dropdown-${task.id}">
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
            </div>
        </div>
    `;
    });
    // --- End of task rows generation ---

    // --- Update container.innerHTML to include the table structure with sorting ---
    container.innerHTML = `
        <div class="table-responsive">
            <!-- Give the table a specific ID for sorting -->
            <table class="tasks-table" id="mainTasksTable">
                <thead>
                    <tr>
                        <!-- Add 'sortable' class to headers you want to sort -->
                        <th class="sortable">Task Name</th>
                        <th class="sortable">Priority</th>
                        <th class="sortable">Status</th>
                        <th class="sortable">Due Date</th>
                        <th class="sortable">Assignee</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredTasks.map(task => {
        const project = projects.find(p => p.id === task.projectId);
        const assignee = team.find(m => m.id === task.assignee);
        const priorityClass = `priority-${task.priority}`;
        const priorityText = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
        const statusClass = `status-${task.status.replace(' ', '-')}`;
        const statusText = task.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

        // For sorting, we can add data-sort attributes if needed for more complex sorting
        // e.g., use timestamp for date sorting, numeric ID for priority/status if mapped
        // For now, text content sorting is sufficient for most columns.
        // Due Date sorting example (using ISO date string for accurate sorting):
        const isoDueDate = task.dueDate || '9999-99-99'; // Put empty dates last

        return `
                        <tr>
                            <td class="task-name-cell">${task.name}</td>
                            <td class="priority-cell" data-sort="${task.priority}"><span class="task-priority ${priorityClass}">${priorityText}</span></td>
                            <td class="status-cell" data-sort="${task.status}"><span class="task-status ${statusClass}">${statusText}</span></td>
                            <td class="date-cell" data-sort="${isoDueDate}">${formatDate(task.dueDate)}</td>
                            <td>${assignee ? assignee.name : 'Unassigned'}</td>
                            <td class="task-actions-cell">
                                <div class="task-action-buttons">
                                    <button class="btn btn-outline btn-sm" onclick="editTask(${task.id})">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <div class="dropdown">
                                        <button class="btn btn-outline btn-sm dropdown-toggle" data-task-id="${task.id}">
                                            <i class="fas fa-ellipsis-v"></i>
                                        </button>
                                        <div class="dropdown-menu" id="dropdown-${task.id}">
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
    `;
    // --- End of updated container.innerHTML ---

    // --- Add this code block immediately AFTER the container.innerHTML = `...`; line ---
    // This makes the table we just created sortable
    if (typeof makeTableSortable === 'function') {
        // Use the ID we assigned to the table
        makeTableSortable('mainTasksTable');
        console.log("Main tasks table (#mainTasksTable) made sortable.");
    } else {
        console.warn("makeTableSortable function not found. Table sorting might not work. Check if utils.js is loaded correctly.");
    }
    // --- End of addition ---
}
// Helper functions
function populateProjectDropdown() {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const select = document.getElementById('taskProject');

    if (!select) return;

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

function populateAssigneeDropdown() {
    const team = JSON.parse(localStorage.getItem('team') || '[]');
    const select = document.getElementById('taskAssignee');

    if (!select) return;

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

function populateDependenciesDropdown(currentTaskId = null) {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const select = document.getElementById('taskDependencies');

    if (!select) return;

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

// Enhanced notification function
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function () {
    // Task form submission
    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', function (e) {
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

            // Get project ID - either from the form or from current project context
            let projectId = parseInt(document.getElementById('taskProject').value);

            // If project dropdown was disabled, get project ID from current context
            const projectSelect = document.getElementById('taskProject');
            if (projectSelect && projectSelect.disabled && window.currentProjectId) {
                projectId = window.currentProjectId;
            }

            const task = {
                id: taskId ? parseInt(taskId) : Date.now(),
                projectId: projectId,
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

            // Re-enable project dropdown if it was disabled
            if (projectSelect && projectSelect.disabled) {
                projectSelect.disabled = false;
            }

            if (window.app && typeof window.app.hideModal === 'function') {
                window.app.hideModal('taskModal');
            } else {
                document.getElementById('taskModal').style.display = 'none';
            }

            // Auto-refresh the current view
            setTimeout(() => {
                refreshCurrentView();
            }, 100); // Small delay to ensure modal is closed

            // Show success notification
            if (typeof showNotification === 'function') {
                showNotification(`Task "${task.name}" saved successfully!`, 'success');
            }
        });
    }

    // Cancel task button
    const cancelTaskBtn = document.getElementById('cancelTask');
    if (cancelTaskBtn) {
        cancelTaskBtn.addEventListener('click', function () {
            const taskForm = document.getElementById('taskForm');
            if (taskForm) {
                taskForm.reset();
            }
            document.getElementById('taskId').value = '';
            document.getElementById('taskModalTitle').textContent = 'Add New Task';

            // Re-enable project dropdown if it was disabled
            const projectSelect = document.getElementById('taskProject');
            if (projectSelect && projectSelect.disabled) {
                projectSelect.disabled = false;
            }

            if (window.app && typeof window.app.hideModal === 'function') {
                window.app.hideModal('taskModal');
            } else {
                document.getElementById('taskModal').style.display = 'none';
            }
        });
    }

    // Add task button
    const addTaskBtn = document.getElementById('addTaskBtn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', function () {
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
            populateDependenciesDropdown(); // No current task ID for new tasks

            if (window.app && typeof window.app.showModal === 'function') {
                window.app.showModal('taskModal');
            } else {
                document.getElementById('taskModal').style.display = 'block';
            }
        });
    }

    // Filter event listeners
    const projectFilter = document.getElementById('projectFilter');
    const statusFilter = document.getElementById('statusFilter');
    const searchTasks = document.getElementById('searchTasks');

    if (projectFilter) projectFilter.addEventListener('change', loadTaskList);
    if (statusFilter) statusFilter.addEventListener('change', loadTaskList);
    if (searchTasks) searchTasks.addEventListener('input', loadTaskList);

    // Event delegation for task dropdowns
    const tasksContainer = document.getElementById('tasksContainer');
    if (tasksContainer) {
        tasksContainer.addEventListener('click', function (e) {
            const toggleButton = e.target.closest('.dropdown-toggle');
            if (toggleButton && toggleButton.dataset.taskId) {
                toggleTaskPageDropdown(parseInt(toggleButton.dataset.taskId, 10));
            }
        });
    }
});

// Add this new function to handle view refresh
function refreshCurrentView() {
    // If we're on project details page, refresh the project details
    if (window.currentProjectId && typeof loadCurrentProjectDetails === 'function') {
        loadCurrentProjectDetails(window.currentProjectId);
    }
    // If we're on the main tasks page, refresh the task list
    else if (typeof loadTaskList === 'function' && document.getElementById('tasks')?.classList.contains('active')) {
        loadTaskList();
    }
    // If we're on dashboard, update stats
    else if (typeof updateStats === 'function' && document.getElementById('dashboard')?.classList.contains('active')) {
        updateStats();
    }
}