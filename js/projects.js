// js/projects.js - Projects Management Module

// --- Assume formatDate, getRoleText, getProgressColor, escapeHtml, debounce are available from utils.js ---

// --- Selection State for Projects ---
let selectedProjectIds = new Set();

// --- Main Load Function for Projects List Page ---
function loadProjectsList() {
    // Delegate to the unified renderer, specifying the container for the projects list page
    renderProjectList('projectsListContainer', true);
}

/* Renders the list of projects into the specified container.
 * @param { string } containerId - The ID of the HTML element to render the projects into.
 * @param { boolean } [includeCheckboxes = true] - Whether to include selection checkboxes.
 */
function renderProjectList(containerId, includeCheckboxes = true) { // Add parameter with default
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const container = document.getElementById(containerId);

    // --- Get Search Term (if filter exists) ---
    // Use the correct search input ID based on the container
    let searchFilter = '';
    if (containerId === 'projectsListContainer') {
        searchFilter = document.getElementById('searchProjects')?.value.toLowerCase().trim() || '';
    } else if (containerId === 'projectsContainer') {
        // If you add a search filter to the dashboard later, use its ID here
        // searchFilter = document.getElementById('searchProjectsDashboard')?.value.toLowerCase().trim() || '';
    }
    console.log(`Projects.js: Rendering list in #${containerId}, search term: '${searchFilter}', checkboxes: ${includeCheckboxes}`);

    // --- Apply Search Filter ---
    let filteredProjects = projects;
    if (searchFilter) {
        filteredProjects = projects.filter(project =>
            (project.name && project.name.toLowerCase().includes(searchFilter)) ||
            (project.description && project.description.toLowerCase().includes(searchFilter))
        );
    }
    // --- End Apply Search Filter ---

    if (!container) {
        console.warn(`Projects.js: Container with ID '${containerId}' not found for project list rendering.`);
        return;
    }

    if (filteredProjects.length === 0) {
        // Generic empty state
        container.innerHTML = `
            <div class="empty-state-full">
                <i class="fas fa-project-diagram"></i>
                <h3>No Projects Found</h3>
                <p>${containerId === 'projectsListContainer' ? 'Try adjusting your search or get started by creating your first project.' : 'Get started by creating your first project.'}</p>
                <button class="btn btn-primary" onclick="showProjectModal()">
                    <i class="fas fa-plus"></i> Create Project
                </button>
            </div>
        `;
        // Hide bulk actions bar if no projects (only relevant for projects page)
        if (containerId === 'projectsListContainer') {
            const bulkActionsBarProjects = document.getElementById('bulkActionsBarProjects');
            if (bulkActionsBarProjects) {
                bulkActionsBarProjects.style.display = 'none';
                selectedProjectIds.clear();
            }
        }
        return;
    }

    // Generate project cards HTML
    const projectCardsHtml = filteredProjects.map(project => {
        const statusClass = `status-${project.status}`;
        const statusText = project.status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        // Check if this project is selected (only relevant if checkboxes are shown)
        const isSelected = includeCheckboxes ? selectedProjectIds.has(project.id) : false;

        // Conditionally build the checkbox HTML
        const checkboxHtml = includeCheckboxes ? `
            <!-- Checkbox for selection -->
            <div style="position: absolute; top: 0.5rem; left: 0.5rem;">
                <input type="checkbox" class="project-checkbox" data-project-id="${project.id}" id="select-project-${project.id}" ${isSelected ? 'checked' : ''}>
            </div>
        ` : '';

        // Use consistent HTML structure for project cards
        // Adjust padding-top based on whether checkbox is present
        const cardStyle = includeCheckboxes ? 'cursor: pointer; position: relative; padding-top: 2rem;' : 'cursor: pointer; position: relative;';

        return `
            <div class="project-card" onclick="showProjectDetails(${project.id})" style="${cardStyle}">
                ${checkboxHtml} <!-- Insert checkbox HTML conditionally -->
                <div class="project-header">
                    <h3>${escapeHtml(project.name)}</h3>
                    <p>${escapeHtml(project.description || '')}</p>
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

    // --- Add Selection and Bulk Action Logic AFTER rendering (ONLY for projects page) ---
    if (includeCheckboxes && containerId === 'projectsListContainer') {
        const bulkActionsBarProjects = document.getElementById('bulkActionsBarProjects');
        const selectAllProjectsCheckbox = document.getElementById('selectAllProjectsCheckbox');
        const selectedProjectsCount = document.getElementById('selectedProjectsCount');

        if (selectAllProjectsCheckbox) {
            updateSelectAllProjectsCheckboxState();
            selectAllProjectsCheckbox.removeEventListener('change', handleSelectAllProjectsChange);
            selectAllProjectsCheckbox.addEventListener('change', handleSelectAllProjectsChange);
        }

        const projectCheckboxes = container.querySelectorAll('.project-checkbox');
        projectCheckboxes.forEach(checkbox => {
            const projectId = parseInt(checkbox.dataset.projectId);
            checkbox.checked = selectedProjectIds.has(projectId);
            // Use a specific handler name to avoid conflicts or confusion
            const specificHandler = function (event) {
                // CRITICAL: Stop the click event from bubbling up to the card's onclick handler
                event.stopPropagation();
                // Call the main logic
                handleProjectCheckboxChange(event);
            };
            checkbox.removeEventListener('change', specificHandler); // Remove potential old one
            checkbox.addEventListener('change', specificHandler);

            // Also add click listener as a safeguard
            checkbox.removeEventListener('click', function (e) { e.stopPropagation(); });
            checkbox.addEventListener('click', function (e) { e.stopPropagation(); });
        });

        const bulkDeleteProjectsBtn = document.getElementById('bulkDeleteProjectsBtn');
        if (bulkDeleteProjectsBtn) {
            bulkDeleteProjectsBtn.removeEventListener('click', handleBulkDeleteProjects);
            bulkDeleteProjectsBtn.addEventListener('click', handleBulkDeleteProjects);
        }

        updateSelectedProjectsCountDisplay();
        updateBulkProjectsActionBarVisibility();
    }
    // --- End of Selection and Bulk Action Logic ---
}

// --- Project Action Functions ---

function showProjectModal() {
    document.getElementById('projectModalTitle').textContent = 'Add New Project';
    document.getElementById('projectId').value = '';
    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
        projectForm.reset();
    }
    if (window.app && typeof window.app.showModal === 'function') {
        window.app.showModal('projectModal');
    } else {
        const modal = document.getElementById('projectModal');
        if (modal) modal.style.display = 'block';
    }
}
// js/projects.js

function loadProjectDetails(projectId) {
    console.log(`Projects.js: loadProjectDetails called for project ID ${projectId}`);

    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const team = JSON.parse(localStorage.getItem('team') || '[]');

    const project = projects.find(p => p.id === projectId);
    if (!project) {
        console.error('Projects.js: Project not found:', projectId);
        const content = document.getElementById('projectDetailsContent');
        if (content) {
            content.innerHTML = `
                <div class="empty-state-full">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Project Not Found</h3>
                    <p>The requested project could not be found.</p>
                    <button class="btn btn-primary" onclick="goBackToProjects()">
                        <i class="fas fa-arrow-left"></i> Back to Projects
                    </button>
                </div>
            `;
        }
        return;
    }

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
    <!-- Updated HTML -->
<div class="project-overview">
    <div class="overview-card timeline">
        <h4><i class="fas fa-calendar"></i> Timeline</h4>
        <div class="timeline-item">
            <span class="label">Start:</span>
            <span class="value">Jan 31, 2024</span>
        </div>
        <div class="timeline-item">
            <span class="label">End:</span>
            <span class="value">Nov 29, 2024</span>
        </div>
        <div class="timeline-item">
            <span class="label">Dur:</span>
            <span class="value">303 days</span>
        </div>
        <div class="timeline-item">
            <span class="label">Stat:</span>
            <span class="value"><span class="status-active">Active</span></span>
        </div>
    </div>

    <div class="overview-card progress">
        <h4><i class="fas fa-chart-line"></i> Progress</h4>
        <div class="progress-bar-container">
            <div class="progress-bar">
                <div class="progress-fill" style="width: 45%; background: #f59e0b;"></div>
            </div>
            <div class="progress-info">
                <span class="label">Overall:</span>
                <span class="value">45%</span>
            </div>
            <div class="progress-info">
                <span class="label">Rate:</span>
                <span class="value">50%</span>
            </div>
        </div>
    </div>

    <div class="overview-card stats">
        <h4><i class="fas fa-tasks"></i> Tasks</h4>
        <div class="stats-item">
            <span class="label">Total:</span>
            <span class="value">2</span>
        </div>
        <div class="stats-item">
            <span class="label">Completed:</span>
            <span class="value">1</span>
        </div>
        <div class="stats-item">
            <span class="label">In Progress:</span>
            <span class="value">0</span>
        </div>
        <div class="stats-item">
            <span class="label">Pending:</span>
            <span class="value">1</span>
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

    // Add event listener for the new dropdowns in the project details view
    content.addEventListener('click', function (event) {
        const toggleButton = event.target.closest('.dropdown-toggle');

        if (toggleButton && toggleButton.dataset.taskId) {
            event.preventDefault();
            const taskId = toggleButton.dataset.taskId;
            const dropdownMenu = document.getElementById(`dropdown-${taskId}`);

            if (dropdownMenu) {
                const isCurrentlyOpen = dropdownMenu.classList.contains('show');

                // Close all other open dropdowns first.
                // This is important to ensure only one menu is open at a time.
                document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                    if (menu.id !== `dropdown-${taskId}`) {
                        menu.classList.remove('show');
                    }
                });

                // Toggle the state of the clicked dropdown
                dropdownMenu.classList.toggle('show');
            }
        }
    });
}
/*
 * Navigates to the project details view for a given project ID.
 * @param {number} projectId - The ID of the project to display.
 */
// js/projects.js

function showProjectDetails(projectId) {
    console.log(`Projects.js: showProjectDetails called for project ID ${projectId}`);

    // Store the project ID globally so other functions can access it
    window.currentProjectId = projectId;

    // Use the main app controller to switch to the 'project-details' tab
    if (window.app && typeof window.app.switchTab === 'function') {
        console.log("Projects.js: Switching to 'project-details' tab using app controller.");
        window.app.switchTab('project-details');
    } else {
        console.error("Projects.js: Could not switch tab. window.app.switchTab is not available.");
        alert("Navigation error: Could not switch to project details view.");
        return;
    }

    // Load the detailed project information
    // We need to wait a tiny bit to ensure the tab switching is complete
    // before trying to manipulate the content inside the 'project-details' tab.
    setTimeout(() => {
        console.log("Projects.js: Calling loadProjectDetails after tab switch delay.");
        // Check if loadProjectDetails function exists (it should be in this file or loaded)
        if (typeof loadProjectDetails === 'function') {
            loadProjectDetails(projectId);
        } else {
            console.error("Projects.js: loadProjectDetails function is not defined.");
            // Fallback: Try to find it on the window object if exported differently
            if (window.loadProjectDetails && typeof window.loadProjectDetails === 'function') {
                window.loadProjectDetails(projectId);
            } else {
                // Final fallback: Show an error in the target area
                const detailsContent = document.getElementById('projectDetailsContent');
                if (detailsContent) {
                    detailsContent.innerHTML = `
                        <div class="empty-state-full">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>Error Loading Project</h3>
                            <p>Could not find the function to load project details.</p>
                            <button class="btn btn-primary" onclick="goBackToProjects()">
                                <i class="fas fa-arrow-left"></i> Back to Projects
                            </button>
                        </div>
                    `;
                }
            }
        }
    }, 100); // 100ms delay
}

function editProject(projectId) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const project = projects.find(p => p.id === projectId);

    if (project) {
        document.getElementById('projectId').value = project.id;
        document.getElementById('projectName').value = project.name;
        document.getElementById('projectDescription').value = project.description || '';
        document.getElementById('startDate').value = project.startDate;
        document.getElementById('endDate').value = project.endDate;
        document.getElementById('projectStatus').value = project.status;

        document.getElementById('projectModalTitle').textContent = 'Edit Project';
        if (window.app && typeof window.app.showModal === 'function') {
            window.app.showModal('projectModal');
        } else {
            const modal = document.getElementById('projectModal');
            if (modal) modal.style.display = 'block';
        }
    }
}

// --- Selection and Bulk Action Helper Functions for Projects ---
function goBackToProjects() {
    console.log("Projects.js: goBackToProjects called.");
    if (window.app && typeof window.app.switchTab === 'function') {
        window.app.switchTab('projects'); // Switch back to the 'projects' tab
    } else {
        console.error("Projects.js: Could not switch tab back to projects. window.app.switchTab is not available.");
        // Fallback: Reload the page or find another way to navigate
        window.location.reload(); // Or handle differently if needed
    }
}
function updateSelectAllProjectsCheckboxState() {
    const selectAllCheckbox = document.getElementById('selectAllProjectsCheckbox');
    const allProjectCheckboxes = document.querySelectorAll('#projectsListContainer .project-checkbox');
    const totalVisibleProjects = allProjectCheckboxes.length;
    const totalSelectedVisibleProjects = Array.from(allProjectCheckboxes).filter(cb => cb.checked).length;

    if (selectAllCheckbox) {
        if (totalVisibleProjects > 0 && totalSelectedVisibleProjects === totalVisibleProjects) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else if (totalSelectedVisibleProjects > 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }
    }
}

function updateSelectedProjectsCountDisplay() {
    const selectedCount = document.getElementById('selectedProjectsCount');
    if (selectedCount) {
        const count = selectedProjectIds.size;
        selectedCount.textContent = count > 0 ? `${count} selected` : '';
    }
}

function updateBulkProjectsActionBarVisibility() {
    const bulkActionsBar = document.getElementById('bulkActionsBarProjects');
    if (bulkActionsBar) {
        if (selectedProjectIds.size > 0) {
            bulkActionsBar.style.display = 'block';
        } else {
            bulkActionsBar.style.display = 'none';
        }
    }
}

function handleSelectAllProjectsChange(event) {
    const isChecked = event.target.checked;
    const projectCheckboxes = document.querySelectorAll('#projectsListContainer .project-checkbox');

    projectCheckboxes.forEach(checkbox => {
        const projectId = parseInt(checkbox.dataset.projectId);
        checkbox.checked = isChecked;
        if (isChecked) {
            selectedProjectIds.add(projectId);
        } else {
            selectedProjectIds.delete(projectId);
        }
    });

    updateSelectedProjectsCountDisplay();
    updateBulkProjectsActionBarVisibility();
}

function handleProjectCheckboxChange(event) {
    const checkbox = event.target;
    const projectId = parseInt(checkbox.dataset.projectId);
    const isChecked = checkbox.checked;

    if (isChecked) {
        selectedProjectIds.add(projectId);
    } else {
        selectedProjectIds.delete(projectId);
    }

    updateSelectAllProjectsCheckboxState();
    updateSelectedProjectsCountDisplay();
    updateBulkProjectsActionBarVisibility();
}

// Example Bulk Action: Delete Projects
function handleBulkDeleteProjects() {
    if (selectedProjectIds.size === 0) {
        alert("Please select at least one project to delete.");
        return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedProjectIds.size} project(s)? This action cannot be undone and will also delete associated tasks and documents.`)) {
        return;
    }

    try {
        let projects = JSON.parse(localStorage.getItem('projects') || '[]');
        const initialCount = projects.length;
        projects = projects.filter(project => !selectedProjectIds.has(project.id));
        const deletedCount = initialCount - projects.length;

        localStorage.setItem('projects', JSON.stringify(projects));

        // Also delete associated tasks
        let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        tasks = tasks.filter(task => !selectedProjectIds.has(task.projectId));
        localStorage.setItem('tasks', JSON.stringify(tasks));

        // Also delete associated documents
        let documents = JSON.parse(localStorage.getItem('documents') || '[]');
        documents = documents.filter(doc => !selectedProjectIds.has(doc.projectId));
        localStorage.setItem('documents', JSON.stringify(documents));

        // Also delete associated daily reports
        let dailyReports = JSON.parse(localStorage.getItem('dailyReports') || '[]');
        dailyReports = dailyReports.filter(report => !selectedProjectIds.has(report.projectId));
        localStorage.setItem('dailyReports', JSON.stringify(dailyReports));

        console.log(`Projects.js: Bulk Delete Projects: Removed ${deletedCount} projects and associated data.`);

        selectedProjectIds.clear();

        // Refresh the project list
        loadProjectsList(); // This calls renderProjectList

        // Show notification
        if (typeof showNotification === 'function') {
            showNotification(`${deletedCount} project(s) and associated data deleted.`, 'success');
        } else {
            alert(`${deletedCount} project(s) and associated data deleted.`);
        }

        // Optionally, refresh dashboard stats if on dashboard
        if (typeof updateStats === 'function' && document.getElementById('dashboard')?.classList.contains('active')) {
            updateStats();
        }

    } catch (error) {
        console.error("Projects.js: Error during bulk project delete:", error);
        alert("An error occurred while deleting projects.");
    }
}
// --- End of Selection and Bulk Action Helper Functions for Projects ---


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', function () {
    console.log("Projects.js: DOMContentLoaded executing...");

    // --- Add Project Button on the Main Projects Page ---
    const addProjectBtnMain = document.getElementById('addProjectBtnMain');
    if (addProjectBtnMain) {
        console.log("Projects.js: #addProjectBtnMain found, attaching event listener.");
        addProjectBtnMain.addEventListener('click', function () {
            console.log("Projects.js: #addProjectBtnMain clicked!");
            // Ensure modal title and form are reset for a new project
            document.getElementById('projectModalTitle').textContent = 'Add New Project';
            const projectForm = document.getElementById('projectForm');
            if (projectForm) {
                projectForm.reset();
            }
            document.getElementById('projectId').value = ''; // Clear ID for new project

            // Show the modal using the app controller
            if (window.app && typeof window.app.showModal === 'function') {
                window.app.showModal('projectModal');
                console.log("Projects.js: Project modal shown via app controller.");
            } else {
                // Fallback if app.showModal is not available
                const projectModal = document.getElementById('projectModal');
                if (projectModal) {
                    projectModal.style.display = 'block';
                    console.log("Projects.js: Project modal shown via direct style.");
                } else {
                    console.error("Projects.js: Project modal element (#projectModal) not found.");
                }
            }
        });
    } else {
        console.warn("Projects.js: Add Project button (#addProjectBtnMain) NOT found.");
    }

    // --- Debounced Search for Projects ---
    const searchProjectsInput = document.getElementById('searchProjects');
    if (searchProjectsInput) {
        console.log("Projects.js: #searchProjects input found, attaching debounced event listener.");

        function performProjectSearch() {
            console.log("Projects.js: performProjectSearch called.");
            // Re-render the list which now incorporates the search term
            renderProjectList('projectsListContainer');
        }

        const debouncedPerformProjectSearch = debounce(performProjectSearch, 300);

        searchProjectsInput.addEventListener('input', function (event) {
            console.log("Projects.js: Project search input event triggered.");
            debouncedPerformProjectSearch();
        });

        console.log("Projects.js: Debounced project search event listener attached.");
    } else {
        console.warn("Projects.js: Search input (#searchProjects) not found. Search-as-you-type will not work for projects.");
    }
    // --- End of Debounced Search ---

    // --- Project Form Submission with Validation and Loading ---
    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
        projectForm.addEventListener('submit', function (e) {
            console.log("Projects.js: Project form submit triggered...");
            // --- Enhancement: Client-Side Validation ---
            e.preventDefault();

            // Clear previous errors for this form
            clearFormErrors('projectForm');

            let isValid = true;
            const errors = {};

            // Get form values
            const projectName = document.getElementById('projectName').value.trim();
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            const status = document.getElementById('projectStatus').value;

            // Validation rules
            if (!projectName) {
                isValid = false;
                errors.projectName = 'Project name is required.';
            }

            if (!startDate) {
                isValid = false;
                errors.startDate = 'Start date is required.';
            }

            if (!endDate) {
                isValid = false;
                errors.endDate = 'End date is required.';
            }

            // Check if end date is after start date
            if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
                isValid = false;
                errors.endDate = 'End date must be after the start date.';
            }

            if (!status) {
                isValid = false;
                errors.projectStatus = 'Project status is required.';
            }

            // If validation fails, display errors and stop submission
            if (!isValid) {
                displayFormErrors('projectForm', errors);
                return; // Stop the function here
            }
            // --- End Enhancement ---

            // --- Enhancement: Loading State ---
            // Indicate that processing has started
            if (window.app && typeof window.app.setModalLoading === 'function') {
                window.app.setModalLoading('projectModal', true);
            }
            // --- End Enhancement ---

            // --- Existing Saving Logic (Wrapped in setTimeout for demo of loading) ---
            // In a real app, this would be synchronous or use promises/async
            setTimeout(() => { // Simulate potential async processing
                try {
                    // --- Existing logic for saving project ---
                    const projectId = document.getElementById('projectId').value;
                    const project = {
                        id: projectId ? parseInt(projectId) : Date.now(),
                        name: projectName, // Use validated/trimmed value
                        description: document.getElementById('projectDescription').value.trim(),
                        startDate: startDate, // Use validated value
                        endDate: endDate,      // Use validated value
                        status: status,        // Use validated value
                        progress: 0
                    };

                    let projects = JSON.parse(localStorage.getItem('projects') || '[]');

                    if (projectId) {
                        // Update existing project
                        const index = projects.findIndex(p => p.id === parseInt(projectId));
                        if (index !== -1) {
                            projects[index] = project;
                            console.log(`Projects.js: Project ${projectId} updated.`); // Debug log
                        } else {
                            console.warn(`Projects.js: Project with ID ${projectId} not found for update.`);
                        }
                    } else {
                        // Add new project
                        projects.push(project);
                        console.log(`Projects.js: New project added with ID ${project.id}.`); // Debug log
                    }

                    localStorage.setItem('projects', JSON.stringify(projects));
                    console.log("Projects.js: Projects saved to localStorage."); // Debug log
                    // --- End of existing saving logic ---

                    // --- Reset form and close modal (existing logic) ---
                    this.reset();
                    document.getElementById('projectId').value = '';
                    document.getElementById('projectModalTitle').textContent = 'Add New Project';
                    if (window.app && typeof window.app.hideModal === 'function') {
                        window.app.hideModal('projectModal');
                        console.log("Projects.js: Project modal hidden via app controller."); // Debug log
                    } else {
                        document.getElementById('projectModal').style.display = 'none';
                        console.log("Projects.js: Project modal hidden via direct style."); // Debug log
                    }
                    // --- End of reset/close logic ---

                    // --- Refresh views (existing logic) ---
                    console.log("Projects.js: Refreshing views..."); // Debug log

                    // 1. Refresh dashboard stats (if function exists)
                    if (typeof updateStats === 'function') {
                        console.log("Projects.js: Calling updateStats()..."); // Debug log
                        updateStats(); // Update dashboard stats
                    } else {
                        console.warn("Projects.js: updateStats function not found.");
                    }

                    // 2. Refresh project list on the DASHBOARD view (uses #projectsContainer)
                    // The loadProjects function in dashboard.js now calls renderProjectList('projectsContainer')
                    if (typeof loadProjects === 'function') {
                        console.log("Projects.js: Calling loadProjects() for dashboard..."); // Debug log
                        loadProjects(); // Refresh project list on the DASHBOARD
                    } else {
                        console.warn("Projects.js: loadProjects function not found.");
                    }

                    // 3. ALSO refresh the project list on the MAIN PROJECTS PAGE (uses #projectsListContainer)
                    // This calls the loadProjectsList function in projects.js, which now calls renderProjectList('projectsListContainer')
                    if (typeof loadProjectsList === 'function') {
                        console.log("Projects.js: Calling loadProjectsList() for projects page..."); // Debug log
                        loadProjectsList(); // Refresh project list on the PROJECTS PAGE
                    } else {
                        console.warn("Projects.js: loadProjectsList function not found. Make sure projects.js is loaded correctly.");
                    }
                    console.log("Projects.js: View refresh attempts completed."); // Debug log
                    // --- End of refresh views ---

                    // Show success notification
                    if (typeof showNotification === 'function') {
                        showNotification(`Project "${project.name}" saved successfully!`, 'success');
                    } else {
                        alert(`Project "${project.name}" saved successfully!`);
                    }

                } catch (saveError) {
                    console.error("Projects.js: Error saving project:", saveError);
                    // Optionally display an error message to the user inside the modal
                    alert("An error occurred while saving the project. Please try again.");
                } finally {
                    // Always turn off the loading state when done (success or error)
                    if (window.app && typeof window.app.setModalLoading === 'function') {
                        window.app.setModalLoading('projectModal', false);
                    }
                }
            }, 300); // End of setTimeout
            // --- End of Wrapped Saving Logic ---
        });
    } else {
        console.warn("Projects.js: Project form element (#projectForm) not found in DOMContentLoaded.");
    }

    // --- Cancel Project Button ---
    const cancelProjectBtn = document.getElementById('cancelProject');
    if (cancelProjectBtn) {
        cancelProjectBtn.addEventListener('click', function () {
            console.log("Projects.js: Cancel project button clicked."); // Debug log
            const form = document.getElementById('projectForm');
            if (form) form.reset();
            document.getElementById('projectId').value = '';
            document.getElementById('projectModalTitle').textContent = 'Add New Project';
            // Use app controller if available, otherwise fallback
            if (window.app && typeof window.app.hideModal === 'function') {
                window.app.hideModal('projectModal');
            } else {
                const modal = document.getElementById('projectModal');
                if (modal) modal.style.display = 'none';
            }
        });
    } else {
        console.warn("Projects.js: Cancel project button (#cancelProject) not found.");
    }

});
// --- End of Event Listeners ---

// --- Form Validation Helper Functions (Assumed to be in utils.js, included here if needed) ---
// These should ideally be in utils.js to avoid duplication
function clearFormErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    // Remove error messages
    form.querySelectorAll('.error-message').forEach(el => el.remove());
    // Remove error styling
    form.querySelectorAll('.form-group.has-error').forEach(group => group.classList.remove('has-error'));
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
// --- End of Form Validation Helpers ---

// --- Notification Helper (Assumed to be global, included if needed) ---
function showNotification(message, type = 'info') {
    // Simple alert fallback or integrate with your existing notification system
    alert(`[${type.toUpperCase()}] ${message}`);
    // If you have a specific notification element, use that instead
    // const notification = document.getElementById('notification'); // From index.html
    // if (notification) {
    //     notification.textContent = message;
    //     notification.className = `notification ${type}`;
    //     notification.classList.add('show');
    //     setTimeout(() => notification.classList.remove('show'), 3000);
    // }
}
// --- End of Notification Helper ---