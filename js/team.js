// Team Management Module
function loadTeam() {
    const team = JSON.parse(localStorage.getItem('team') || '[]');
    const container = document.getElementById('teamContainer');

    if (team.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No Team Members</h3>
                <p>Get started by adding your first team member.</p>
                <button class="btn btn-primary" onclick="app.showModal('teamModal')">
                    <i class="fas fa-plus"></i> Add Member
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = team.map(member => {
        const roleText = getRoleText(member.role);

        return `
            <div class="team-member">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random" 
                     alt="${member.name}" class="member-avatar">
                <h3 class="member-name">${member.name}</h3>
                <div class="member-role">${roleText}</div>
                <div class="member-contact">
                    <div><i class="fas fa-envelope"></i> ${member.email}</div>
                    ${member.phone ? `<div><i class="fas fa-phone"></i> ${member.phone}</div>` : ''}
                </div>
                <div class="member-actions">
                    <button class="btn btn-outline" onclick="editMember(${member.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" onclick="deleteMember(${member.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function getRoleText(role) {
    const roles = {
        'project-manager': 'Project Manager',
        'site-supervisor': 'Site Supervisor',
        'engineer': 'Engineer',
        'foreman': 'Foreman',
        'worker': 'Worker'
    };
    return roles[role] || role;
}

function editMember(memberId) {
    const team = JSON.parse(localStorage.getItem('team') || '[]');
    const member = team.find(m => m.id === memberId);

    if (member) {
        document.getElementById('memberId').value = member.id;
        document.getElementById('memberName').value = member.name;
        document.getElementById('memberEmail').value = member.email;
        document.getElementById('memberRole').value = member.role;
        document.getElementById('memberPhone').value = member.phone || '';

        document.getElementById('teamModalTitle').textContent = 'Edit Team Member';
        app.showModal('teamModal');
    }
}

function deleteMember(memberId) {
    if (confirm('Are you sure you want to remove this team member?')) {
        let team = JSON.parse(localStorage.getItem('team') || '[]');
        team = team.filter(member => member.id !== memberId);
        localStorage.setItem('team', JSON.stringify(team));
        loadTeam();
    }
}

// Form handling
document.getElementById('teamForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const memberId = document.getElementById('memberId').value;
    const member = {
        id: memberId ? parseInt(memberId) : Date.now(),
        name: document.getElementById('memberName').value,
        email: document.getElementById('memberEmail').value,
        role: document.getElementById('memberRole').value,
        phone: document.getElementById('memberPhone').value
    };

    let team = JSON.parse(localStorage.getItem('team') || '[]');

    if (memberId) {
        // Update existing member
        const index = team.findIndex(m => m.id === parseInt(memberId));
        if (index !== -1) {
            team[index] = member;
        }
    } else {
        // Add new member
        team.push(member);
    }

    localStorage.setItem('team', JSON.stringify(team));

    // Reset form and close modal
    this.reset();
    document.getElementById('memberId').value = '';
    document.getElementById('teamModalTitle').textContent = 'Add Team Member';
    app.hideModal('teamModal');

    // Refresh team list
    loadTeam();
});

document.getElementById('cancelMember').addEventListener('click', function () {
    document.getElementById('teamForm').reset();
    document.getElementById('memberId').value = '';
    document.getElementById('teamModalTitle').textContent = 'Add Team Member';
    app.hideModal('teamModal');
});

// Add Member Button
document.getElementById('addMemberBtn').addEventListener('click', function () {
    document.getElementById('teamModalTitle').textContent = 'Add Team Member';
    app.showModal('teamModal');
});