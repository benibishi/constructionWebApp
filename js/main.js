// Main Application Controller
console.log("main.js file loaded and parsed.");
class ConstructionManager {
    constructor() {
        this.currentTab = 'dashboard';
        this.currentSubTab = 'daily-reports'; // Default subtab for reports
        this.init();
    }
    init() {
        this.setupEventListeners();
        this.loadTab(this.currentTab);
        this.initializeData();
    }

    setupEventListeners() {
        // Navigation tab switching (Main Tabs)
        document.querySelectorAll('.nav-link[data-tab]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // Close any open dropdowns first
                document.querySelectorAll('.nav-dropdown-menu.show').forEach(menu => menu.classList.remove('show'));
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });
        // --- NEW: Handle clicks on Report Sub-tabs ---
        document.querySelectorAll('.nav-dropdown-item[data-subtab]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevent triggering parent link
                const subTab = e.currentTarget.dataset.subtab;
                this.switchSubTab(subTab);
                // Close the dropdown menu after selection
                document.querySelectorAll('.nav-dropdown-menu.show').forEach(menu => menu.classList.remove('show'));
            });
        });

        // --- NEW: Toggle Report Dropdown ---
        document.querySelectorAll('.nav-link[data-tab="reports"]').forEach(link => {
            link.addEventListener('click', (e) => {
                // Toggle the dropdown menu visibility
                const dropdownMenu = e.currentTarget.nextElementSibling; // Assumes menu is the next sibling
                if (dropdownMenu && dropdownMenu.classList.contains('nav-dropdown-menu')) {
                    dropdownMenu.classList.toggle('show');
                    e.preventDefault(); // Prevent default link behavior only for toggle
                }
            });
        });
        // Modal close buttons (existing logic)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close') || e.target.classList.contains('btn-secondary')) {
                this.closeAllModals();
            }
            // --- NEW: Close dropdowns when clicking outside ---
            if (!e.target.closest('.nav-dropdown')) {
                document.querySelectorAll('.nav-dropdown-menu.show').forEach(menu => menu.classList.remove('show'));
            }
            // --- END NEW ---
        });

        // Click outside modal to close (existing logic)
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeAllModals();
                }
            });
        });
    }

    // js/main.js (inside ConstructionManager class)

    switchTab(tabName) {
        console.log(`Main.js: switchTab called with tabName: ${tabName}`); // Debug log

        // Update navigation for main tabs - Remove 'active' from all main tab links
        document.querySelectorAll('.nav-link[data-tab]').forEach(link => {
            link.classList.remove('active');
        });

        // Remove 'active' from all dropdown items when switching main tabs
        document.querySelectorAll('.nav-dropdown-item').forEach(item => {
            item.classList.remove('active');
        });

        // --- Handle activating the correct main tab link in the UI ---
        let activeMainTabLink = null;
        if (tabName !== 'reports') {
            // For non-report tabs, find and activate the link directly
            activeMainTabLink = document.querySelector(`.nav-link[data-tab="${tabName}"]`);
        } else {
            // For the 'reports' tab, find the main parent link
            activeMainTabLink = document.querySelector(`.nav-link[data-tab="reports"]`);
        }

        if (activeMainTabLink) {
            activeMainTabLink.classList.add('active');
            console.log(`Main.js: Activated main tab link for ${tabName}`); // Debug log

            // If it's the reports tab, also ensure the current subtab link is marked active
            if (tabName === 'reports') {
                const activeSubLink = document.querySelector(`.nav-dropdown-item[data-subtab="${this.currentSubTab}"]`);
                if (activeSubLink) {
                    activeSubLink.classList.add('active');
                    console.log(`Main.js: Also activated subtab link for ${this.currentSubTab}`); // Debug log
                }
            }
        }
        // --- End of UI activation ---

        // --- Handle Content Visibility ---
        // Hide ALL main tab content sections first
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Specific logic based on which main tab was selected
        if (tabName !== 'reports') {
            // For non-report tabs, show their corresponding content section
            const activeTabContent = document.getElementById(tabName);
            if (activeTabContent) {
                activeTabContent.classList.add('active');
                console.log(`Main.js: Showed content for main tab ${tabName}`); // Debug log
            }

            // Explicitly hide the report sub-tab sections when NOT on the reports main tab
            document.getElementById('daily-reports')?.classList.remove('active');
            document.getElementById('weekly-reports')?.classList.remove('active');
            document.getElementById('visual-analytics')?.classList.remove('active');

        } else {
            // For the 'reports' tab:
            // 1. Do NOT automatically load or show content here.
            // 2. The dropdown click handler (switchSubTab) will handle showing the correct sub-tab content.
            // 3. However, ensure the dropdown menu itself is handled (though this is usually done by the click listener)
            console.log("Main.js: 'reports' tab selected. Content will be shown by sub-tab handler.");
            // We can optionally ensure the default/current sub-tab content is visible
            // But it's safer to let switchSubTab control it.
            // this.showReportSubTab(this.currentSubTab); // Optional: uncomment if needed for initial display
        }
        // --- End of Content Visibility ---

        // Update the current tab state
        this.currentTab = tabName;
        console.log(`Main.js: this.currentTab updated to ${this.currentTab}`); // Debug log

        // --- CRITICAL CHANGE: Only call loadTab for non-report main tabs ---
        // The loadTab function should NOT be called for 'reports' itself,
        // because 'reports' is just a container/dropdown, not a content view.
        // Content loading for report sub-tabs is handled by switchSubTab.
        if (tabName !== 'reports') {
            console.log(`Main.js: Calling loadTab for ${tabName}`); // Debug log
            this.loadTab(tabName); // Load content for the main tab (Dashboard, Projects, etc.)
        } else {
            console.log("Main.js: Skipping loadTab call for 'reports' main tab."); // Debug log
            // If needed, you could trigger loading for the *current* subtab here,
            // but it's better handled by switchSubTab to avoid race conditions.
            // this.loadTab(this.currentSubTab);
        }
        // --- END CRITICAL CHANGE ---
    }

    loadTab(tabName) {
        // Load the appropriate content for each tab
        switch (tabName) {
            case 'dashboard':
                // Dashboard loads its own stats and project list view
                if (typeof loadDashboard === 'function') loadDashboard();
                break;
            case 'projects':
                // Projects tab uses the unified project list renderer for its specific container
                // loadProjectsList function in projects.js now handles this via renderProjectList
                if (typeof loadProjectsList === 'function') loadProjectsList();
                break;
            case 'project-details':
                // Project details view is loaded dynamically by showProjectDetails function
                // when a project is clicked. No specific loading needed here as it replaces
                // the content of the 'projects' or 'project-details' tab.
                // Ensure the container is clear or has a loading state if needed.
                const projectDetailsContent = document.getElementById('projectDetailsContent');
                if (projectDetailsContent) {
                    projectDetailsContent.innerHTML = '<div class="loading">Loading project details...</div>';
                }
                // Actual content loading happens in showProjectDetails -> loadProjectDetails
                break;
            case 'tasks':
                if (typeof loadTasks === 'function') loadTasks();
                break;
            case 'calendar':
                if (typeof loadCalendar === 'function') loadCalendar();
                break;
            case 'documents':
                if (typeof loadDocuments === 'function') loadDocuments();
                break;
            case 'team':
                if (typeof loadTeam === 'function') loadTeam();
                break;
            case 'reports': // This might be called initially if 'reports' is the default
            case 'daily-reports':
                if (typeof loadDailyReports === 'function') loadDailyReports();
                break;
            case 'weekly-reports':
                if (typeof loadWeeklyReports === 'function') loadWeeklyReports();
                break;
            case 'visual-analytics':
                if (typeof loadVisualAnalytics === 'function') loadVisualAnalytics();
                break;
            default:
                console.warn(`Unknown tab requested: ${tabName}`);
            // Optionally load a default tab or show an error message
            // e.g., this.loadTab('dashboard');
        }
    }
    initializeData() {
        // Initialize with sample data if none exists
        if (!localStorage.getItem('projects')) {
            localStorage.setItem('projects', JSON.stringify(sampleData.projects));
        }
        if (!localStorage.getItem('tasks')) {
            localStorage.setItem('tasks', JSON.stringify(sampleData.tasks));
        }
        if (!localStorage.getItem('team')) {
            localStorage.setItem('team', JSON.stringify(sampleData.team));
        }
        if (!localStorage.getItem('notifications')) {
            localStorage.setItem('notifications', JSON.stringify(sampleData.notifications));
        }
    }

    showModal(modalId) {
        this.closeAllModals();
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';

            // --- Enhancement 1: Focus Management ---
            // Try to focus the first input, select, or textarea within the modal
            const focusableElements = modal.querySelectorAll('input, select, textarea, button');
            const firstFocusable = Array.from(focusableElements).find(el => el.offsetParent !== null); // offsetParent checks if visible
            if (firstFocusable) {
                // Small delay to ensure modal is fully rendered
                setTimeout(() => firstFocusable.focus(), 10);
            }
            // --- End Enhancement 1 ---
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    // --- Enhancement 2: Loading State Helper ---
    // Call this when starting a process in a modal
    setModalLoading(modalId, isLoading) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        const submitButton = modal.querySelector('button[type="submit"]');
        const cancelButton = modal.querySelector('#cancelProject, #cancelTask, #cancelMember, #cancelReport, #cancelDocument'); // Add IDs for other modals

        if (isLoading) {
            // Disable buttons and show loading text/spinner
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.dataset.originalText = submitButton.innerHTML;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; // Requires FontAwesome spinner
            }
            if (cancelButton) cancelButton.disabled = true;

            // Optional: Add a general overlay or dim the form content
            const form = modal.querySelector('form');
            if (form) {
                form.style.pointerEvents = 'none'; // Prevent interaction
                form.style.opacity = '0.7';
            }

        } else {
            // Re-enable buttons and restore text
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = submitButton.dataset.originalText || 'Save'; // Fallback if data attribute missing
                delete submitButton.dataset.originalText;
            }
            if (cancelButton) cancelButton.disabled = false;

            // Re-enable form
            const form = modal.querySelector('form');
            if (form) {
                form.style.pointerEvents = '';
                form.style.opacity = '';
            }
        }
    }
}

// Sample Data
const sampleData = {
    projects: [
        {
            id: 1,
            name: "Downtown Office Complex",
            description: "15-story commercial office building in downtown area",
            startDate: "2024-01-15",
            endDate: "2024-12-31",
            status: "active",
            progress: 65
        },
        {
            id: 2,
            name: "Residential Housing Development",
            description: "40-unit apartment complex with underground parking",
            startDate: "2024-02-01",
            endDate: "2024-11-30",
            status: "active",
            progress: 45
        },
        {
            id: 3,
            name: "Highway Infrastructure Upgrade",
            description: "Major highway expansion and bridge construction",
            startDate: "2023-10-01",
            endDate: "2024-08-31",
            status: "on-hold",
            progress: 78
        }
    ],
    tasks: [
        {
            id: 1,
            projectId: 1,
            name: "Foundation Excavation",
            description: "Excavate foundation for main building structure",
            dueDate: "2024-02-15",
            priority: "high",
            status: "completed",
            assignee: 1,
            dependencies: []
        },
        {
            id: 2,
            projectId: 1,
            name: "Steel Framework Installation",
            description: "Install steel framework for floors 1-5",
            dueDate: "2024-03-30",
            priority: "critical",
            status: "in-progress",
            assignee: 2,
            dependencies: [1]
        },
        {
            id: 3,
            projectId: 2,
            name: "Site Preparation",
            description: "Clear and grade construction site",
            dueDate: "2024-02-28",
            priority: "medium",
            status: "completed",
            assignee: 3,
            dependencies: []
        },
        {
            id: 4,
            projectId: 2,
            name: "Utility Connections",
            description: "Install water, sewer, and electrical connections",
            dueDate: "2024-04-15",
            priority: "high",
            status: "pending",
            assignee: null,
            dependencies: [3]
        }
    ],
    team: [
        {
            id: 1,
            name: "John Smith",
            email: "john.smith@company.com",
            role: "project-manager",
            phone: "+1 (555) 123-4567"
        },
        {
            id: 2,
            name: "Maria Garcia",
            email: "maria.garcia@company.com",
            role: "site-supervisor",
            phone: "+1 (555) 234-5678"
        },
        {
            id: 3,
            name: "David Johnson",
            email: "david.johnson@company.com",
            role: "engineer",
            phone: "+1 (555) 345-6789"
        }
    ],
    notifications: [
        {
            id: 1,
            type: "task-due",
            message: "Foundation Excavation is due today",
            taskId: 1,
            projectId: 1,
            priority: "high",
            read: false,
            timestamp: new Date().toISOString()
        },
        {
            id: 2,
            type: "task-completed",
            message: "Site Preparation has been completed",
            taskId: 3,
            projectId: 2,
            priority: "medium",
            read: false,
            timestamp: new Date(Date.now() - 86400000).toISOString()
        }
    ]
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("main.js: DOMContentLoaded fired.");
    window.app = new ConstructionManager();
});