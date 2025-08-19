// visual-analytics.js - Visual Intelligence and Trend Analysis

class VisualAnalyticsEngine {
    constructor() {
        this.charts = new Map();
    }

    // Generate trend data for charts
    generateTrendData(projectId = null, days = 30) {
        const reports = JSON.parse(localStorage.getItem('dailyReports') || '[]');

        // Filter reports by project and date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        const filteredReports = reports.filter(report => {
            const reportDate = new Date(report.date);
            const isInRange = reportDate >= startDate && reportDate <= endDate;
            const isCorrectProject = !projectId || report.projectId === projectId;
            return isInRange && isCorrectProject;
        });

        // Group by date
        const dailyData = {};
        filteredReports.forEach(report => {
            const date = report.date;
            if (!dailyData[date]) {
                dailyData[date] = {
                    date: date,
                    manHours: 0,
                    tasksCompleted: 0,
                    workers: 0,
                    incidents: 0,
                    defects: 0
                };
            }

            dailyData[date].manHours += (report.crewDetails.workers || 0) * (report.crewDetails.hoursWorked || 0);
            dailyData[date].tasksCompleted += (report.tasksCompleted || []).length;
            dailyData[date].workers += report.crewDetails.workers || 0;

            // Count incidents and defects from notes
            if (report.notes) {
                if (report.notes.toLowerCase().includes('incident')) {
                    dailyData[date].incidents++;
                }
                if (report.notes.toLowerCase().includes('defect') || report.notes.toLowerCase().includes('rework')) {
                    dailyData[date].defects++;
                }
            }
        });

        // Convert to array and sort by date
        const trendData = Object.values(dailyData);
        trendData.sort((a, b) => new Date(a.date) - new Date(b.date));

        return trendData;
    }

    // Calculate cumulative progress
    calculateCumulativeProgress(projectId = null) {
        const projects = JSON.parse(localStorage.getItem('projects') || '[]');
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

        if (projectId) {
            const project = projects.find(p => p.id === projectId);
            if (project) {
                const projectTasks = tasks.filter(task => task.projectId === projectId);
                const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
                return {
                    projectName: project.name,
                    totalTasks: projectTasks.length,
                    completedTasks: completedTasks,
                    progress: projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0
                };
            }
        } else {
            // Overall progress
            const completedTasks = tasks.filter(task => task.status === 'completed').length;
            return {
                projectName: 'All Projects',
                totalTasks: tasks.length,
                completedTasks: completedTasks,
                progress: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
            };
        }
    }

    // Get resource utilization data
    getResourceUtilizationData(projectId = null, weeks = 12) {
        const reports = JSON.parse(localStorage.getItem('dailyReports') || '[]');

        // Group by week
        const weeklyData = {};

        reports.forEach(report => {
            if (!projectId || report.projectId === projectId) {
                const reportDate = new Date(report.date);
                const weekNumber = this.getWeekNumber(reportDate);
                const year = reportDate.getFullYear();
                const weekKey = `${year}-W${weekNumber}`;

                if (!weeklyData[weekKey]) {
                    weeklyData[weekKey] = {
                        week: weekKey,
                        startDate: this.getWeekStartDate(reportDate),
                        manHours: 0,
                        workers: 0,
                        reports: 0
                    };
                }

                weeklyData[weekKey].manHours += (report.crewDetails.workers || 0) * (report.crewDetails.hoursWorked || 0);
                weeklyData[weekKey].workers += report.crewDetails.workers || 0;
                weeklyData[weekKey].reports++;
            }
        });

        return Object.values(weeklyData).slice(-weeks);
    }

    // Helper function to get week number
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    // Helper function to get week start date
    getWeekStartDate(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(d.setDate(diff));
    }

    // Simple forecasting using linear regression
    forecastTrend(data, periods = 7) {
        if (data.length < 2) return [];

        // Simple linear regression
        const n = data.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

        data.forEach((point, index) => {
            sumX += index;
            sumY += point.value;
            sumXY += index * point.value;
            sumXX += index * index;
        });

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Generate forecast
        const forecast = [];
        for (let i = 0; i < periods; i++) {
            const futureIndex = n + i;
            const forecastedValue = slope * futureIndex + intercept;
            forecast.push({
                date: `Forecast +${i + 1}d`,
                value: Math.max(0, forecastedValue) // Ensure non-negative values
            });
        }

        return forecast;
    }
}

// Initialize the visual analytics engine
const visualAnalytics = new VisualAnalyticsEngine();

// Simple chart rendering functions (no external libraries)
class SimpleChart {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.options = {
            type: 'line',
            data: [],
            labels: [],
            width: this.canvas.width || 400,
            height: this.canvas.height || 300,
            ...options
        };

        // Store reference for updates
        window.chartInstances = window.chartInstances || {};
        window.chartInstances[canvasId] = this;

        this.render();
    }

    render() {
        if (!this.ctx) return;

        const { width, height } = this.options;
        this.canvas.width = width;
        this.canvas.height = height;

        this.ctx.clearRect(0, 0, width, height);

        if (this.options.type === 'line') {
            this.renderLineChart();
        } else if (this.options.type === 'bar') {
            this.renderBarChart();
        } else if (this.options.type === 'pie') {
            this.renderPieChart();
        }
    }

    renderLineChart() {
        const { data, labels, width, height } = this.options;
        if (!data || data.length === 0) return;

        // Calculate chart area
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;

        // Find min and max values
        const values = data.map(d => typeof d === 'object' ? (d.value || 0) : d);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const valueRange = maxValue - minValue || 1; // Avoid division by zero

        // Draw grid lines
        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.lineWidth = 1;

        // Horizontal grid lines
        for (let i = 0; i <= 5; i++) {
            const y = padding + chartHeight - (i * chartHeight / 5);
            this.ctx.beginPath();
            this.ctx.moveTo(padding, y);
            this.ctx.lineTo(padding + chartWidth, y);
            this.ctx.stroke();

            // Y-axis labels
            this.ctx.fillStyle = '#64748b';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'right';
            const value = minValue + (i * valueRange / 5);
            this.ctx.fillText(value.toFixed(0), padding - 10, y + 4);
        }

        // Draw line
        this.ctx.strokeStyle = '#2563eb';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        data.forEach((point, index) => {
            const value = typeof point === 'object' ? (point.value || 0) : point;
            const x = padding + (index * chartWidth / (data.length - 1));
            const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;

            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });

        this.ctx.stroke();

        // Draw points
        this.ctx.fillStyle = '#2563eb';
        data.forEach((point, index) => {
            const value = typeof point === 'object' ? (point.value || 0) : point;
            const x = padding + (index * chartWidth / (data.length - 1));
            const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;

            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, 2 * Math.PI);
            this.ctx.fill();
        });

        // Draw X-axis labels
        this.ctx.fillStyle = '#64748b';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';

        labels.forEach((label, index) => {
            if (index % Math.ceil(labels.length / 5) === 0) { // Show every nth label
                const x = padding + (index * chartWidth / (labels.length - 1));
                const y = padding + chartHeight + 20;
                this.ctx.fillText(label, x, y);
            }
        });
    }

    renderBarChart() {
        const { data, width, height } = this.options;
        if (!data || data.length === 0) return;

        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;

        // Find max value
        const maxValue = Math.max(...data.map(d => typeof d === 'object' ? (d.value || 0) : d)) || 1;

        // Calculate bar width
        const barWidth = chartWidth / data.length * 0.8;
        const barSpacing = chartWidth / data.length * 0.2;

        // Draw bars
        data.forEach((point, index) => {
            const value = typeof point === 'object' ? (point.value || 0) : point;
            const label = typeof point === 'object' ? (point.label || '') : '';
            const color = typeof point === 'object' ? (point.color || '#2563eb') : '#2563eb';

            const x = padding + index * (barWidth + barSpacing);
            const barHeight = (value / maxValue) * chartHeight;
            const y = padding + chartHeight - barHeight;

            // Bar
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, barWidth, barHeight);

            // Label
            this.ctx.fillStyle = '#64748b';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(label, x + barWidth / 2, height - 10);

            // Value
            this.ctx.fillStyle = '#1e293b';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(value.toString(), x + barWidth / 2, y - 5);
        });
    }

    renderPieChart() {
        const { data, width, height } = this.options;
        if (!data || data.length === 0) return;

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 3;

        // Calculate total
        const total = data.reduce((sum, point) => sum + (typeof point === 'object' ? (point.value || 0) : point), 0);
        if (total === 0) return;

        // Draw pie slices
        let startAngle = 0;

        data.forEach((point, index) => {
            const value = typeof point === 'object' ? (point.value || 0) : point;
            const label = typeof point === 'object' ? (point.label || '') : '';
            const color = typeof point === 'object' ? (point.color || this.getDefaultColor(index)) : this.getDefaultColor(index);

            const sliceAngle = (value / total) * 2 * Math.PI;
            const endAngle = startAngle + sliceAngle;

            // Draw slice
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.closePath();
            this.ctx.fill();

            // Draw label
            const midAngle = startAngle + sliceAngle / 2;
            const labelX = centerX + (radius + 20) * Math.cos(midAngle);
            const labelY = centerY + (radius + 20) * Math.sin(midAngle);

            this.ctx.fillStyle = '#1e293b';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${label}: ${value}`, labelX, labelY);

            startAngle = endAngle;
        });
    }

    getDefaultColor(index) {
        const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
        return colors[index % colors.length];
    }

    // Add the missing updateData method
    updateData(newData, newLabels = []) {
        this.options.data = newData;
        if (newLabels.length > 0) {
            this.options.labels = newLabels;
        }
        this.render();
    }

    // Add method to update options
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        this.render();
    }
}
// Add helper function to get or create chart
function getOrCreateChart(canvasId, options) {
    if (window.chartInstances && window.chartInstances[canvasId]) {
        return window.chartInstances[canvasId];
    }
    return new SimpleChart(canvasId, options);
}
// Visual Analytics Functions
function loadVisualAnalytics() {
    loadVisualAnalyticsFilters();
    renderAllCharts();
}

function loadVisualAnalyticsFilters() {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const projectFilter = document.getElementById('visualProjectFilter');

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

function renderAllCharts() {
    const projectId = document.getElementById('visualProjectFilter')?.value;
    const projectIdNum = projectId ? parseInt(projectId) : null;

    renderProductivityTrend(projectIdNum);
    renderSafetyTrend(projectIdNum);
    renderResourceUtilization(projectIdNum);
    renderProgressChart(projectIdNum);
}

function renderProductivityTrend(projectId = null) {
    const trendData = visualAnalytics.generateTrendData(projectId, 30);

    // Prepare data for chart
    const chartData = trendData.map(point => ({
        date: formatDate(point.date),
        value: point.manHours > 0 ? (point.tasksCompleted / point.manHours * 100) : 0
    }));

    const labels = trendData.map(point => formatDate(point.date, 'short'));

    // Create or update chart
    window.productivityChart = getOrCreateChart('productivityChart', {
        type: 'line',
        data: chartData,
        labels: labels,
        width: 500,
        height: 300
    });
}

function renderSafetyTrend(projectId = null) {
    const trendData = visualAnalytics.generateTrendData(projectId, 30);

    // Prepare data for chart
    const chartData = trendData.map(point => ({
        date: formatDate(point.date),
        value: point.incidents
    }));

    const labels = trendData.map(point => formatDate(point.date, 'short'));

    // Create or update chart
    window.safetyChart = getOrCreateChart('safetyChart', {
        type: 'line',
        data: chartData,
        labels: labels,
        width: 500,
        height: 300
    });
}

function renderResourceUtilization(projectId = null) {
    const utilizationData = visualAnalytics.getResourceUtilizationData(projectId, 12);

    // Prepare data for chart
    const chartData = utilizationData.map(point => ({
        label: point.week,
        value: point.manHours,
        color: '#2563eb'
    }));

    // Create or update chart
    window.resourceChart = getOrCreateChart('resourceChart', {
        type: 'bar',
        data: chartData,
        width: 500,
        height: 300
    });
}

function renderProgressChart(projectId = null) {
    const progressData = visualAnalytics.calculateCumulativeProgress(projectId);

    // Prepare data for pie chart
    const chartData = [
        {
            label: 'Completed',
            value: progressData.completedTasks,
            color: '#10b981'
        },
        {
            label: 'Remaining',
            value: progressData.totalTasks - progressData.completedTasks,
            color: '#ef4444'
        }
    ];

    // Create or update chart
    window.progressChart = getOrCreateChart('progressChart', {
        type: 'pie',
        data: chartData,
        width: 400,
        height: 300
    });

    // Update progress text
    const progressText = document.getElementById('progressText');
    if (progressText) {
        progressText.innerHTML = `
            <h3>${progressData.projectName} Progress</h3>
            <p><strong>Total Tasks:</strong> ${progressData.totalTasks}</p>
            <p><strong>Completed:</strong> ${progressData.completedTasks}</p>
            <p><strong>Progress:</strong> ${progressData.progress}%</p>
            <div class="progress-bar-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressData.progress}%; background: ${progressData.progress > 80 ? '#10b981' : progressData.progress > 50 ? '#f59e0b' : '#ef4444'}"></div>
                </div>
                <span>${progressData.progress}%</span>
            </div>
        `;
    }
}
// Enhanced chart update functions with error handling
function updateChartSafely(chart, newData, newLabels = []) {
    try {
        if (chart && typeof chart.updateData === 'function') {
            chart.updateData(newData, newLabels);
        } else if (chart) {
            // Recreate chart if update method is missing
            console.warn('Chart update method missing, recreating chart');
            // Chart recreation logic would go here
        }
    } catch (error) {
        console.error('Error updating chart:', error);
    }
}
function formatDate(dateString, format = 'full') {
    if (!dateString) return 'No date';
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
    const projectFilter = document.getElementById('visualProjectFilter');
    if (projectFilter) {
        projectFilter.addEventListener('change', renderAllCharts);
    }
});

// Make functions available globally
window.loadVisualAnalytics = loadVisualAnalytics;
window.renderAllCharts = renderAllCharts;