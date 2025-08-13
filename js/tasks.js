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

    container.innerHTML = filteredTasks.map(task => {
        const project = projects.find(p => p.id === task.projectId);
        const assignee = team.find(m => m.id === task.assignee);
        const priorityClass = `priority-${task.priority}`;
        const priorityText = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
        const statusClass = `status-${task.status.replace(' ', '-')}`;
        const statusText = task.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

        return `
            <div class="task-card ${task.priority}">
                <div class="task-header">
                    <h3 class="task-title">${task.name}</h3>
                    <span class="task-priority ${priorityClass}">${priorityText}</span>
                </div>
                <p class="task-description">${task.description}</p>
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
                        <button class="btn btn-danger btn-sm" onclick="deleteTask(${task.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
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

        document.getElementById('taskModalTitle').textContent = 'Edit Task';
        populateProjectDropdown();
        populateAssigneeDropdown();
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

// Helper functions
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

// Form handling
document.getElementById('taskForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const taskId = document.getElementById('taskId').value;
    const task = {
        id: taskId ? parseInt(taskId) : Date.now(),
        projectId: parseInt(document.getElementById('taskProject').value),
        name: document.getElementById('taskName').value,
        description: document.getElementById('taskDescription').value,
        dueDate: document.getElementById('taskDueDate').value,
        priority: document.getElementById('taskPriority').value,
        status: 'pending',
        assignee: document.getElementById('taskAssignee').value ? parseInt(document.getElementById('taskAssignee').value) : null
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
    loadTaskList();
});

document.getElementById('cancelTask').addEventListener('click', function () {
    document.getElementById('taskForm').reset();
    document.getElementById('taskId').value = '';
    document.getElementById('taskModalTitle').textContent = 'Add New Task';
    app.hideModal('taskModal');
});

// Add Task Button
document.getElementById('addTaskBtn').addEventListener('click', function () {
    document.getElementById('taskModalTitle').textContent = 'Add New Task';
    populateProjectDropdown();
    populateAssigneeDropdown();
    app.showModal('taskModal');
});

// Filter event listeners
document.getElementById('projectFilter').addEventListener('change', loadTaskList);
document.getElementById('statusFilter').addEventListener('change', loadTaskList);
document.getElementById('searchTasks').addEventListener('input', loadTaskList);