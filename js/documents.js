// Documents Management Module

// Load documents for the documents list page
function loadDocuments() {
    loadDocumentFilters();
    loadDocumentList();
}

// Load document filters
function loadDocumentFilters() {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const projectFilter = document.getElementById('documentProjectFilter');

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

// Load document list
function loadDocumentList() {
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');

    const projectFilter = document.getElementById('documentProjectFilter').value;
    const categoryFilter = document.getElementById('documentCategoryFilter').value;
    const searchFilter = document.getElementById('searchDocuments').value.toLowerCase();

    // Apply filters
    let filteredDocuments = documents.filter(document => {
        // Project filter
        if (projectFilter && document.projectId != projectFilter) return false;

        // Category filter
        if (categoryFilter && document.category !== categoryFilter) return false;

        // Search filter
        if (searchFilter) {
            const docName = document.name.toLowerCase();
            const docDesc = document.description.toLowerCase();
            return docName.includes(searchFilter) || docDesc.includes(searchFilter);
        }

        return true;
    });

    const container = document.getElementById('documentsContainer');

    if (filteredDocuments.length === 0) {
        container.innerHTML = `
            <div class="empty-state-documents">
                <i class="fas fa-file-alt"></i>
                <h3>No Documents Found</h3>
                <p>Try adjusting your filters or upload a new document.</p>
                <button class="btn btn-primary" onclick="showDocumentModal()">
                    <i class="fas fa-upload"></i> Upload Document
                </button>
            </div>
        `;
        return;
    }

    // Sort by upload date (newest first)
    filteredDocuments.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

    container.innerHTML = `
        <div class="document-grid">
            ${filteredDocuments.map(document => {
        const project = projects.find(p => p.id === document.projectId);
        const iconClass = getDocumentIconClass(document.category);
        const categoryClass = `category-${document.category}`;
        const categoryText = getCategoryText(document.category);

        return `
                    <div class="document-card">
                        <div class="document-header">
                            <div class="document-icon ${iconClass}">
                                <i class="fas ${getDocumentIcon(document.category)}"></i>
                            </div>
                            <h3>${document.name}</h3>
                            <p>${document.description || 'No description provided'}</p>
                        </div>
                        <div class="document-body">
                            <div class="document-meta">
                                <span><i class="fas fa-project-diagram"></i> ${project ? project.name : 'Unknown Project'}</span>
                                <span><i class="fas fa-weight-hanging"></i> ${document.fileSize || 'Unknown size'}</span>
                            </div>
                            <div class="document-meta">
                                <span><i class="far fa-calendar"></i> ${formatDate(document.uploadDate)}</span>
                                <span><i class="fas fa-code-branch"></i> v${document.version || '1.0'}</span>
                            </div>
                            <span class="document-category ${categoryClass}">${categoryText}</span>
                            <div class="document-actions">
                                <button class="btn btn-outline" onclick="downloadDocument(${document.id})">
                                    <i class="fas fa-download"></i> Download
                                </button>
                                <button class="btn btn-primary" onclick="viewDocument(${document.id})">
                                    <i class="fas fa-eye"></i> View
                                </button>
                            </div>
                        </div>
                    </div>
                `;
    }).join('')}
        </div>
    `;
}

// Get document icon class
function getDocumentIconClass(category) {
    const classes = {
        'drawings': 'icon-drawings',
        'permits': 'icon-permits',
        'contracts': 'icon-contracts',
        'surveys': 'icon-surveys',
        'photos': 'icon-photos',
        'reports': 'icon-reports',
        'other': 'icon-other'
    };
    return classes[category] || 'icon-other';
}

// Get document icon
function getDocumentIcon(category) {
    const icons = {
        'drawings': 'fa-drafting-compass',
        'permits': 'fa-file-contract',
        'contracts': 'fa-file-signature',
        'surveys': 'fa-map-marked-alt',
        'photos': 'fa-camera',
        'reports': 'fa-chart-bar',
        'other': 'fa-file'
    };
    return icons[category] || 'fa-file';
}

// Get category text
function getCategoryText(category) {
    const texts = {
        'drawings': 'Drawings',
        'permits': 'Permits',
        'contracts': 'Contracts',
        'surveys': 'Surveys',
        'photos': 'Photos',
        'reports': 'Reports',
        'other': 'Other'
    };
    return texts[category] || 'Other';
}

// Show document modal
function showDocumentModal() {
    document.getElementById('documentModalTitle').textContent = 'Upload Document';
    document.getElementById('documentForm').reset();
    document.getElementById('documentId').value = '';

    // Populate project dropdown
    populateDocumentProjectDropdown();

    // Show modal
    if (window.app && typeof window.app.showModal === 'function') {
        window.app.showModal('documentModal');
    } else {
        document.getElementById('documentModal').style.display = 'block';
    }
}

// Populate document project dropdown
function populateDocumentProjectDropdown() {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const select = document.getElementById('documentProject');

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

// Download document
function downloadDocument(documentId) {
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    const document = documents.find(d => d.id === documentId);

    if (document) {
        // In a real app, this would download the actual file
        // For demo purposes, we'll show an alert
        alert(`Downloading: ${document.name}\nIn a real application, this would download the actual file.`);

        // Create notification
        if (typeof createNotification === 'function') {
            createNotification(
                'project',
                `Document downloaded: ${document.name}`,
                null,
                document.projectId,
                'medium'
            );
        }
    }
}

// View document
function viewDocument(documentId) {
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    const document = documents.find(d => d.id === documentId);

    if (document) {
        // In a real app, this would open the document in a viewer
        // For demo purposes, we'll show document details
        alert(`Viewing: ${document.name}\nURL: ${document.url || 'No URL available'}\n\nIn a real application, this would open the document in a viewer.`);

        // Create notification
        if (typeof createNotification === 'function') {
            createNotification(
                'project',
                `Document viewed: ${document.name}`,
                null,
                document.projectId,
                'medium'
            );
        }
    }
}

// Document form submission
document.addEventListener('DOMContentLoaded', function () {
    // Document form submission
    if (document.getElementById('documentForm')) {
        document.getElementById('documentForm').addEventListener('submit', function (e) {
            e.preventDefault();

            const documentId = document.getElementById('documentId').value;
            const fileInput = document.getElementById('documentFile');
            const file = fileInput.files[0];

            if (!file) {
                alert('Please select a file to upload');
                return;
            }

            // Get file information
            const fileName = file.name;
            const fileSize = formatFileSize(file.size);

            const document = {
                id: documentId ? parseInt(documentId) : Date.now(),
                projectId: parseInt(document.getElementById('documentProject').value),
                name: document.getElementById('documentName').value || fileName,
                description: document.getElementById('documentDescription').value,
                category: document.getElementById('documentCategory').value,
                fileSize: fileSize,
                uploadedBy: 1, // In a real app, this would be the current user
                uploadDate: new Date().toISOString().split('T')[0],
                version: '1.0',
                url: URL.createObjectURL(file) // In a real app, this would be the server URL
            };

            let documents = JSON.parse(localStorage.getItem('documents') || '[]');

            if (documentId) {
                // Update existing document
                const index = documents.findIndex(d => d.id === parseInt(documentId));
                if (index !== -1) {
                    documents[index] = document;
                }
            } else {
                // Add new document
                documents.push(document);
            }

            localStorage.setItem('documents', JSON.stringify(documents));

            // Reset form and close modal
            this.reset();
            document.getElementById('documentId').value = '';
            document.getElementById('documentModalTitle').textContent = 'Upload Document';

            if (window.app && typeof window.app.hideModal === 'function') {
                window.app.hideModal('documentModal');
            } else {
                document.getElementById('documentModal').style.display = 'none';
            }

            // Refresh document list
            loadDocumentList();

            // Create notification
            if (typeof createNotification === 'function') {
                createNotification(
                    'project',
                    `New document uploaded: ${document.name}`,
                    null,
                    document.projectId,
                    'medium'
                );
            }

            alert(`Document "${document.name}" uploaded successfully!`);
        });
    }

    // Cancel document button
    if (document.getElementById('cancelDocument')) {
        document.getElementById('cancelDocument').addEventListener('click', function () {
            document.getElementById('documentForm').reset();
            document.getElementById('documentId').value = '';
            document.getElementById('documentModalTitle').textContent = 'Upload Document';

            if (window.app && typeof window.app.hideModal === 'function') {
                window.app.hideModal('documentModal');
            } else {
                document.getElementById('documentModal').style.display = 'none';
            }
        });
    }

    // Upload document button
    if (document.getElementById('uploadDocumentBtn')) {
        document.getElementById('uploadDocumentBtn').addEventListener('click', showDocumentModal);
    }

    // Filter event listeners
    const projectFilter = document.getElementById('documentProjectFilter');
    const categoryFilter = document.getElementById('documentCategoryFilter');
    const searchDocuments = document.getElementById('searchDocuments');

    if (projectFilter) projectFilter.addEventListener('change', loadDocumentList);
    if (categoryFilter) categoryFilter.addEventListener('change', loadDocumentList);
    if (searchDocuments) searchDocuments.addEventListener('input', loadDocumentList);
});

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Export function for global access
window.loadDocuments = loadDocuments;