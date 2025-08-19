
// Daily Progress Report System
class DailyProgressReport {
    constructor() {
        this.reports = JSON.parse(localStorage.getItem('dailyReports') || '[]');
    }

    // Create a new daily report
    createReport(reportData) {
        const report = {
            id: Date.now(),
            date: reportData.date,
            projectId: reportData.projectId,
            projectName: reportData.projectName,
            crewDetails: {
                workers: reportData.workers,
                hoursWorked: reportData.hoursWorked,
                crewType: reportData.crewType
            },
            tasksCompleted: reportData.tasksCompleted || [],
            weather: {
                condition: reportData.weatherCondition,
                temperature: reportData.temperature,
                notes: reportData.weatherNotes
            },
            notes: reportData.notes,
            createdAt: new Date().toISOString(),
            createdBy: reportData.createdBy || 'admin',
            status: 'draft' // draft, submitted, approved
        };

        this.reports.push(report);
        this.saveReports();
        return report;
    }

    // Update existing report
    updateReport(reportId, reportData) {
        const index = this.reports.findIndex(r => r.id === reportId);
        if (index !== -1) {
            this.reports[index] = {
                ...this.reports[index],
                ...reportData,
                updatedAt: new Date().toISOString()
            };
            this.saveReports();
            return this.reports[index];
        }
        return null;
    }

    // Get reports with filtering
    getReports(filters = {}) {
        let filteredReports = [...this.reports];

        if (filters.date) {
            filteredReports = filteredReports.filter(r => r.date === filters.date);
        }

        if (filters.projectId) {
            filteredReports = filteredReports.filter(r => r.projectId === filters.projectId);
        }

        if (filters.status) {
            filteredReports = filteredReports.filter(r => r.status === filters.status);
        }

        // Sort by date descending
        filteredReports.sort((a, b) => new Date(b.date) - new Date(a.date));

        return filteredReports;
    }

    // Approve a report
    approveReport(reportId, approvedBy) {
        const index = this.reports.findIndex(r => r.id === reportId);
        if (index !== -1) {
            this.reports[index].status = 'approved';
            this.reports[index].approvedBy = approvedBy;
            this.reports[index].approvedAt = new Date().toISOString();
            this.saveReports();
            return this.reports[index];
        }
        return null;
    }

    // Save reports to localStorage
    saveReports() {
        localStorage.setItem('dailyReports', JSON.stringify(this.reports));
    }

    // Export to CSV
    exportToCSV() {
        const headers = [
            'Date', 'Project', 'Workers', 'Hours Worked', 'Tasks Completed',
            'Weather', 'Status', 'Notes'
        ];

        const csvContent = [
            headers.join(','),
            ...this.reports.map(report => [
                report.date,
                report.projectName,
                report.crewDetails.workers,
                report.crewDetails.hoursWorked,
                report.tasksCompleted.join('; '),
                report.weather.condition,
                report.status,
                `"${report.notes || ''}"`
            ].map(field => `"${field}"`).join(','))
        ].join('\n');

        return csvContent;
    }
}

// Initialize the reporting system
const dailyReportSystem = new DailyProgressReport();

// Daily Reports Functions
let currentReports = [];

function loadDailyReports() {
    loadReportFilters();
    loadReportsList();
}

function loadReportFilters() {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const projectFilter = document.getElementById('reportProjectFilter');
    const projectSelect = document.getElementById('reportProject');

    // Clear existing options
    if (projectFilter) {
        projectFilter.innerHTML = '<option value="">All Projects</option>';
    }

    if (projectSelect) {
        projectSelect.innerHTML = '<option value="">Select Project</option>';
    }

    // Add project options
    projects.forEach(project => {
        if (projectFilter) {
            const option1 = document.createElement('option');
            option1.value = project.id;
            option1.textContent = project.name;
            projectFilter.appendChild(option1);
        }

        if (projectSelect) {
            const option2 = document.createElement('option');
            option2.value = project.id;
            option2.textContent = project.name;
            projectSelect.appendChild(option2);
        }
    });
}

function loadReportsList() {
    if (!dailyReportSystem) return;

    const reports = dailyReportSystem.getReports({
        projectId: document.getElementById('reportProjectFilter')?.value,
        date: document.getElementById('reportDateFilter')?.value,
        status: document.getElementById('reportStatusFilter')?.value
    });

    currentReports = reports;
    const container = document.getElementById('reportsContainer');

    if (!container) return;

    if (reports.length === 0) {
        container.innerHTML = `
            <div class="empty-state-reports">
                <i class="fas fa-clipboard-list"></i>
                <h3>No Reports Found</h3>
                <p>Try adjusting your filters or create a new daily report.</p>
                <button class="btn btn-primary" onclick="showDailyReportModal()">
                    <i class="fas fa-plus"></i> Create Report
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = reports.map(report => {
        const tasksList = report.tasksCompleted && report.tasksCompleted.length > 0
            ? `<ul>${report.tasksCompleted.map(task => `<li>${task}</li>`).join('')}</ul>`
            : '<p>No tasks completed</p>';

        return `
            <div class="report-card ${report.status}" id="report-${report.id}">
                <div class="report-header">
                    <div>
                        <h3 class="report-title">${report.projectName}</h3>
                        <p class="report-date">${formatDate(report.date)}</p>
                    </div>
                    <span class="report-status status-${report.status}">
                        ${report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </span>
                </div>
                
                <div class="report-meta">
                    <span><i class="fas fa-users"></i> ${report.crewDetails.workers} workers</span>
                    <span><i class="fas fa-clock"></i> ${report.crewDetails.hoursWorked} hours</span>
                </div>
                
                <div class="report-section">
                    <h4><i class="fas fa-tasks"></i> Tasks Completed</h4>
                    ${tasksList}
                </div>
                
                <div class="report-section">
                    <h4><i class="fas fa-cloud-sun"></i> Weather</h4>
                    <p>${report.weather.condition}${report.weather.notes ? ` - ${report.weather.notes}` : ''}</p>
                </div>
                
                ${report.notes ? `
                <div class="report-section">
                    <h4><i class="fas fa-sticky-note"></i> Notes</h4>
                    <p>${report.notes}</p>
                </div>
                ` : ''}
                
                <div class="report-actions">
                    <button class="btn btn-outline btn-sm" onclick="viewReportDetails(${report.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="editReport(${report.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    ${report.status !== 'approved' ? `
                    <button class="btn btn-success btn-sm" onclick="approveReport(${report.id})">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function showDailyReportModal() {
    const modalTitle = document.getElementById('reportModalTitle');
    const form = document.getElementById('dailyReportForm');
    const reportId = document.getElementById('reportId');
    const reportDate = document.getElementById('reportDate');

    if (modalTitle) modalTitle.textContent = 'New Daily Progress Report';
    if (form) form.reset();
    if (reportId) reportId.value = '';

    // Set today's date as default
    if (reportDate) {
        const today = new Date().toISOString().split('T')[0];
        reportDate.value = today;
    }

    if (window.app && typeof window.app.showModal === 'function') {
        window.app.showModal('dailyReportModal');
    }
}

function editReport(reportId) {
    const report = dailyReportSystem.reports.find(r => r.id === reportId);
    if (report) {
        document.getElementById('reportId').value = report.id;
        document.getElementById('reportDate').value = report.date;
        document.getElementById('reportProject').value = report.projectId;
        document.getElementById('reportCrewType').value = report.crewDetails.crewType || 'general';
        document.getElementById('reportWorkers').value = report.crewDetails.workers;
        document.getElementById('reportHoursWorked').value = report.crewDetails.hoursWorked;
        document.getElementById('reportTasksCompleted').value = report.tasksCompleted ? report.tasksCompleted.join('\n') : '';
        document.getElementById('reportWeatherCondition').value = report.weather.condition;
        document.getElementById('reportWeatherNotes').value = report.weather.notes || '';
        document.getElementById('reportNotes').value = report.notes || '';

        document.getElementById('reportModalTitle').textContent = 'Edit Daily Progress Report';
        window.app.showModal('dailyReportModal');
    }
}

function viewReportDetails(reportId) {
    const report = dailyReportSystem.reports.find(r => r.id === reportId);
    if (report) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'reportDetailsModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Daily Progress Report Details</h2>
                    <span class="close" onclick="closeReportDetails()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="report-details-content">
                        <div class="report-detail-row">
                            <span class="report-detail-label">Date:</span>
                            <span class="report-detail-value">${formatDate(report.date)}</span>
                        </div>
                        <div class="report-detail-row">
                            <span class="report-detail-label">Project:</span>
                            <span class="report-detail-value">${report.projectName}</span>
                        </div>
                        <div class="report-detail-row">
                            <span class="report-detail-label">Crew Type:</span>
                            <span class="report-detail-value">${report.crewDetails.crewType || 'General'}</span>
                        </div>
                        <div class="report-detail-row">
                            <span class="report-detail-label">Workers:</span>
                            <span class="report-detail-value">${report.crewDetails.workers}</span>
                        </div>
                        <div class="report-detail-row">
                            <span class="report-detail-label">Hours Worked:</span>
                            <span class="report-detail-value">${report.crewDetails.hoursWorked}</span>
                        </div>
                        <div class="report-detail-row">
                            <span class="report-detail-label">Tasks Completed:</span>
                            <span class="report-detail-value">
                                ${report.tasksCompleted && report.tasksCompleted.length > 0
                ? `<ul>${report.tasksCompleted.map(task => `<li>${task}</li>`).join('')}</ul>`
                : 'No tasks completed'}
                            </span>
                        </div>
                        <div class="report-detail-row">
                            <span class="report-detail-label">Weather:</span>
                            <span class="report-detail-value">${report.weather.condition}${report.weather.notes ? ` - ${report.weather.notes}` : ''}</span>
                        </div>
                        ${report.notes ? `
                        <div class="report-detail-row">
                            <span class="report-detail-label">Notes:</span>
                            <span class="report-detail-value">${report.notes}</span>
                        </div>
                        ` : ''}
                        <div class="report-detail-row">
                            <span class="report-detail-label">Status:</span>
                            <span class="report-detail-value">
                                <span class="report-status status-${report.status}">
                                    ${report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                </span>
                            </span>
                        </div>
                        ${report.status === 'approved' ? `
                        <div class="report-detail-row">
                            <span class="report-detail-label">Approved By:</span>
                            <span class="report-detail-value">${report.approvedBy || 'N/A'}</span>
                        </div>
                        <div class="report-detail-row">
                            <span class="report-detail-label">Approved At:</span>
                            <span class="report-detail-value">${report.approvedAt ? new Date(report.approvedAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'block';
    }
}

function closeReportDetails() {
    const modal = document.getElementById('reportDetailsModal');
    if (modal) {
        modal.remove();
    }
}

function approveReport(reportId) {
    if (confirm('Are you sure you want to approve this report?')) {
        const approvedReport = dailyReportSystem.approveReport(reportId, 'Supervisor');
        if (approvedReport) {
            loadReportsList();
            showNotification('Report approved successfully!', 'success');
        }
    }
}

function exportReports(format) {
    if (format === 'csv' && dailyReportSystem) {
        const csvContent = dailyReportSystem.exportToCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `daily_reports_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else if (format === 'pdf') {
        alert('PDF export would be implemented here. For now, CSV export is available.');
    }
}

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
        alert(`[${type.toUpperCase()}] ${message}`);
    }
}

// Event Listeners for Daily Reports
document.addEventListener('DOMContentLoaded', function () {
    // Daily Report Form Submission
    const dailyReportForm = document.getElementById('dailyReportForm');
    if (dailyReportForm) {
        dailyReportForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const reportId = document.getElementById('reportId').value;
            const tasksCompleted = document.getElementById('reportTasksCompleted').value
                .split('\n')
                .filter(task => task.trim() !== '');

            const reportData = {
                date: document.getElementById('reportDate').value,
                projectId: parseInt(document.getElementById('reportProject').value),
                projectName: document.getElementById('reportProject').selectedOptions[0]?.text || 'Unknown Project',
                crewType: document.getElementById('reportCrewType').value,
                workers: parseInt(document.getElementById('reportWorkers').value),
                hoursWorked: parseFloat(document.getElementById('reportHoursWorked').value),
                tasksCompleted: tasksCompleted,
                weatherCondition: document.getElementById('reportWeatherCondition').value,
                weatherNotes: document.getElementById('reportWeatherNotes').value,
                notes: document.getElementById('reportNotes').value
            };

            if (dailyReportSystem) {
                if (reportId) {
                    // Update existing report
                    dailyReportSystem.updateReport(parseInt(reportId), reportData);
                } else {
                    // Create new report
                    dailyReportSystem.createReport(reportData);
                }
            }

            // Reset form and close modal
            this.reset();
            document.getElementById('reportId').value = '';
            document.getElementById('reportModalTitle').textContent = 'New Daily Progress Report';

            if (window.app && typeof window.app.hideModal === 'function') {
                window.app.hideModal('dailyReportModal');
            }

            // Refresh reports list
            setTimeout(() => {
                loadReportsList();
            }, 100);

            showNotification('Report saved successfully!', 'success');
        });
    }

    // Cancel button
    const cancelReport = document.getElementById('cancelReport');
    if (cancelReport) {
        cancelReport.addEventListener('click', function () {
            const form = document.getElementById('dailyReportForm');
            if (form) form.reset();
            document.getElementById('reportId').value = '';
            document.getElementById('reportModalTitle').textContent = 'New Daily Progress Report';

            if (window.app && typeof window.app.hideModal === 'function') {
                window.app.hideModal('dailyReportModal');
            }
        });
    }

    // Add Report button
    const addDailyReportBtn = document.getElementById('addDailyReportBtn');
    if (addDailyReportBtn) {
        addDailyReportBtn.addEventListener('click', showDailyReportModal);
    }

    // Filter event listeners
    const projectFilter = document.getElementById('reportProjectFilter');
    const dateFilter = document.getElementById('reportDateFilter');
    const statusFilter = document.getElementById('reportStatusFilter');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');

    if (projectFilter) projectFilter.addEventListener('change', loadReportsList);
    if (dateFilter) dateFilter.addEventListener('change', loadReportsList);
    if (statusFilter) statusFilter.addEventListener('change', loadReportsList);
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function () {
            if (projectFilter) projectFilter.value = '';
            if (dateFilter) dateFilter.value = '';
            if (statusFilter) statusFilter.value = '';
            loadReportsList();
        });
    }

    // Add export buttons after the page loads
    setTimeout(() => {
        const exportButtonsContainer = document.createElement('div');
        exportButtonsContainer.className = 'report-actions';
        exportButtonsContainer.innerHTML = `
            <button class="btn btn-outline" onclick="exportReports('csv')" style="margin-left: 1rem;">
                <i class="fas fa-file-csv"></i> Export CSV
            </button>
            <button class="btn btn-outline" onclick="exportReports('pdf')" style="margin-left: 0.5rem;">
                <i class="fas fa-file-pdf"></i> Export PDF
            </button>
        `;

        // Add export buttons to the page header
        const pageHeader = document.querySelector('#daily-reports .page-header');
        if (pageHeader) {
            pageHeader.appendChild(exportButtonsContainer);
        }
    }, 1000);
});

// Make functions available globally
window.loadDailyReports = loadDailyReports;
window.showDailyReportModal = showDailyReportModal;
window.editReport = editReport;
window.viewReportDetails = viewReportDetails;
window.closeReportDetails = closeReportDetails;
window.approveReport = approveReport;
window.exportReports = exportReports;