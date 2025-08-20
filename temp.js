// js/projects.js

document.addEventListener('DOMContentLoaded', function () {

    // --- Locate the Project Form Submission Listener ---
    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
        projectForm.addEventListener('submit', function (e) {
            // --- Enhancement 3: Client-Side Validation ---
            // Prevent default submission to perform validation first
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
            // --- End Enhancement 3 ---

            // --- Use the Loading State Helper ---
            // Indicate that processing has started
            if (window.app && typeof window.app.setModalLoading === 'function') {
                window.app.setModalLoading('projectModal', true);
            }
            // --- End Loading State ---

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
                        }
                    } else {
                        // Add new project
                        projects.push(project);
                    }

                    localStorage.setItem('projects', JSON.stringify(projects));
                    // --- End of existing saving logic ---

                    // --- Reset form and close modal (existing logic) ---
                    projectForm.reset();
                    document.getElementById('projectId').value = '';
                    document.getElementById('projectModalTitle').textContent = 'Add New Project';
                    if (window.app && typeof window.app.hideModal === 'function') {
                        window.app.hideModal('projectModal');
                    } else {
                        document.getElementById('projectModal').style.display = 'none';
                    }
                    // --- End of reset/close logic ---

                    // --- Refresh views (existing logic) ---
                    // (Call your existing refresh functions here, e.g., loadProjects, loadProjectsList, updateStats)
                    // You might want to add error handling around these calls too.
                    try {
                        if (typeof updateStats === 'function') updateStats();
                        if (typeof loadProjects === 'function') loadProjects();
                        if (typeof loadProjectsList === 'function') loadProjectsList();
                    } catch (refreshError) {
                        console.error("Error refreshing views after project save:", refreshError);
                        // Optionally show a notification to the user
                    }
                    // --- End of refresh views ---

                } catch (saveError) {
                    console.error("Error saving project:", saveError);
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
    }
    // --- End of Project Form Submission Listener ---

    // --- Add these helper functions for validation ---
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
    // --- End of validation helper functions ---

    // ... rest of the DOMContentLoaded code for projects.js ...
});