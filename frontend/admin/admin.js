// Admin Panel JavaScript - Single Page Application
let currentPage = 'dashboard';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    loadNotes();
    loadStats();
    loadProfile();
    initializeProfile();
});

// Navigation
function initializeNavigation() {
    // Nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            switchPage(page);
        });
    });
    
    // Profile click
    const navUser = document.querySelector('.nav-user');
    if (navUser) {
        navUser.addEventListener('click', (e) => {
            e.preventDefault();
            switchPage('profile');
        });
    }
}

function switchPage(page) {
    currentPage = page;
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
    });
    
    // Update pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.toggle('active', p.id === `${page}-page`);
    });
    
    // Load page-specific data
    if (page === 'dashboard') {
        loadNotes();
        loadStats();
    } else if (page === 'forum') {
        loadForumPosts();
    } else if (page === 'profile') {
        loadProfile();
    }
}

// Dashboard Functions
async function loadNotes() {
    try {
        const response = await fetch('../../backend/api/admin/notes.php');
        const notes = await response.json();
        
        const container = document.getElementById('notes-container');
        
        if (!container) return;
        
        if (notes.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-inbox"></i><br>No notes found</div>';
            return;
        }
        
        container.innerHTML = notes.map(note => `
            <div class="table-row">
                <div>
                    <strong>${note.title || 'Untitled'}</strong>
                    ${note.description ? `<br><small style="color: var(--text-secondary);">${note.description.substring(0, 50)}...</small>` : ''}
                </div>
                <div>${note.author_name ? note.author_name : (note.author_username ? note.author_username : (note.uploaded_by ? 'User #' + note.uploaded_by : 'Unknown'))}</div>
                <div>${note.course || '-'}</div>
                <div><span class="resource-type ${note.type || 'notes'}">${note.type || 'notes'}</span></div>
                <div>${note.views || 0}</div>
                <div>${note.downloads || 0}</div>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    ${note.file_path ? `
                        <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;" onclick="window.viewNote('${note.file_path.replace(/'/g, "\\'")}')" title="View PDF">
                            <i class="fa-regular fa-eye"></i> View
                        </button>
                        <button class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;" onclick="window.downloadNote('${note.file_path.replace(/'/g, "\\'")}', '${(note.title || 'note').replace(/'/g, "\\'")}')" title="Download PDF">
                            <i class="fa-solid fa-download"></i> Download
                        </button>
                    ` : ''}
                    <button class="btn-delete" onclick="deleteNote(${note.note_id})" title="Delete Note">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading notes:', error);
        const container = document.getElementById('notes-container');
        if (container) {
            container.innerHTML = '<div class="empty-state">Error loading notes. Please refresh.</div>';
        }
    }
}

async function deleteNote(noteId) {
    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`../../backend/api/admin/notes.php?note_id=${noteId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Note deleted successfully!');
            loadNotes();
            loadStats();
        } else {
            alert('Error: ' + (result.error || 'Failed to delete note'));
        }
    } catch (error) {
        console.error('Error deleting note:', error);
        alert('Error deleting note. Please try again.');
    }
}

async function loadStats() {
    try {
        const notesResponse = await fetch('../../backend/api/admin/notes.php');
        const notes = await notesResponse.json();
        
        const totalViews = notes.reduce((sum, note) => sum + (parseInt(note.views) || 0), 0);
        const totalDownloads = notes.reduce((sum, note) => sum + (parseInt(note.downloads) || 0), 0);
        
        const totalNotesEl = document.getElementById('total-notes');
        const totalViewsEl = document.getElementById('total-views');
        const totalDownloadsEl = document.getElementById('total-downloads');
        const totalUsersEl = document.getElementById('total-users');
        const totalCommentsEl = document.getElementById('total-comments');
        
        if (totalNotesEl) totalNotesEl.textContent = notes.length;
        if (totalViewsEl) totalViewsEl.textContent = totalViews;
        if (totalDownloadsEl) totalDownloadsEl.textContent = totalDownloads;
        
        const usersResponse = await fetch('../../backend/api/admin/users.php');
        const users = await usersResponse.json();
        if (totalUsersEl) totalUsersEl.textContent = users.length;
        
        const commentsResponse = await fetch('../../backend/api/admin/forum.php?type=comments');
        const comments = await commentsResponse.json();
        if (totalCommentsEl) totalCommentsEl.textContent = comments.length || 0;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function refreshNotes() {
    loadNotes();
    loadStats();
}

// Make functions globally accessible
window.viewNote = function(filePath) {
    if (!filePath) {
        alert('File path not available');
        return;
    }
    // Ensure proper path format - filePath should already be "uploads/filename.pdf"
    let cleanPath = filePath;
    if (!cleanPath.startsWith('uploads/')) {
        cleanPath = `uploads/${cleanPath}`;
    }
    const url = `../../${cleanPath}`;
    console.log('Opening file:', url); // Debug log
    window.open(url, '_blank');
};

window.downloadNote = function(filePath, fileName) {
    if (!filePath) {
        alert('File path not available');
        return;
    }
    // Ensure proper path format
    let cleanPath = filePath;
    if (!cleanPath.startsWith('uploads/')) {
        cleanPath = `uploads/${cleanPath}`;
    }
    const url = `../../${cleanPath}`;
    console.log('Downloading file:', url); // Debug log
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'note.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        document.body.removeChild(link);
    }, 100);
};

// Forum Functions
async function loadForumPosts() {
    try {
        const response = await fetch('../../backend/api/admin/forum.php?type=posts');
        const posts = await response.json();
        
        const container = document.getElementById('forum-posts-container');
        if (!container) return;
        
        if (posts.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-inbox"></i><br>No forum posts found</div>';
            return;
        }
        
        container.innerHTML = posts.map(post => {
            const date = new Date(post.created_at);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            return `
                <div class="table-row" style="grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;">
                    <div>
                        <strong>${post.title || 'Untitled'}</strong>
                        ${post.content ? `<br><small style="color: var(--text-secondary);">${post.content.substring(0, 60)}...</small>` : ''}
                    </div>
                    <div>${post.author_name || 'Unknown'}</div>
                    <div><span class="category-badge ${post.category || 'general'}">${post.category || 'general'}</span></div>
                    <div>${post.comment_count || 0}</div>
                    <div><small>${formattedDate}</small></div>
                    <div>
                        <button class="btn-delete" onclick="deleteForumItem('post', ${post.id})">
                            <i class="fa-solid fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading posts:', error);
        const container = document.getElementById('forum-posts-container');
        if (container) {
            container.innerHTML = '<div class="empty-state">Error loading posts. Please refresh.</div>';
        }
    }
}

async function deleteForumItem(type, id) {
    const itemName = type === 'post' ? 'post' : 'comment';
    if (!confirm(`Are you sure you want to delete this ${itemName}? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await fetch(`../../backend/api/admin/forum.php`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ type: type, id: id })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`${itemName.charAt(0).toUpperCase() + itemName.slice(1)} deleted successfully!`);
            loadForumPosts();
        } else {
            alert('Error: ' + (result.error || 'Failed to delete'));
        }
    } catch (error) {
        console.error('Error deleting:', error);
        alert('Error deleting. Please try again.');
    }
}

// Profile Functions
function initializeProfile() {
    document.getElementById('change-avatar-btn')?.addEventListener('click', () => {
        document.getElementById('avatar-file')?.click();
    });
    
    document.getElementById('avatar-file')?.addEventListener('change', handleAvatarChange);
    document.getElementById('save-profile-btn')?.addEventListener('click', saveProfile);
}

async function loadProfile() {
    try {
        const response = await fetch('../../backend/api/admin/profile.php');
        const profile = await response.json();
        
        if (profile.error) {
            console.error('Profile error:', profile.error);
            return;
        }
        
        // Update profile display
        const profileDisplayName = document.getElementById('profile-display-name');
        const profileEmail = document.getElementById('profile-email');
        const profileCourse = document.getElementById('profile-course');
        const profileRole = document.getElementById('profile-role');
        const profileBio = document.getElementById('profile-bio');
        const profileAvatar = document.getElementById('profile-avatar');
        const adminAvatarNav = document.getElementById('admin-avatar-nav');
        const adminNameNav = document.getElementById('admin-name-nav');
        
        if (profileDisplayName) profileDisplayName.textContent = profile.fullname || 'Admin User';
        if (profileEmail) profileEmail.textContent = profile.email || 'admin@noteify.com';
        if (profileCourse) profileCourse.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> ${profile.course || 'Administrator'}`;
        if (profileRole) profileRole.innerHTML = `<i class="fa-solid fa-shield-halved"></i> ${profile.role || 'Admin'}`;
        if (profileBio) profileBio.textContent = profile.bio || 'Administrator account';
        
        // Update avatar - handle different path formats
        let avatarUrl;
        if (profile.profile_pic && profile.profile_pic !== 'default.png' && profile.profile_pic !== 'uploads/default.png') {
            // Check if it's already a full path or relative path
            if (profile.profile_pic.startsWith('uploads/')) {
                // From frontend/admin/, we need ../../ to reach root/uploads/
                avatarUrl = `../../${profile.profile_pic}`;
            } else if (profile.profile_pic.startsWith('../')) {
                avatarUrl = profile.profile_pic;
            } else {
                // Assume it's just a filename, construct full path
                avatarUrl = `../../uploads/avatars/${profile.profile_pic}`;
            }
            // Add timestamp to force refresh
            avatarUrl += '?t=' + Date.now();
        } else {
            avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullname || 'Admin')}&background=dc2626&color=fff&size=200`;
        }
        
        if (profileAvatar) {
            profileAvatar.src = avatarUrl;
            profileAvatar.onerror = function() {
                // Fallback if image fails to load
                this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullname || 'Admin')}&background=dc2626&color=fff&size=200`;
            };
        }
        if (adminAvatarNav) {
            let navAvatarUrl;
            if (avatarUrl.includes('ui-avatars.com')) {
                navAvatarUrl = avatarUrl.replace('&size=200', '&size=40');
            } else {
                // For uploaded images, use the same URL but smaller
                navAvatarUrl = avatarUrl.split('?')[0] + '?t=' + Date.now();
            }
            adminAvatarNav.src = navAvatarUrl;
            adminAvatarNav.onerror = function() {
                this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullname || 'Admin')}&background=dc2626&color=fff&size=40`;
            };
        }
        if (adminNameNav) adminNameNav.textContent = profile.fullname || 'Admin';
        
        // Update stats
        const statNotes = document.getElementById('stat-notes');
        const statViews = document.getElementById('stat-views');
        const statDownloads = document.getElementById('stat-downloads');
        
        if (statNotes) statNotes.textContent = profile.notes_count || 0;
        if (statViews) statViews.textContent = profile.total_views || 0;
        if (statDownloads) statDownloads.textContent = profile.total_downloads || 0;
        
        // Update form fields
        const editName = document.getElementById('edit-name');
        const editEmail = document.getElementById('edit-email');
        const editUsername = document.getElementById('edit-username');
        const editCourse = document.getElementById('edit-course');
        
        if (editName) editName.value = profile.fullname || '';
        if (editEmail) editEmail.value = profile.email || '';
        if (editUsername) editUsername.value = profile.username || '';
        if (editCourse) editCourse.value = profile.course || 'Administrator';
        
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

async function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        event.target.value = '';
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        alert('Image must be 5MB or smaller');
        event.target.value = '';
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('../../backend/api/avatar.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.url) {
            // Ensure the URL is correct - result.url should already be "uploads/avatars/..."
            // From frontend/admin/, we need ../../ to reach root/uploads/
            let avatarUrl = `../../${result.url}`;
            
            // Update profile avatar immediately
            const profileAvatar = document.getElementById('profile-avatar');
            const adminAvatarNav = document.getElementById('admin-avatar-nav');
            
            if (profileAvatar) {
                // Force reload by adding timestamp
                profileAvatar.src = avatarUrl + '?t=' + Date.now();
            }
            if (adminAvatarNav) {
                // For uploaded images, use the same URL with timestamp
                adminAvatarNav.src = avatarUrl + '?t=' + Date.now();
            }
            
            alert('Avatar updated successfully!');
            // Reload profile to get updated data from database
            setTimeout(() => {
                loadProfile();
            }, 500);
        } else {
            alert('Error: ' + (result.error || 'Failed to upload avatar'));
        }
    } catch (error) {
        console.error('Avatar upload error:', error);
        alert('Failed to upload avatar');
    }
}

async function saveProfile() {
    const fullname = document.getElementById('edit-name')?.value;
    const course = document.getElementById('edit-course')?.value;
    
    // TODO: Implement API endpoint to update profile
    alert('Profile update functionality will be implemented with API endpoint');
    
    // Reload profile to reflect changes
    loadProfile();
}

