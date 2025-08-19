// weekly-analytics.js - Enhanced to use daily reports

class WeeklyAnalyticsEngine {
    constructor() {
        this.cache = new Map();
    }

    // Get all daily reports for a specific week
    getWeeklyDailyReports(weekStartDate, projectId = null) {
        const startDate = new Date(weekStartDate);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);

        const allReports = JSON.parse(localStorage.getItem('dailyReports') || '[]');
        return allReports.filter(report => {
            const reportDate = new Date(report.date);
            return reportDate >= startDate && reportDate <= endDate &&
                (!projectId || report.projectId == projectId);
        });
    }

    // Aggregate daily reports into weekly summary
    generateWeeklyFromDaily(weekStartDate, projectId = null) {
        const dailyReports = this.getWeeklyDailyReports(weekStartDate, projectId);

        if (dailyReports.length === 0) {
            return {
                week: weekStartDate,
                totalReports: 0,
                metrics: {
                    productivity: { totalManHours: 0, tasksCompleted: 0, productivityRate: 0 },
                    safety: { incidents: 0, incidentRate: 0 },
                    quality: { defectsFound: 0, qualityScore: 100 }
                },
                highlights: [],
                recommendations: []
            };
        }

        // Aggregate data from daily reports
        let totalManHours = 0;
        let totalTasksCompleted = 0;
        let totalWorkers = 0;
        let totalIncidents = 0;
        let totalDefects = 0;

        dailyReports.forEach(report => {
            totalManHours += (report.crewDetails.workers || 0) * (report.crewDetails.hoursWorked || 0);
            totalTasksCompleted += (report.tasksCompleted || []).length;
            totalWorkers += report.crewDetails.workers || 0;

            // Parse incidents and defects from notes
            if (report.notes) {
                const notes = report.notes.toLowerCase();
                if (notes.includes('incident')) totalIncidents++;
                if (notes.includes('defect') || notes.includes('rework')) totalDefects++;
            }
        });

        // Calculate metrics
        const productivityRate = totalManHours > 0 ? (totalTasksCompleted / totalManHours).toFixed(2) : 0;
        const incidentRate = totalManHours > 0 ? ((totalIncidents / totalManHours) * 200000).toFixed(2) : 0;
        const qualityScore = totalTasksCompleted > 0 ? (100 - ((totalDefects / totalTasksCompleted) * 100)).toFixed(1) : 100;

        // Generate highlights
        const highlights = [];
        if (totalIncidents === 0) {
            highlights.push({
                type: 'positive',
                message: 'Zero safety incidents this week'
            });
        }
        if (qualityScore > 95) {
            highlights.push({
                type: 'positive',
                message: `Excellent quality score: ${qualityScore}%`
            });
        }

        // Generate recommendations
        const recommendations = [];
        if (productivityRate < 0.3) {
            recommendations.push({
                priority: 'high',
                message: 'Consider reviewing crew allocation and task assignments'
            });
        }

        return {
            week: weekStartDate,
            startDate: weekStartDate,
            endDate: new Date(new Date(weekStartDate).setDate(new Date(weekStartDate).getDate() + 6)).toISOString().split('T')[0],
            totalReports: dailyReports.length,
            totalDaysReported: new Set(dailyReports.map(r => r.date)).size,
            metrics: {
                productivity: {
                    totalManHours: totalManHours,
                    tasksCompleted: totalTasksCompleted,
                    productivityRate: parseFloat(productivityRate)
                },
                safety: {
                    incidents: totalIncidents,
                    incidentRate: parseFloat(incidentRate)
                },
                quality: {
                    defectsFound: totalDefects,
                    qualityScore: parseFloat(qualityScore)
                }
            },
            highlights: highlights,
            recommendations: recommendations,
            dailyReports: dailyReports // Include the source daily reports
        };
    }

    // Compare with previous week for trends
    getWeeklyTrends(weekStartDate, projectId = null) {
        const currentWeek = this.generateWeeklyFromDaily(weekStartDate, projectId);

        // Get previous week data
        const prevWeekDate = new Date(weekStartDate);
        prevWeekDate.setDate(prevWeekDate.getDate() - 7);
        const previousWeek = this.generateWeeklyFromDaily(prevWeekDate.toISOString().split('T')[0], projectId);

        return {
            current: currentWeek,
            previous: previousWeek,
            trends: {
                productivity: this.calculateTrend(
                    previousWeek.metrics.productivity.productivityRate,
                    currentWeek.metrics.productivity.productivityRate
                ),
                safety: this.calculateTrend(
                    previousWeek.metrics.safety.incidents,
                    currentWeek.metrics.safety.incidents,
                    true // Lower is better for safety
                ),
                quality: this.calculateTrend(
                    previousWeek.metrics.quality.qualityScore,
                    currentWeek.metrics.quality.qualityScore
                )
            }
        };
    }

    calculateTrend(previous, current, lowerIsBetter = false) {
        if (previous === 0 && current === 0) return 'stable';
        if (previous === 0) return current > 0 ? (lowerIsBetter ? 'worsening' : 'improving') : (lowerIsBetter ? 'improving' : 'worsening');

        const change = ((current - previous) / previous) * 100;
        if (Math.abs(change) < 5) return 'stable';

        const isImproving = lowerIsBetter ? change < 0 : change > 0;
        return isImproving ? 'improving' : 'declining';
    }
}

// Initialize the analytics engine
const weeklyAnalytics = new WeeklyAnalyticsEngine();

// Enhanced Weekly Reports Functions
function loadWeeklyReports() {
    loadWeeklyReportFilters();
    loadWeeklyReportsList();
}

function loadWeeklyReportFilters() {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const projectFilter = document.getElementById('weeklyProjectFilter');

    if (projectFilter) {
        projectFilter.innerHTML = '<option value="">All Projects</option>';
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectFilter.appendChild(option);
        });
    }
}

function loadWeeklyReportsList() {
    const projectId = document.getElementById('weeklyProjectFilter')?.value;
    const projectIdNum = projectId ? parseInt(projectId) : null;
    const weeks = generateLastFewWeeks(4); // Last 4 weeks

    const container = document.getElementById('weeklyReportsContainer');
    if (!container) return;

    container.innerHTML = weeks.map(week => {
        const weeklyData = weeklyAnalytics.generateWeeklyFromDaily(week.startDate, projectIdNum);
        const trends = weeklyAnalytics.getWeeklyTrends(week.startDate, projectIdNum);
        return generateWeeklyReportCard(weeklyData, trends);
    }).join('');
}

function generateLastFewWeeks(count) {
    const weeks = [];
    const today = new Date();

    for (let i = 0; i < count; i++) {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1) - (i * 7));
        weeks.push({
            startDate: weekStart.toISOString().split('T')[0],
            weekNumber: getWeekNumber(weekStart)
        });
    }

    return weeks;
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function generateWeeklyReportCard(weeklyData, trends) {
    const productivity = weeklyData.metrics.productivity;
    const safety = weeklyData.metrics.safety;
    const quality = weeklyData.metrics.quality;

    return `
        <div class="weekly-report-card" data-week="${weeklyData.week}" data-reports="${weeklyData.totalReports}">
            <div class="weekly-report-header">
                <h3>Week of ${formatDate(weeklyData.startDate)}</h3>
                <span class="week-range">${formatDate(weeklyData.startDate)} - ${formatDate(weeklyData.endDate)}</span>
                <span class="report-count">${weeklyData.totalReports} daily reports</span>
            </div>
            
            <div class="weekly-summary-stats">
                <div class="stat-item">
                    <span class="stat-label">Man-hours</span>
                    <span class="stat-value">${productivity.totalManHours}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Tasks Completed</span>
                    <span class="stat-value">${productivity.tasksCompleted}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Days Reported</span>
                    <span class="stat-value">${weeklyData.totalDaysReported}/7</span>
                </div>
            </div>
            
            <div class="weekly-metrics-grid">
                <div class="metric-card">
                    <div class="metric-icon bg-blue">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="metric-content">
                        <div class="metric-value">${productivity.productivityRate}</div>
                        <div class="metric-label">Tasks/Man-hour</div>
                        <div class="metric-trend ${getTrendClass(trends.trends.productivity)}">
                            <i class="fas ${getTrendIcon(trends.trends.productivity)}"></i>
                            ${trends.trends.productivity}
                        </div>
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-icon bg-green">
                        <i class="fas fa-hard-hat"></i>
                    </div>
                    <div class="metric-content">
                        <div class="metric-value">${safety.incidents}</div>
                        <div class="metric-label">Safety Incidents</div>
                        <div class="metric-trend ${getTrendClass(trends.trends.safety, true)}">
                            <i class="fas ${getTrendIcon(trends.trends.safety, true)}"></i>
                            ${trends.trends.safety}
                        </div>
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-icon bg-purple">
                        <i class="fas fa-clipboard-check"></i>
                    </div>
                    <div class="metric-content">
                        <div class="metric-value">${quality.qualityScore}%</div>
                        <div class="metric-label">Quality Score</div>
                        <div class="metric-trend ${getTrendClass(trends.trends.quality)}">
                            <i class="fas ${getTrendIcon(trends.trends.quality)}"></i>
                            ${trends.trends.quality}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="weekly-highlights">
                <h4><i class="fas fa-star"></i> Highlights</h4>
                ${weeklyData.highlights.length > 0 ? `
                    <ul>
                        ${weeklyData.highlights.slice(0, 3).map(highlight => `
                            <li class="${highlight.type}">
                                <i class="fas ${highlight.type === 'positive' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
                                ${highlight.message}
                            </li>
                        `).join('')}
                    </ul>
                ` : `
                    <p class="no-highlights">No significant highlights this week</p>
                `}
            </div>
            
            <div class="weekly-actions">
                <button class="btn btn-outline" onclick="viewWeeklyReportDetails('${weeklyData.startDate}', ${weeklyData.projectId || 'null'})">
                    <i class="fas fa-file-alt"></i> View Full Report
                </button>
                <button class="btn btn-outline" onclick="viewDailyReportsForWeek('${weeklyData.startDate}', ${weeklyData.projectId || 'null'})">
                    <i class="fas fa-list"></i> Daily Reports (${weeklyData.totalReports})
                </button>
                <button class="btn btn-primary" onclick="exportWeeklyReport('${weeklyData.startDate}', ${weeklyData.projectId || 'null'})">
                    <i class="fas fa-download"></i> Export
                </button>
            </div>
        </div>
    `;
}

function getTrendClass(trend, inverse = false) {
    if (trend === 'improving') return inverse ? 'negative' : 'positive';
    if (trend === 'declining') return inverse ? 'positive' : 'negative';
    return 'neutral';
}

function getTrendIcon(trend, inverse = false) {
    if (trend === 'improving') return inverse ? 'fa-arrow-down' : 'fa-arrow-up';
    if (trend === 'declining') return inverse ? 'fa-arrow-up' : 'fa-arrow-down';
    return 'fa-equals';
}

function viewWeeklyReportDetails(weekStartDate, projectId) {
    const weeklyData = weeklyAnalytics.generateWeeklyFromDaily(weekStartDate, projectId);
    const trends = weeklyAnalytics.getWeeklyTrends(weekStartDate, projectId);
    showWeeklyReportModal(weeklyData, trends);
}

function viewDailyReportsForWeek(weekStartDate, projectId) {
    const dailyReports = weeklyAnalytics.getWeeklyDailyReports(weekStartDate, projectId);

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'dailyReportsForWeekModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Daily Reports for Week of ${formatDate(weekStartDate)}</h2>
                <span class="close" onclick="closeDailyReportsForWeek()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="daily-reports-list">
                    ${dailyReports.length > 0 ? `
                        ${dailyReports.map(report => `
                            <div class="daily-report-summary">
                                <div class="report-header">
                                    <h4>${formatDate(report.date)} - ${report.projectName}</h4>
                                    <span class="report-status status-${report.status}">${report.status}</span>
                                </div>
                                <div class="report-details">
                                    <p><strong>Crew:</strong> ${report.crewDetails.workers} workers, ${report.crewDetails.hoursWorked} hours</p>
                                    <p><strong>Tasks Completed:</strong> ${(report.tasksCompleted || []).length}</p>
                                    ${report.notes ? `<p><strong>Notes:</strong> ${report.notes}</p>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    ` : `
                        <div class="empty-state">
                            <i class="fas fa-clipboard-list"></i>
                            <h3>No Daily Reports Found</h3>
                            <p>No daily reports were submitted for this week.</p>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function closeDailyReportsForWeek() {
    const modal = document.getElementById('dailyReportsForWeekModal');
    if (modal) {
        modal.remove();
    }
}

function showWeeklyReportModal(weeklyData, trends) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'weeklyReportDetailsModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Weekly Intelligence Report</h2>
                <span class="close" onclick="closeWeeklyReportDetails()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="weekly-report-details">
                    <div class="report-header-section">
                        <h3>Week of ${formatDate(weeklyData.startDate)}</h3>
                        <p>${formatDate(weeklyData.startDate)} - ${formatDate(weeklyData.endDate)}</p>
                        <p><strong>Project:</strong> ${weeklyData.projectId ? getProjectName(weeklyData.projectId) : 'All Projects'}</p>
                        <p><strong>Daily Reports:</strong> ${weeklyData.totalReports} (${weeklyData.totalDaysReported}/7 days)</p>
                    </div>
                    
                    <div class="trend-comparison">
                        <h4><i class="fas fa-balance-scale"></i> Week-over-Week Comparison</h4>
                        <div class="trend-grid">
                            <div class="trend-item">
                                <h5>Productivity</h5>
                                <p>Current: ${weeklyData.metrics.productivity.productivityRate} tasks/man-hour</p>
                                <p>Previous: ${trends.previous.metrics.productivity.productivityRate}</p>
                                <span class="trend-indicator ${getTrendClass(trends.trends.productivity)}">
                                    <i class="fas ${getTrendIcon(trends.trends.productivity)}"></i>
                                    ${trends.trends.productivity}
                                </span>
                            </div>
                            <div class="trend-item">
                                <h5>Safety</h5>
                                <p>Current: ${weeklyData.metrics.safety.incidents} incidents</p>
                                <p>Previous: ${trends.previous.metrics.safety.incidents} incidents</p>
                                <span class="trend-indicator ${getTrendClass(trends.trends.safety, true)}">
                                    <i class="fas ${getTrendIcon(trends.trends.safety, true)}"></i>
                                    ${trends.trends.safety}
                                </span>
                            </div>
                            <div class="trend-item">
                                <h5>Quality</h5>
                                <p>Current: ${weeklyData.metrics.quality.qualityScore}%</p>
                                <p>Previous: ${trends.previous.metrics.quality.qualityScore}%</p>
                                <span class="trend-indicator ${getTrendClass(trends.trends.quality)}">
                                    <i class="fas ${getTrendIcon(trends.trends.quality)}"></i>
                                    ${trends.trends.quality}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detailed-metrics">
                        <h4><i class="fas fa-chart-bar"></i> Detailed Metrics</h4>
                        <div class="metric-detail-grid">
                            <div class="metric-detail">
                                <h5>Productivity</h5>
                                <p><strong>Total Man-hours:</strong> ${weeklyData.metrics.productivity.totalManHours}</p>
                                <p><strong>Tasks Completed:</strong> ${weeklyData.metrics.productivity.tasksCompleted}</p>
                                <p><strong>Productivity Rate:</strong> ${weeklyData.metrics.productivity.productivityRate} tasks/man-hour</p>
                            </div>
                            
                            <div class="metric-detail">
                                <h5>Safety</h5>
                                <p><strong>Incidents:</strong> ${weeklyData.metrics.safety.incidents}</p>
                                <p><strong>Incident Rate:</strong> ${weeklyData.metrics.safety.incidentRate} per 200K hours</p>
                            </div>
                            
                            <div class="metric-detail">
                                <h5>Quality</h5>
                                <p><strong>Defects Found:</strong> ${weeklyData.metrics.quality.defectsFound}</p>
                                <p><strong>Quality Score:</strong> ${weeklyData.metrics.quality.qualityScore}%</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="highlights-section">
                        <h4><i class="fas fa-star"></i> Key Highlights</h4>
                        ${weeklyData.highlights.length > 0 ? `
                            <ul>
                                ${weeklyData.highlights.map(highlight => `
                                    <li class="${highlight.type}">
                                        <i class="fas ${highlight.type === 'positive' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
                                        ${highlight.message}
                                    </li>
                                `).join('')}
                            </ul>
                        ` : `
                            <p>No significant highlights this week</p>
                        `}
                    </div>
                    
                    <div class="recommendations-section">
                        <h4><i class="fas fa-lightbulb"></i> Recommendations</h4>
                        ${weeklyData.recommendations.length > 0 ? `
                            <ul>
                                ${weeklyData.recommendations.map(rec => `
                                    <li class="priority-${rec.priority}">
                                        <strong>${rec.priority.toUpperCase()}:</strong> ${rec.message}
                                    </li>
                                `).join('')}
                            </ul>
                        ` : `
                            <p>No specific recommendations at this time</p>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function closeWeeklyReportDetails() {
    const modal = document.getElementById('weeklyReportDetailsModal');
    if (modal) {
        modal.remove();
    }
}

function exportWeeklyReport(weekStartDate, projectId) {
    const weeklyData = weeklyAnalytics.generateWeeklyFromDaily(weekStartDate, projectId);

    // CSV export
    const csvContent = `
Weekly Intelligence Report
Week: ${formatDate(weeklyData.startDate)} - ${formatDate(weeklyData.endDate)}
Project: ${weeklyData.projectId ? getProjectName(weeklyData.projectId) : 'All Projects'}
Daily Reports: ${weeklyData.totalReports} (${weeklyData.totalDaysReported}/7 days)

Summary Metrics:
Total Man-hours,${weeklyData.metrics.productivity.totalManHours}
Tasks Completed,${weeklyData.metrics.productivity.tasksCompleted}
Productivity Rate,${weeklyData.metrics.productivity.productivityRate} tasks/man-hour
Safety Incidents,${weeklyData.metrics.safety.incidents}
Incident Rate,${weeklyData.metrics.safety.incidentRate} per 200K hours
Quality Score,${weeklyData.metrics.quality.qualityScore}%
Defects Found,${weeklyData.metrics.quality.defectsFound}

Highlights:
${weeklyData.highlights.map(h => h.message).join('\n')}

Recommendations:
${weeklyData.recommendations.map(r => `${r.priority.toUpperCase()}: ${r.message}`).join('\n')}
    `.trim();

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `weekly_report_${weekStartDate.replace(/-/g, '')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function getProjectName(projectId) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'All Projects';
}

function formatDate(dateString, format = 'full') {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);

    if (format === 'short') {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    }

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function () {
    // Filter event listeners
    const projectFilter = document.getElementById('weeklyProjectFilter');
    if (projectFilter) {
        projectFilter.addEventListener('change', loadWeeklyReportsList);
    }
});

// Make functions available globally
window.loadWeeklyReports = loadWeeklyReports;
window.viewWeeklyReportDetails = viewWeeklyReportDetails;
window.viewDailyReportsForWeek = viewDailyReportsForWeek;
window.closeWeeklyReportDetails = closeWeeklyReportDetails;
window.closeDailyReportsForWeek = closeDailyReportsForWeek;
window.exportWeeklyReport = exportWeeklyReport;