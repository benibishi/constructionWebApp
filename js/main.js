// Main Application Controller
class ConstructionManager {
    constructor() {
        this.currentTab = 'dashboard';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTab(this.currentTab);
        this.initializeData();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Modal Close Buttons
        document.querySelectorAll('.close, .btn-secondary').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeAllModals();
                }
            });
        });
    }

    switchTab(tabName) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;
        this.loadTab(tabName);
    }

    loadTab(tabName) {
        switch (tabName) {
            case 'dashboard':
                if (typeof loadDashboard === 'function') loadDashboard();
                break;
            case 'tasks':
                if (typeof loadTasks === 'function') loadTasks();
                break;
            case 'team':
                if (typeof loadTeam === 'function') loadTeam();
                break;
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
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    showModal(modalId) {
        this.closeAllModals();
        document.getElementById(modalId).style.display = 'block';
    }

    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
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
            assignee: 1
        },
        {
            id: 2,
            projectId: 1,
            name: "Steel Framework Installation",
            description: "Install steel framework for floors 1-5",
            dueDate: "2024-03-30",
            priority: "critical",
            status: "in-progress",
            assignee: 2
        },
        {
            id: 3,
            projectId: 2,
            name: "Site Preparation",
            description: "Clear and grade construction site",
            dueDate: "2024-02-28",
            priority: "medium",
            status: "completed",
            assignee: 3
        },
        {
            id: 4,
            projectId: 2,
            name: "Utility Connections",
            description: "Install water, sewer, and electrical connections",
            dueDate: "2024-04-15",
            priority: "high",
            status: "pending",
            assignee: null
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
    ]
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ConstructionManager();
});