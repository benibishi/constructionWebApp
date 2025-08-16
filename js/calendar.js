// Calendar Management Module

// Global variables
let currentDate = new Date();
let currentView = 'month';

// Initialize calendar
function initCalendar() {
    loadCalendarFilters();
    renderCalendar();
    setupCalendarEvents();
}

// Load calendar filters
function loadCalendarFilters() {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const projectFilter = document.getElementById('calendarProjectFilter');

    if (projectFilter) {
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
}

// Render calendar based on current view
function renderCalendar() {
    const viewFilter = document.getElementById('calendarViewFilter');
    if (viewFilter) {
        currentView = viewFilter.value;
    }

    switch (currentView) {
        case 'month':
            renderMonthView();
            break;
        case 'week':
            renderWeekView();
            break;
        case 'timeline':
            renderTimelineView();
            break;
        default:
            renderMonthView();
    }
}

// Render month view
function renderMonthView() {
    const calendarView = document.getElementById('calendarView');
    const timelineView = document.getElementById('timelineView');

    if (calendarView) {
        calendarView.style.display = 'block';
        calendarView.innerHTML = generateMonthCalendar(currentDate);
    }

    if (timelineView) {
        timelineView.style.display = 'none';
    }
}

// Render week view
function renderWeekView() {
    const calendarView = document.getElementById('calendarView');
    const timelineView = document.getElementById('timelineView');

    if (calendarView) {
        calendarView.style.display = 'block';
        calendarView.innerHTML = generateWeekCalendar(currentDate);
    }

    if (timelineView) {
        timelineView.style.display = 'none';
    }
}

// Render timeline view
function renderTimelineView() {
    const calendarView = document.getElementById('calendarView');
    const timelineView = document.getElementById('timelineView');

    if (calendarView) {
        calendarView.style.display = 'none';
    }

    if (timelineView) {
        timelineView.style.display = 'block';
        timelineView.innerHTML = generateTimelineView();
    }
}

// Generate month calendar HTML
function generateMonthCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();

    // Get number of days in month
    const daysInMonth = lastDay.getDate();

    // Create calendar header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Update current month/year display
    const monthYearElement = document.getElementById('currentMonthYear');
    if (monthYearElement) {
        monthYearElement.textContent = `${monthNames[month]} ${year}`;
    }

    let html = `
        <table class="month-calendar">
            <thead>
                <tr>
                    ${dayNames.map(day => `<th>${day}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
    `;

    // Create calendar grid
    let dayCount = 1;
    let nextMonthDay = 1;

    for (let week = 0; week < 6; week++) {
        html += '<tr>';

        for (let day = 0; day < 7; day++) {
            let cellDate;
            let isCurrentMonth = true;
            let dayClass = 'calendar-day';

            if (week === 0 && day < firstDayOfWeek) {
                // Previous month days
                const prevMonth = month === 0 ? 11 : month - 1;
                const prevYear = month === 0 ? year - 1 : year;
                const prevMonthLastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
                const prevDay = prevMonthLastDay - firstDayOfWeek + day + 1;
                cellDate = new Date(prevYear, prevMonth, prevDay);
                isCurrentMonth = false;
                dayClass += ' other-month';
            } else if (dayCount > daysInMonth) {
                // Next month days
                const nextMonth = month === 11 ? 0 : month + 1;
                const nextYear = month === 11 ? year + 1 : year;
                cellDate = new Date(nextYear, nextMonth, nextMonthDay);
                isCurrentMonth = false;
                dayClass += ' other-month';
                nextMonthDay++;
            } else {
                // Current month days
                cellDate = new Date(year, month, dayCount);
                if (isToday(cellDate)) {
                    dayClass += ' today';
                }
                dayCount++;
            }

            // Get tasks for this date
            const tasks = getTasksForDate(cellDate);

            html += `
                <td>
                    <div class="${dayClass}">${cellDate.getDate()}</div>
                    <div class="calendar-tasks">
                        ${tasks.slice(0, 3).map(task => `
                            <div class="calendar-task ${task.priority}" 
                                 onclick="viewTaskFromCalendar(${task.id})" 
                                 title="${task.name}">
                                ${task.name}
                            </div>
                        `).join('')}
                        ${tasks.length > 3 ? `<div class="calendar-task">+${tasks.length - 3} more</div>` : ''}
                    </div>
                </td>
            `;
        }

        html += '</tr>';

        // Break if we've shown all days of the month
        if (dayCount > daysInMonth && nextMonthDay > 7) {
            break;
        }
    }

    html += `
            </tbody>
        </table>
    `;

    return html;
}

// Generate week calendar HTML
function generateWeekCalendar(date) {
    const startDate = getStartOfWeek(date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

    let html = `
        <div class="week-calendar">
            <div class="week-header"></div>
            ${dayNames.map((day, index) => {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + index);
        return `<div class="week-day-header">${day}<br>${dayDate.getDate()}/${dayDate.getMonth() + 1}</div>`;
    }).join('')}
    `;

    // Generate hours and tasks
    hours.forEach(hour => {
        html += `<div class="week-hour">${hour}:00</div>`;
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(startDate);
            dayDate.setDate(startDate.getDate() + i);
            html += `<div class="week-day-cell" data-date="${formatDateForInput(dayDate)}" data-hour="${hour}"></div>`;
        }
    });

    html += `</div>`;

    return html;
}

// Generate timeline view HTML
function generateTimelineView() {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const projectFilter = document.getElementById('calendarProjectFilter')?.value;

    // Filter projects if needed
    let filteredProjects = projects;
    if (projectFilter) {
        filteredProjects = projects.filter(p => p.id == projectFilter);
    }

    if (filteredProjects.length === 0) {
        return `
            <div class="empty-state-calendar">
                <i class="fas fa-calendar-alt"></i>
                <h3>No Projects Found</h3>
                <p>Select a different project filter or create new projects.</p>
            </div>
        `;
    }

    // Generate timeline for the next 12 weeks
    const today = new Date();
    const weeks = [];
    for (let i = 0; i < 12; i++) {
        const weekDate = new Date(today);
        weekDate.setDate(today.getDate() + (i * 7));
        weeks.push(weekDate);
    }

    let html = `
        <div class="timeline-container">
            <div class="timeline-header">
                <div class="timeline-project-header">Project</div>
                <div class="timeline-weeks">
                    ${weeks.map(week => `
                        <div class="timeline-week">
                            Week ${getWeekNumber(week)}<br>
                            ${week.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="timeline-rows">
    `;

    filteredProjects.forEach(project => {
        const projectTasks = tasks.filter(task => task.projectId === project.id);

        html += `
            <div class="timeline-row">
                <div class="timeline-project" title="${project.name}">
                    ${project.name}
                </div>
                <div class="timeline-tasks">
                    ${projectTasks.map(task => {
            const startDate = new Date(task.dueDate);
            const weekIndex = weeks.findIndex(week =>
                startDate >= week && startDate < new Date(week.getTime() + 7 * 24 * 60 * 60 * 1000)
            );

            if (weekIndex === -1) return '';

            const left = (weekIndex * (100 / 12));
            const width = (100 / 12);

            return `
                            <div class="timeline-bar ${task.priority} ${task.status === 'completed' ? 'completed' : ''}" 
                                 style="left: ${left}%; width: ${width}%;" 
                                 onclick="viewTaskFromCalendar(${task.id})"
                                 title="${task.name} - Due: ${formatDisplayDate(task.dueDate)}">
                                ${task.name}
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    return html;
}

// Get tasks for a specific date
function getTasksForDate(date) {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const projectFilter = document.getElementById('calendarProjectFilter')?.value;

    const dateString = formatDateForInput(date);

    let filteredTasks = tasks.filter(task => task.dueDate === dateString);

    // Apply project filter
    if (projectFilter) {
        filteredTasks = filteredTasks.filter(task => task.projectId == projectFilter);
    }

    return filteredTasks;
}

// Get start of week (Sunday)
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
}

// Format date for input comparison
function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

// Format date for display
function formatDisplayDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Check if date is today
function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
}

// Get week number
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Navigation functions
function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

function goToToday() {
    currentDate = new Date();
    renderCalendar();
}

// View task from calendar
function viewTaskFromCalendar(taskId) {
    // Check if viewTaskDetails function exists
    if (typeof window.viewTaskDetails === 'function') {
        window.viewTaskDetails(taskId);
    } else {
        alert(`View task details for task ID: ${taskId}\nIn a real application, this would open the task details modal.`);
    }
}

// Setup calendar events
function setupCalendarEvents() {
    // Navigation buttons
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    const todayBtn = document.getElementById('todayBtn');
    const viewFilter = document.getElementById('calendarViewFilter');
    const projectFilter = document.getElementById('calendarProjectFilter');

    if (prevBtn) prevBtn.addEventListener('click', prevMonth);
    if (nextBtn) nextBtn.addEventListener('click', nextMonth);
    if (todayBtn) todayBtn.addEventListener('click', goToToday);
    if (viewFilter) viewFilter.addEventListener('change', renderCalendar);
    if (projectFilter) projectFilter.addEventListener('change', renderCalendar);
}

// Load calendar function
function loadCalendar() {
    currentDate = new Date();
    initCalendar();
}

// Export function for global access
window.loadCalendar = loadCalendar;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Set up calendar if on calendar page
    if (document.getElementById('calendar')) {
        loadCalendar();
    }
});