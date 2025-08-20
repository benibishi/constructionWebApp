// js/tasks.js - Task Management Module

// --- Utility function for date formatting (if not in utils.js) ---
function formatDate(dateString) {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// --- Utility function for HTML escaping (if not in utils.js) ---
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "<")
        .replace(/>/g, ">")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// --- Selection State ---
let selectedTaskIds = new Set(); // Use a Set for efficient lookups

// --- Main Load Function ---
function loadTasks() {
    loadTaskFilters();
    loadTaskList();
}

// --- Filter Loading ---
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

// --- Dropdown functionality for tasks ---
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

// --- Task action functions ---
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

// --- Main Task List Loading and Rendering ---
function loadTaskList() {
    console.log("Tasks.js: loadTaskList called (full refresh).");
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const team = JSON.parse(localStorage.getItem('team') || '[]');
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');

    const projectFilter = document.getElementById('projectFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const searchFilter = document.getElementById('searchTasks')?.value.toLowerCase().trim() || '';

    console.log("Tasks.js (loadTaskList): Applying filters - Project:", projectFilter, "Status:", statusFilter, "Search:", searchFilter);

    // Apply filters
    let filteredTasks = tasks.filter(task => {
        if (projectFilter && task.projectId != projectFilter) return false;
        if (statusFilter && task.status !== statusFilter) return false;
        if (searchFilter) {
            const taskName = task.name.toLowerCase();
            const taskDesc = (task.description || '').toLowerCase();
            return taskName.includes(searchFilter) || taskDesc.includes(searchFilter);
        }
        return true;
    });

    const container = document.getElementById('tasksContainer');
    const bulkActionsBar = document.getElementById('bulkActionsBar');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const selectedCount = document.getElementById('selectedCount');

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
        // Hide bulk actions bar if no tasks
        if (bulkActionsBar) {
            bulkActionsBar.style.display = 'none';
            selectedTaskIds.clear(); // Clear selection
        }
        return;
    }

    // --- Modify the HTML generation to include checkboxes ---
    container.innerHTML = filteredTasks.map(task => {
        const project = projects.find(p => p.id === task.projectId);
        const assignee = team.find(m => m.id === task.assignee);
        const priorityClass = `priority-${task.priority}`;
        const priorityText = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
        const statusClass = `status-${task.status.replace(' ', '-')}`;
        const statusText = task.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

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

        // Determine if this task is currently selected
        const isSelected = selectedTaskIds.has(task.id);

        return `
        <div class="task-card ${task.priority}" id="task-${task.id}" style="position: relative; padding-top: 2rem;"> <!-- Add padding for checkbox -->
            <!-- Checkbox for selection -->
            <div style="position: absolute; top: 0.5rem; left: 0.5rem;">
                <input type="checkbox" class="task-checkbox" data-task-id="${task.id}" id="select-task-${task.id}" ${isSelected ? 'checked' : ''}>
            </div>
            <div class="task-header">
                <h3 class="task-title">${escapeHtml(task.name)}</h3>
                <span class="task-priority ${priorityClass}">${priorityText}</span>
            </div>
            <p class="task-description">${escapeHtml(task.description || '')}</p>
            ${dependencyInfo}
            <div class="task-meta">
                <span><i class="fas fa-project-diagram"></i> ${project ? escapeHtml(project.name) : 'Unknown Project'}</span>
                <span><i class="far fa-calendar"></i> Due: ${formatDate(task.dueDate)}</span>
                ${assignee ? `<span><i class="fas fa-user"></i> ${escapeHtml(assignee.name)}</span>` : ''}
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
    }).join('');
    // --- End of HTML generation modification ---

    // --- Add Selection and Bulk Action Logic AFTER rendering ---
    // Re-attach event listeners for checkboxes, select all, and bulk buttons
    // as they are recreated on every loadTaskList call.

    // 1. Select All Checkbox Logic
    if (selectAllCheckbox) {
        // Update "Select All" checkbox state based on current selections
        updateSelectAllCheckboxState();

        selectAllCheckbox.removeEventListener('change', handleSelectAllChange); // Remove old listener
        selectAllCheckbox.addEventListener('change', handleSelectAllChange);
    }

    // 2. Individual Task Checkbox Logic
    const taskCheckboxes = container.querySelectorAll('.task-checkbox');
    taskCheckboxes.forEach(checkbox => {
        const taskId = parseInt(checkbox.dataset.taskId);
        // Ensure checkbox state matches selection state (important after re-render)
        checkbox.checked = selectedTaskIds.has(taskId);

        checkbox.removeEventListener('change', handleTaskCheckboxChange); // Remove old listener
        checkbox.addEventListener('change', handleTaskCheckboxChange);
    });

    // 3. Bulk Action Button Logic
    const bulkMarkCompleteBtn = document.getElementById('bulkMarkCompleteBtn');
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');

    if (bulkMarkCompleteBtn) {
        bulkMarkCompleteBtn.removeEventListener('click', handleBulkMarkComplete);
        bulkMarkCompleteBtn.addEventListener('click', handleBulkMarkComplete);
    }
    if (bulkDeleteBtn) {
        bulkDeleteBtn.removeEventListener('click', handleBulkDelete);
        bulkDeleteBtn.addEventListener('click', handleBulkDelete);
    }

    // 4. Update selected count display
    updateSelectedCountDisplay();

    // 5. Show/Hide bulk actions bar based on selections
    updateBulkActionBarVisibility();
    // --- End of Selection and Bulk Action Logic ---
}


// --- Helper functions for Dropdowns ---
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

// --- Enhanced notification function ---
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

// --- Selection and Bulk Action Helper Functions ---

// Helper to update the "Select All" checkbox state
function updateSelectAllCheckboxState() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const allTaskCheckboxes = document.querySelectorAll('#tasksContainer .task-checkbox');
    const totalVisibleTasks = allTaskCheckboxes.length;
    const totalSelectedVisibleTasks = Array.from(allTaskCheckboxes).filter(cb => cb.checked).length;

    if (selectAllCheckbox) {
        if (totalVisibleTasks > 0 && totalSelectedVisibleTasks === totalVisibleTasks) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else if (totalSelectedVisibleTasks > 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true; // Partially selected
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }
    }
}

// Helper to update the selected count display
function updateSelectedCountDisplay() {
    const selectedCount = document.getElementById('selectedCount');
    if (selectedCount) {
        const count = selectedTaskIds.size;
        selectedCount.textContent = count > 0 ? `${count} selected` : '';
    }
}

// Helper to show/hide the bulk action bar
function updateBulkActionBarVisibility() {
    const bulkActionsBar = document.getElementById('bulkActionsBar');
    if (bulkActionsBar) {
        if (selectedTaskIds.size > 0) {
            bulkActionsBar.style.display = 'block'; // Or add 'show' class if using CSS
        } else {
            bulkActionsBar.style.display = 'none'; // Or remove 'show' class
        }
    }
}

// Event handler for "Select All" checkbox
function handleSelectAllChange(event) {
    const isChecked = event.target.checked;
    const taskCheckboxes = document.querySelectorAll('#tasksContainer .task-checkbox');

    taskCheckboxes.forEach(checkbox => {
        const taskId = parseInt(checkbox.dataset.taskId);
        checkbox.checked = isChecked;
        if (isChecked) {
            selectedTaskIds.add(taskId);
        } else {
            selectedTaskIds.delete(taskId);
        }
    });

    updateSelectedCountDisplay();
    updateBulkActionBarVisibility();
    // No need to update selectAll state here as it triggered the change
}

// Event handler for individual task checkboxes
function handleTaskCheckboxChange(event) {
    const checkbox = event.target;
    const taskId = parseInt(checkbox.dataset.taskId);
    const isChecked = checkbox.checked;

    if (isChecked) {
        selectedTaskIds.add(taskId);
    } else {
        selectedTaskIds.delete(taskId);
    }

    updateSelectAllCheckboxState(); // Update "Select All" based on individual changes
    updateSelectedCountDisplay();
    updateBulkActionBarVisibility();
}

// Event handler for Bulk Mark Complete
function handleBulkMarkComplete() {
    if (selectedTaskIds.size === 0) {
        alert("Please select at least one task to mark complete.");
        return;
    }

    if (!confirm(`Are you sure you want to mark ${selectedTaskIds.size} task(s) as completed?`)) {
        return;
    }

    try {
        let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        let updatedCount = 0;

        tasks = tasks.map(task => {
            if (selectedTaskIds.has(task.id)) {
                if (task.status !== 'completed') {
                    task.status = 'completed';
                    updatedCount++;
                }
            }
            return task;
        });

        localStorage.setItem('tasks', JSON.stringify(tasks));
        console.log(`Bulk Mark Complete: Updated ${updatedCount} tasks.`);

        // Clear selections
        selectedTaskIds.clear();

        // Refresh the task list
        loadTaskList();

        // Show notification (if you have a showNotification function)
        if (typeof showNotification === 'function') {
            showNotification(`${updatedCount} task(s) marked as completed.`, 'success');
        } else {
            alert(`${updatedCount} task(s) marked as completed.`);
        }

    } catch (error) {
        console.error("Error during bulk mark complete:", error);
        alert("An error occurred while marking tasks complete.");
    }
}

// Event handler for Bulk Delete
function handleBulkDelete() {
    if (selectedTaskIds.size === 0) {
        alert("Please select at least one task to delete.");
        return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedTaskIds.size} task(s)? This action cannot be undone.`)) {
        return;
    }

    try {
        let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const initialCount = tasks.length;
        // Filter out tasks whose IDs are in the selectedTaskIds set
        tasks = tasks.filter(task => !selectedTaskIds.has(task.id));
        const deletedCount = initialCount - tasks.length;

        localStorage.setItem('tasks', JSON.stringify(tasks));
        console.log(`Bulk Delete: Removed ${deletedCount} tasks.`);

        // Clear selections
        selectedTaskIds.clear();

        // Refresh the task list
        loadTaskList();

        // Show notification
        if (typeof showNotification === 'function') {
            showNotification(`${deletedCount} task(s) deleted.`, 'success');
        } else {
            alert(`${deletedCount} task(s) deleted.`);
        }

    } catch (error) {
        console.error("Error during bulk delete:", error);
        alert("An error occurred while deleting tasks.");
    }
}
// --- End of Selection and Bulk Action Helper Functions ---

// --- Debounce Utility (if not in utils.js) ---
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        // Clear the previous timeout to restart the delay
        clearTimeout(timeoutId);
        // Set a new timeout to execute the function after the delay
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}
// --- End of Debounce Utility ---

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', function () {
    console.log("Tasks.js: DOMContentLoaded fired.");

    // --- Task Form Submission with Validation and Loading ---
    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', function (e) {
            console.log("Tasks.js: Task form submit triggered...");
            // --- Enhancement 1: Client-Side Validation ---
            e.preventDefault(); // Prevent default submission to perform validation first

            // Clear previous errors for this form
            clearFormErrors('taskForm');

            let isValid = true;
            const errors = {};

            // Get form values
            const taskName = document.getElementById('taskName').value.trim();
            const taskProject = document.getElementById('taskProject').value;
            const taskDueDate = document.getElementById('taskDueDate').value;
            const taskPriority = document.getElementById('taskPriority').value;
            // Status is handled automatically for new tasks or comes from edit

            // Validation rules
            if (!taskName) {
                isValid = false;
                errors.taskName = 'Task name is required.';
            }

            if (!taskProject) {
                isValid = false;
                errors.taskProject = 'Project is required.';
            }

            if (!taskDueDate) {
                isValid = false;
                errors.taskDueDate = 'Due date is required.';
            }

            // Check if due date is in the past (optional check)
            // if (taskDueDate && new Date(taskDueDate) < new Date().setHours(0,0,0,0)) {
            //     isValid = false;
            //     errors.taskDueDate = 'Due date cannot be in the past.';
            // }

            if (!taskPriority) {
                isValid = false;
                errors.taskPriority = 'Priority is required.';
            }

            // If validation fails, display errors and stop submission
            if (!isValid) {
                displayFormErrors('taskForm', errors);
                return; // Stop the function here
            }
            // --- End Enhancement 1 ---

            // --- Enhancement 2: Loading State ---
            // Indicate that processing has started
            if (window.app && typeof window.app.setModalLoading === 'function') {
                window.app.setModalLoading('taskModal', true);
            }
            // --- End Enhancement 2 ---

            // --- Existing Saving Logic (Wrapped in setTimeout for demo of loading) ---
            // In a real app, this would be synchronous or use promises/async
            setTimeout(() => { // Simulate potential async processing
                try {
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
                        name: taskName, // Use validated/trimmed value
                        description: document.getElementById('taskDescription').value.trim(),
                        dueDate: taskDueDate, // Use validated value
                        priority: taskPriority, // Use validated value
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

                } catch (saveError) {
                    console.error("Error saving task:", saveError);
                    // Optionally display an error message to the user inside the modal
                    alert("An error occurred while saving the task. Please try again.");
                } finally {
                    // Always turn off the loading state when done (success or error)
                    if (window.app && typeof window.app.setModalLoading === 'function') {
                        window.app.setModalLoading('taskModal', false);
                    }
                }
            }, 300); // End of setTimeout
            // --- End of Wrapped Saving Logic ---
        });
    }

    // --- Cancel task button ---
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

    // --- Add task button ---
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

            // --- Enhancement 3: Focus Management ---
            // Focus will be handled by the app's showModal function
            // --- End Enhancement 3 ---

            if (window.app && typeof window.app.showModal === 'function') {
                window.app.showModal('taskModal');
            } else {
                document.getElementById('taskModal').style.display = 'block';
            }
        });
    }

    // --- Filter event listeners ---
    const projectFilter = document.getElementById('projectFilter');
    const statusFilter = document.getElementById('statusFilter');
    const searchTasks = document.getElementById('searchTasks');

    if (projectFilter) projectFilter.addEventListener('change', loadTaskList);
    if (statusFilter) statusFilter.addEventListener('change', loadTaskList);
    // if (searchTasks) searchTasks.addEventListener('input', loadTaskList); // Removed direct listener

    // --- NEW: Debounced Search Implementation ---
    if (searchTasks) {
        console.log("Tasks.js: #searchTasks input found, attaching debounced event listener.");

        // 1. Define the search function
        function performSearch() {
            console.log("Tasks.js: performSearch called.");
            loadTaskList(); // Re-run loadTaskList which now incorporates the search term
        }

        // 2. Create a debounced version of the search function
        const debouncedPerformSearch = debounce(performSearch, 300);

        // 3. Attach the INPUT event listener to the search box
        searchTasks.addEventListener('input', function (event) {
            console.log("Tasks.js: Search input event triggered.");
            debouncedPerformSearch();
        });

        console.log("Tasks.js: Debounced search event listener attached.");
    } else {
        console.warn("Tasks.js: Search input (#searchTasks) not found.");
    }
    // --- END OF NEW SEARCH IMPLEMENTATION ---

    // --- Event delegation for task dropdowns ---
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
// --- End of Event Listeners ---

// --- Form Validation Helper Functions ---
function clearFormErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    // Remove error messages
    form.querySelectorAll('.error-message').forEach(el => el.remove());
    // Remove error styling
    form.querySelectorAll('.form-group').forEach(group => group.classList.remove('has-error'));
}

function displayFormErrors(formId, errors) {
    const form = document.getElementById(formId);
    if (!form) return;

    for (const [fieldName, message] of Object.entries(errors)) {
        const field = document.getElementById(fieldName);
        const formGroup = field?.closest('.form-group');
        if (formGroup) {
            formGroup.classList.add('has-error');
            // Create error message element
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.style.color = 'var(--danger)'; // Use your danger color
            errorElement.style.fontSize = '0.85rem';
            errorElement.style.marginTop = '0.25rem';
            errorElement.textContent = message;
            // Insert error message after the input/select/textarea
            field.parentNode.insertBefore(errorElement, field.nextSibling);
        }
    }
}
// --- End of Form Validation Helper Functions ---

// --- Add this new function to handle view refresh ---
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
// --- End of refresh function ---