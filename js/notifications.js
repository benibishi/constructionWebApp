// Notifications System

// Initialize notifications system
function initNotifications() {
    loadNotifications();
    setupNotificationEvents();
}

// Load and display notifications
function loadNotifications() {
    try {
        const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        const unreadCount = notifications.filter(n => !n.read).length;

        // Update notification count badge
        const countElement = document.getElementById('notificationCount');
        if (countElement) {
            countElement.textContent = unreadCount;
            countElement.style.display = unreadCount > 0 ? 'flex' : 'none';
        }

        // Load notifications in dropdown
        loadNotificationDropdown(notifications);
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Load notifications in dropdown
function loadNotificationDropdown(notifications) {
    const container = document.getElementById('notificationList');
    if (!container) return;

    const unreadNotifications = notifications.filter(n => !n.read);
    const readNotifications = notifications.filter(n => n.read);

    // Show up to 5 notifications (3 unread + 2 read)
    const displayNotifications = [
        ...unreadNotifications.slice(0, 3),
        ...readNotifications.slice(0, 2)
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (displayNotifications.length === 0) {
        container.innerHTML = `
            <div class="notification-item">
                <div class="notification-content">
                    <div class="notification-text">
                        <p>No notifications</p>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = displayNotifications.map(notification => {
        const iconClass = getNotificationIconClass(notification.type);
        const timeAgo = getTimeAgo(notification.timestamp);

        return `
            <div class="notification-item ${notification.read ? '' : 'unread'}" 
                 onclick="handleNotificationClick(${notification.id}, ${notification.taskId || 'null'})">
                <div class="notification-content">
                    <div class="notification-icon ${iconClass}">
                        <i class="fas ${getNotificationIcon(notification.type)}"></i>
                    </div>
                    <div class="notification-text">
                        <h4>${notification.message}</h4>
                        <div class="notification-meta">
                            <span>${timeAgo}</span>
                            <span class="${getPriorityClass(notification.priority)}">${notification.priority}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Get icon class based on notification type
function getNotificationIconClass(type) {
    const classes = {
        'task-due': 'icon-task-due',
        'task-completed': 'icon-task-completed',
        'task-assigned': 'icon-task-assigned',
        'project': 'icon-project'
    };
    return classes[type] || 'icon-task-assigned';
}

// Get icon based on notification type
function getNotificationIcon(type) {
    const icons = {
        'task-due': 'fa-exclamation-circle',
        'task-completed': 'fa-check-circle',
        'task-assigned': 'fa-user-plus',
        'project': 'fa-project-diagram'
    };
    return icons[type] || 'fa-bell';
}

// Get priority class
function getPriorityClass(priority) {
    const classes = {
        'high': 'text-danger',
        'medium': 'text-warning',
        'low': 'text-info'
    };
    return classes[priority] || '';
}

// Get time ago string
function getTimeAgo(timestamp) {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMs = now - notificationTime;
    const diffDays = Math.floor(diffMs / 86400000);
    const diffHours = Math.floor((diffMs % 86400000) / 3600000);
    const diffMinutes = Math.floor(((diffMs % 86400000) % 3600000) / 60000);

    if (diffDays > 0) {
        return diffDays + ' day' + (diffDays > 1 ? 's' : '') + ' ago';
    } else if (diffHours > 0) {
        return diffHours + ' hour' + (diffHours > 1 ? 's' : '') + ' ago';
    } else if (diffMinutes > 0) {
        return diffMinutes + ' minute' + (diffMinutes > 1 ? 's' : '') + ' ago';
    } else {
        return 'Just now';
    }
}

// Handle notification click
function handleNotificationClick(notificationId, taskId) {
    // Mark notification as read
    markNotificationAsRead(notificationId);

    // If it's a task-related notification, show task details
    if (taskId) {
        // Check if viewTaskDetails function exists
        if (typeof window.viewTaskDetails === 'function') {
            window.viewTaskDetails(taskId);
        }
    }

    // Close notification dropdown
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
}

// Mark notification as read
function markNotificationAsRead(notificationId) {
    try {
        let notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        const notification = notifications.find(n => n.id === notificationId);

        if (notification && !notification.read) {
            notification.read = true;
            localStorage.setItem('notifications', JSON.stringify(notifications));
            loadNotifications();
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// Mark all notifications as read
function markAllNotificationsAsRead() {
    try {
        let notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        notifications = notifications.map(notification => ({
            ...notification,
            read: true
        }));

        localStorage.setItem('notifications', JSON.stringify(notifications));
        loadNotifications();

        // Close dropdown
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
}

// View all notifications (would navigate to notifications page)
function viewAllNotifications() {
    alert('View all notifications - This would open a dedicated notifications page');
    // Close dropdown
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
}

// Create a new notification
function createNotification(type, message, taskId = null, projectId = null, priority = 'medium') {
    try {
        const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');

        const notification = {
            id: Date.now(), // Simple ID generation
            type: type,
            message: message,
            taskId: taskId,
            projectId: projectId,
            priority: priority,
            read: false,
            timestamp: new Date().toISOString()
        };

        notifications.push(notification);
        localStorage.setItem('notifications', JSON.stringify(notifications));
        loadNotifications();
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}

// Setup notification events
function setupNotificationEvents() {
    const bell = document.getElementById('notificationBell');
    const dropdown = document.getElementById('notificationDropdown');
    const markAllBtn = document.getElementById('markAllRead');

    if (bell && dropdown) {
        bell.addEventListener('click', function (e) {
            e.stopPropagation();
            dropdown.classList.toggle('show');

            // Load fresh notifications when opening
            if (dropdown.classList.contains('show')) {
                loadNotifications();
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (bell && dropdown && !bell.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    }

    if (markAllBtn) {
        markAllBtn.addEventListener('click', markAllNotificationsAsRead);
    }
}

// Add notification triggers for existing functionality
function setupNotificationTriggers() {
    // We'll set up triggers after the main app is loaded
    console.log('Notification triggers ready');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    initNotifications();
    setupNotificationTriggers();

    // Check for due tasks and create notifications
    setTimeout(checkDueTasks, 1000);
});

// Check for due tasks and create notifications
function checkDueTasks() {
    try {
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const today = new Date().toISOString().split('T')[0];

        tasks.forEach(task => {
            if (task.dueDate === today && task.status !== 'completed') {
                createNotification(
                    'task-due',
                    task.name + ' is due today',
                    task.id,
                    task.projectId,
                    'high'
                );
            } else if (new Date(task.dueDate) < new Date() && task.status !== 'completed') {
                createNotification(
                    'task-due',
                    task.name + ' is overdue',
                    task.id,
                    task.projectId,
                    'high'
                );
            }
        });
    } catch (error) {
        console.error('Error checking due tasks:', error);
    }
}

// Export functions for global access
if (typeof window !== 'undefined') {
    window.loadNotifications = loadNotifications;
    window.createNotification = createNotification;
    window.markAllNotificationsAsRead = markAllNotificationsAsRead;
    window.viewAllNotifications = viewAllNotifications;
}