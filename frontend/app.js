// Constants
const ROOM_COLORS = [
    '#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', 
    '#06b6d4', '#ef4444', '#84cc16', '#f43f5e', '#14b8a6'
];

const CATEGORY_ICONS = {
    homework: '<i class="fa-solid fa-pencil"></i>',
    exams: '<i class="fa-solid fa-chart-column"></i>',
    discussion: '<i class="fa-regular fa-comments"></i>',
    projects: '<i class="fa-solid fa-rocket"></i>',
    general: '<i class="fa-regular fa-comment-dots"></i>'
};

// State
let currentPage = 'notes';
let resources = [];
let forumPosts = [];
let rooms = [];
let currentRoom = null;
let currentPost = null;
let currentComments = [];
let userProfile = {
    name: 'Student User',
    email: 'student@university.edu',
    course: 'Computer Science',
    year: '3',
    bio: 'Passionate about learning and sharing knowledge with fellow students.',
    avatar: 'https://ui-avatars.com/api/?name=Student+User&background=a855f7&color=fff&size=200'
};

const USER_PROFILE_STORAGE_KEY = 'noteify_user_profile';

// Load profile from localStorage (if present) so avatar/name persist on reload
try {
    const storedProfile = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        userProfile = { ...userProfile, ...parsed };
    }
} catch (e) {
    console.error('Failed to load stored profile:', e);
}

function persistUserProfile() {
    try {
        const toStore = {
            name: userProfile.name,
            course: userProfile.course,
            year: userProfile.year,
            bio: userProfile.bio,
            avatar: userProfile.avatar
        };
        localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(toStore));
    } catch (e) {
        console.error('Failed to persist profile:', e);
    }
}

// Mock chat messages
let chatMessages = [];
let chatInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    initializeModals();
    initializeFilters();
    initializeProfile();
    loadNotesFromAPI();
    loadForumPostsFromAPI();
    renderRooms();
    updateRoomTimers();
    setInterval(updateRoomTimers, 60000); // Update timers every minute
});

// Load notes from API
async function loadNotesFromAPI() {
    try {
        const response = await fetch('../api/notes.php');
        if (!response.ok) {
            throw new Error('Failed to fetch notes');
        }
        const data = await response.json();
        
        // Map API data to frontend format
        resources = data.map(note => {
            const authorName = note.author_name || 'Unknown';
            const isCurrentUser = authorName === userProfile.name;
            return {
                id: note.note_id,
                title: note.title,
                description: note.description || '',
                course: note.course || '',
                type: note.type || 'notes',
                year: note.year || new Date().getFullYear(),
                author: authorName,
                authorAvatar: isCurrentUser
                    ? userProfile.avatar
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName || 'User')}&background=a855f7&color=fff`,
                downloads: note.downloads || 0,
                views: note.views || 0,
                date: note.created_at ? note.created_at.split(' ')[0] : new Date().toISOString().split('T')[0],
                file_path: note.file_path
            };
        });
        
        renderResources();
        // Update profile stats if profile page is visible
        if (currentPage === 'profile') {
            updateProfileDisplay();
            renderUserContributions();
        }
    } catch (error) {
        console.error('Error loading notes:', error);
        // Show error message if API fails
        const container = document.getElementById('resources-grid');
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 3rem;">Failed to load notes. Please check your connection and try again.</p>';
    }
}

// Navigation
function initializeNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            switchPage(page);
        });
    });
}

function switchPage(page) {
    currentPage = page;
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
    });
    
    // Highlight nav-user when on profile page
    const navUser = document.querySelector('.nav-user');
    if (navUser) {
        if (page === 'profile') {
            navUser.style.background = 'rgba(168, 85, 247, 0.1)';
            navUser.style.border = '2px solid var(--primary-purple)';
        } else {
            navUser.style.background = '';
            navUser.style.border = '';
        }
    }
    
    // Update pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.toggle('active', p.id === `${page}-page`);
    });
    
    // Update profile stats when switching to profile page
    if (page === 'profile') {
        updateProfileDisplay();
        renderUserContributions();
    }
    
    // Reload forum posts when switching to forum page
    if (page === 'forum') {
        loadForumPostsFromAPI();
    }
}

// Modals
function initializeModals() {
    // Upload Modal
    document.getElementById('upload-note-btn').addEventListener('click', () => {
        document.getElementById('upload-modal').classList.add('active');
    });
    
    document.getElementById('close-upload-modal').addEventListener('click', closeUploadModal);
    document.getElementById('cancel-upload-btn').addEventListener('click', closeUploadModal);
    document.getElementById('submit-upload-btn').addEventListener('click', handleUpload);
    
    // Post Modal
    document.getElementById('create-post-btn').addEventListener('click', () => {
        document.getElementById('post-modal').classList.add('active');
    });
    
    document.getElementById('close-post-modal').addEventListener('click', closePostModal);
    document.getElementById('cancel-post-btn').addEventListener('click', closePostModal);
    document.getElementById('submit-post-btn').addEventListener('click', handleCreatePost);
    
    // Room Modal
    document.getElementById('create-room-btn').addEventListener('click', () => {
        document.getElementById('room-modal').classList.add('active');
        renderRoomColorPicker();
    });
    
    document.getElementById('close-room-modal').addEventListener('click', closeRoomModal);
    document.getElementById('cancel-room-btn').addEventListener('click', closeRoomModal);
    document.getElementById('submit-room-btn').addEventListener('click', handleCreateRoom);
    
    // Chat Modal
    document.getElementById('close-chat-modal').addEventListener('click', closeChatModal);
    document.getElementById('send-message-btn').addEventListener('click', sendMessage);
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    // Post Detail Modal
    document.getElementById('close-post-detail-modal').addEventListener('click', closePostDetailModal);
    document.getElementById('submit-comment-btn').addEventListener('click', handleAddComment);
    
    // File upload
    document.getElementById('upload-file').addEventListener('change', (e) => {
        const fileName = e.target.files[0]?.name || 'No file chosen';
        document.getElementById('file-name').textContent = fileName;
    });
    
    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// Filters
function initializeFilters() {
    document.getElementById('course-filter').addEventListener('change', renderResources);
    document.getElementById('type-filter').addEventListener('change', renderResources);
    document.getElementById('year-filter').addEventListener('change', renderResources);
    document.getElementById('search-notes').addEventListener('input', renderResources);
    
    // Forum categories
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            renderForumPosts(chip.dataset.category);
        });
    });
}

// Resources
function renderResources() {
    const courseFilter = document.getElementById('course-filter').value;
    const typeFilter = document.getElementById('type-filter').value;
    const yearFilter = document.getElementById('year-filter').value;
    const searchTerm = document.getElementById('search-notes').value.toLowerCase();
    
    let filtered = resources.filter(resource => {
        const matchesCourse = courseFilter === 'all' || resource.course === courseFilter;
        const matchesType = typeFilter === 'all' || resource.type === typeFilter;
        const matchesYear = yearFilter === 'all' || resource.year.toString() === yearFilter;
        const matchesSearch = resource.title.toLowerCase().includes(searchTerm) ||
                            resource.description.toLowerCase().includes(searchTerm);
        
        return matchesCourse && matchesType && matchesYear && matchesSearch;
    });
    
    const container = document.getElementById('resources-grid');
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 3rem;">No resources found. Try adjusting your filters.</p>';
        return;
    }
    
    container.innerHTML = filtered.map(resource => {
        // Build a simple relative URL from frontend/ to uploads/
        const fileUrl = resource.file_path
            ? `../${resource.file_path.replace(/^\/+/, '')}`
            : null;

        return `
        <div class="resource-card">
            <div class="resource-header">
                <span class="resource-type ${resource.type}">${getTypeIcon(resource.type)} ${getTypeLabel(resource.type)}</span>
                <h3 class="resource-title">${resource.title}</h3>
                <p class="resource-course"><i class="fa-solid fa-graduation-cap"></i> ${resource.course}</p>
            </div>
            <div class="resource-body">
                <p class="resource-description">${resource.description}</p>
                <div class="resource-meta">
                    <span><i class="fa-regular fa-calendar-days"></i> ${resource.year}</span>
                    <span><i class="fa-regular fa-eye"></i> ${resource.views} views</span>
                    <span><i class="fa-solid fa-download"></i> ${resource.downloads} downloads</span>
                </div>
                <div class="resource-footer">
                    ${
                        fileUrl
                            ? `
                    <a class="btn btn-secondary" href="${fileUrl}" target="_blank">
                        <i class="fa-regular fa-eye"></i> View
                    </a>
                    <a class="btn btn-primary" href="${fileUrl}" download>
                        <i class="fa-solid fa-download"></i> Download
                    </a>`
                            : `
                    <button class="btn btn-secondary" disabled>
                        <i class="fa-regular fa-eye"></i> View
                    </button>
                    <button class="btn btn-primary" disabled>
                        <i class="fa-solid fa-download"></i> Download
                    </button>`
                    }
                </div>
                <div class="resource-author">
                    <img src="${resource.authorAvatar}" alt="${resource.author}">
                    <span>Uploaded by <strong>${resource.author || 'Unknown'}</strong></span>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

function getTypeIcon(type) {
    const icons = {
        notes: '<i class="fa-regular fa-file-lines"></i>',
        pastpaper: '<i class="fa-regular fa-clipboard"></i>',
        tutorial: '<i class="fa-regular fa-lightbulb"></i>',
        reference: '<i class="fa-solid fa-book"></i>'
    };
    return icons[type] || '<i class="fa-regular fa-file"></i>';
}

function getTypeLabel(type) {
    const labels = {
        notes: 'Lecture Notes',
        pastpaper: 'Past Papers',
        tutorial: 'Tutorials',
        reference: 'References'
    };
    return labels[type] || type;
}

function viewResource(id) {
    const resource = resources.find(r => r.id === id);
    if (!resource) return;

    if (!resource.file_path) {
        alert(`Viewing: ${resource.title}\n\nFile not available.`);
        return;
    }

    // Build absolute URL: http://localhost/noteify/uploads/...
    const fileUrl = resource.file_path.startsWith('http')
        ? resource.file_path
        : window.location.origin + '/noteify/' + resource.file_path.replace(/^\/+/, '');

    // Open in same tab (more reliable than window.open for exam/demo)
    window.location.href = fileUrl;
}

function downloadResource(id) {
    const resource = resources.find(r => r.id === id);
    if (!resource) return;

    if (!resource.file_path) {
        alert(`Downloading: ${resource.title}\n\nFile not available.`);
        return;
    }

    const fileUrl = resource.file_path.startsWith('http')
        ? resource.file_path
        : window.location.origin + '/noteify/' + resource.file_path.replace(/^\/+/, '');

    // Simple navigation to file (browser will either open or download)
    window.location.href = fileUrl;
}

// Upload
function closeUploadModal() {
    document.getElementById('upload-modal').classList.remove('active');
    document.getElementById('upload-title').value = '';
    document.getElementById('upload-description').value = '';
    document.getElementById('file-name').textContent = 'No file chosen';
}

async function handleUpload() {
    const title = document.getElementById('upload-title').value;
    const description = document.getElementById('upload-description').value;
    const course = document.getElementById('upload-course').value;
    const type = document.getElementById('upload-type').value;
    const year = parseInt(document.getElementById('upload-year').value);
    const fileInput = document.getElementById('upload-file');
    
    if (!title || !description) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('Please select a file to upload');
        return;
    }
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('course', course);
    formData.append('type', type);
    formData.append('year', year);
    formData.append('uploaded_by', 1); // Default user ID
    formData.append('file', fileInput.files[0]);
    
    try {
        const response = await fetch('../api/upload.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok && result.message) {
            closeUploadModal();
            alert('Resource uploaded successfully!');
            // Reload notes from API
            loadNotesFromAPI();
        } else {
            alert('Upload failed: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Upload failed: ' + error.message);
    }
}

// Forum
async function loadForumPostsFromAPI() {
    try {
        const response = await fetch('../api/forum.php');
        if (!response.ok) {
            throw new Error('Failed to fetch forum posts: ' + response.status);
        }
        const data = await response.json();

        // Expect API to already return in the shape renderForumPosts uses
        forumPosts = Array.isArray(data) ? data : [];
        console.log('Loaded forum posts:', forumPosts.length);
        renderForumPosts();
    } catch (error) {
        console.error('Error loading forum posts:', error);
        const container = document.getElementById('forum-posts');
        if (container) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 3rem;">Failed to load forum posts. Please check console for details.</p>';
        }
    }
}

function renderForumPosts(category = 'all') {
    let filtered = category === 'all' 
        ? forumPosts 
        : forumPosts.filter(post => post.category === category);
    
    const container = document.getElementById('forum-posts');
    
    if (!container) {
        console.error('Forum posts container not found!');
        return;
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 3rem;">No posts in this category yet. Be the first to create a post!</p>';
        return;
    }
    
    container.innerHTML = filtered.map(post => `
        <div class="forum-post" onclick="openPostDetail(${post.id})">
            <div class="post-header">
                <div class="post-user-info">
                    <img src="${getForumAvatar(post.author, post.authorAvatar)}" alt="${post.author}" class="user-avatar-small">
                    <div class="post-user-details">
                        <span class="post-author">${post.author}</span>
                        <span class="post-time"><i class="fa-regular fa-clock"></i> ${post.time}</span>
                    </div>
                </div>
                <span class="category-badge ${post.category}">
                    ${CATEGORY_ICONS[post.category] || ''} ${post.category}
                </span>
            </div>
            <h3 class="post-title">${post.title}</h3>
            <p class="post-content">${post.content}</p>
            <div class="post-footer">
                <span class="post-stat"><i class="fa-regular fa-comment-dots"></i> ${post.replies} replies</span>
            </div>
        </div>
    `).join('');
}

function closePostModal() {
    document.getElementById('post-modal').classList.remove('active');
    document.getElementById('post-title').value = '';
    document.getElementById('post-content').value = '';
}

async function handleCreatePost() {
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const category = document.getElementById('post-category').value;
    
    if (!title || !content) {
        alert('Please fill in all fields');
        return;
    }
    
    const payload = {
        title,
        content,
        category,
        author: userProfile.name,
        authorAvatar: userProfile.avatar
    };

    try {
        const response = await fetch('../api/forum.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok || !result.post) {
            throw new Error(result.error || 'Failed to create post');
        }

        // Add the new post to the top of the list and re-render
        forumPosts.unshift(result.post);
        closePostModal();
        renderForumPosts();
        alert('Post created successfully!');
    } catch (error) {
        console.error('Error creating post:', error);
        alert('Failed to create post: ' + error.message);
    }
}

function openPostDetail(id) {
    currentPost = forumPosts.find(p => p.id === id);
    if (!currentPost) return;
    
    document.getElementById('post-detail-modal').classList.add('active');
    document.getElementById('post-detail-title').textContent = currentPost.title;
    document.getElementById('post-detail-avatar').src = getForumAvatar(currentPost.author, currentPost.authorAvatar);
    document.getElementById('post-detail-author').textContent = currentPost.author;
    document.getElementById('post-detail-time').textContent = currentPost.time;
    document.getElementById('post-detail-category').innerHTML = `${CATEGORY_ICONS[currentPost.category] || ''} ${currentPost.category}`;
    document.getElementById('post-detail-category').className = `category-badge ${currentPost.category}`;
    document.getElementById('post-detail-content').textContent = currentPost.content;
    
    loadCommentsForCurrentPost();
}

function closePostDetailModal() {
    document.getElementById('post-detail-modal').classList.remove('active');
    currentPost = null;
}

async function loadCommentsForCurrentPost() {
    if (!currentPost) return;

    try {
        const response = await fetch(`../api/comments.php?post_id=${currentPost.id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch comments');
        }
        const data = await response.json();
        currentComments = Array.isArray(data) ? data : [];
        renderComments();
    } catch (error) {
        console.error('Error loading comments:', error);
        currentComments = [];
        renderComments();
    }
}

function renderComments() {
    const comments = currentComments || [];
    document.getElementById('comment-count').textContent = comments.length;
    
    const container = document.getElementById('comments-list');
    if (comments.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">No comments yet. Be the first to comment!</p>';
        return;
    }

    container.innerHTML = comments.map(comment => `
        <div class="comment-item">
            <div class="comment-header">
                <img src="${getForumAvatar(comment.author, comment.authorAvatar)}" alt="${comment.author}">
                <span class="comment-author">${comment.author}</span>
                <span class="comment-time"><i class="fa-regular fa-clock"></i> ${comment.time}</span>
            </div>
            <p class="comment-text">${comment.text}</p>
        </div>
    `).join('');
}

async function handleAddComment() {
    if (!currentPost) {
        alert('No post selected');
        return;
    }

    const commentInput = document.getElementById('comment-input');
    const commentText = commentInput.value.trim();
    if (!commentText) {
        alert('Please write a comment');
        return;
    }
    
    const payload = {
        post_id: currentPost.id,
        text: commentText,
        author: userProfile.name,
        authorAvatar: userProfile.avatar
    };

    try {
        const response = await fetch('../api/comments.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (!response.ok || !result.comment) {
            throw new Error(result.error || 'Failed to add comment');
        }

        // Use the server-returned comment so time formatting matches
        currentComments.push(result.comment);
        commentInput.value = '';
        renderComments();

        // Also update replies count on the current post + list
        currentPost.replies = (currentPost.replies || 0) + 1;
        const idx = forumPosts.findIndex(p => p.id === currentPost.id);
        if (idx !== -1) {
            forumPosts[idx].replies = currentPost.replies;
            renderForumPosts(document.querySelector('.category-chip.active')?.dataset.category || 'all');
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        alert('Failed to add comment: ' + error.message);
    }
}

// Helper to determine which avatar URL to show in forum/posts/comments
function getForumAvatar(authorName, storedAvatar) {
    // Always show the CURRENT profile avatar for the logged-in user
    if (authorName && authorName === userProfile.name) {
        return userProfile.avatar;
    }
    // For other users, if we have a stored avatar from DB, use it directly
    if (storedAvatar && storedAvatar.trim() !== '') {
        return storedAvatar;
    }
    // Fallback: auto-generated avatar based on author name
    const name = authorName || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=a855f7&color=fff`;
}

// Study Rooms
function renderRooms() {
    const activeContainer = document.getElementById('active-rooms');
    const yourContainer = document.getElementById('your-rooms');
    
    const activeRooms = rooms.filter(room => room.owner !== userProfile.name);
    const yourRooms = rooms.filter(room => room.owner === userProfile.name);
    
    activeContainer.innerHTML = activeRooms.length > 0 
        ? activeRooms.map(room => createRoomCard(room)).join('')
        : '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No active rooms at the moment.</p>';
    
    yourContainer.innerHTML = yourRooms.length > 0
        ? yourRooms.map(room => createRoomCard(room)).join('')
        : '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">You haven\'t created any rooms yet.</p>';
}

function createRoomCard(room) {
    const isFull = room.currentParticipants >= room.maxParticipants;
    const timeRemaining = getTimeRemaining(room.expiresAt);
    
    return `
        <div class="room-card" style="border-color: ${room.color};">
            <div class="room-header">
                <div>
                    <h3 class="room-name">${room.name}</h3>
                    <span class="room-status ${isFull ? 'full' : 'active'}">
                        ${isFull ? '<i class="fa-solid fa-circle-xmark"></i> Full' : '<i class="fa-solid fa-circle-check"></i> Active'}
                    </span>
                </div>
            </div>
            <p class="room-description">${room.description}</p>
            <div class="room-info">
                <span><i class="fa-solid fa-user-group"></i> ${room.currentParticipants}/${room.maxParticipants}</span>
                <span><i class="fa-regular fa-clock"></i> ${timeRemaining}</span>
                <span><i class="fa-solid fa-lock"></i> ${room.privacy === 'public' ? 'Public' : 'Private'}</span>
            </div>
            <div class="room-participants">
                ${room.participants.slice(0, 3).map(p => 
                    `<img src="${p.avatar}" alt="${p.name}" title="${p.name}">`
                ).join('')}
                ${room.participants.length > 3 ? `<span style="margin-left: 0.5rem;">+${room.participants.length - 3} more</span>` : ''}
            </div>
            <div class="room-footer">
                ${!isFull ? `<button class="btn btn-primary" onclick="joinRoom(${room.id})"><i class="fa-solid fa-door-open"></i> Join Room</button>` : ''}
                <button class="btn btn-secondary" onclick="viewRoomDetails(${room.id})"><i class="fa-regular fa-eye"></i> View</button>
            </div>
        </div>
    `;
}

function getTimeRemaining(expiresAt) {
    const diff = expiresAt - Date.now();
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
}

function updateRoomTimers() {
    rooms = rooms.filter(room => room.expiresAt > Date.now());
    renderRooms();
}

function closeRoomModal() {
    document.getElementById('room-modal').classList.remove('active');
    document.getElementById('room-name').value = '';
    document.getElementById('room-description').value = '';
}

function renderRoomColorPicker() {
    const container = document.getElementById('room-color-picker');
    container.innerHTML = ROOM_COLORS.map(color => `
        <div class="color-option" style="background: ${color};" data-color="${color}" 
             onclick="selectRoomColor('${color}')"></div>
    `).join('');
    
    // Select first color by default
    selectRoomColor(ROOM_COLORS[0]);
}

function selectRoomColor(color) {
    document.querySelectorAll('#room-color-picker .color-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.color === color);
    });
}

function handleCreateRoom() {
    const name = document.getElementById('room-name').value.trim();
    const description = document.getElementById('room-description').value.trim();
    const maxParticipants = parseInt(document.getElementById('room-max').value);
    const duration = parseInt(document.getElementById('room-duration').value);
    const privacy = document.getElementById('room-privacy').value;
    const color = document.querySelector('#room-color-picker .color-option.selected')?.dataset.color || ROOM_COLORS[0];
    
    if (!name || !description) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (maxParticipants < 2 || maxParticipants > 50) {
        alert('Max participants must be between 2 and 50');
        return;
    }
    
    if (duration < 1 || duration > 24) {
        alert('Duration must be between 1 and 24 hours');
        return;
    }
    
    // Generate unique ID
    const newId = rooms.length > 0 ? Math.max(...rooms.map(r => r.id)) + 1 : 1;
    
    const newRoom = {
        id: newId,
        name,
        description,
        maxParticipants,
        currentParticipants: 1,
        duration: `${duration} hours`,
        expiresAt: Date.now() + (duration * 3600000),
        privacy,
        color,
        owner: userProfile.name,
        participants: [
            { name: userProfile.name, avatar: userProfile.avatar }
        ]
    };
    
    rooms.unshift(newRoom);
    closeRoomModal();
    renderRooms();
    alert('Room created successfully!');
}

function joinRoom(id) {
    const room = rooms.find(r => r.id === id);
    if (!room) {
        alert('Room not found!');
        return;
    }
    
    // Check if already joined
    const alreadyJoined = room.participants.some(p => p.name === userProfile.name);
    if (alreadyJoined) {
        openChatRoom(id);
        return;
    }
    
    if (room.currentParticipants >= room.maxParticipants) {
        alert('This room is full!');
        return;
    }
    
    // Check if room expired
    if (room.expiresAt <= Date.now()) {
        alert('This room has expired!');
        return;
    }
    
    room.currentParticipants++;
    room.participants.push({
        name: userProfile.name,
        avatar: userProfile.avatar
    });
    
    renderRooms();
    openChatRoom(id);
    alert('Successfully joined the room!');
}

function viewRoomDetails(id) {
    const room = rooms.find(r => r.id === id);
    if (!room) {
        alert('Room not found!');
        return;
    }
    openChatRoom(id);
}

function openChatRoom(id) {
    currentRoom = rooms.find(r => r.id === id);
    if (!currentRoom) {
        alert('Room not found!');
        return;
    }
    
    // Check if room expired
    if (currentRoom.expiresAt <= Date.now()) {
        alert('This room has expired!');
        return;
    }
    
    document.getElementById('chat-modal').classList.add('active');
    document.getElementById('chat-room-name').textContent = currentRoom.name;
    document.getElementById('chat-room-info').textContent = `${currentRoom.description} • ${currentRoom.currentParticipants} participants`;
    
    renderParticipants();
    initializeMockChat();
}

function closeChatModal() {
    document.getElementById('chat-modal').classList.remove('active');
    if (chatInterval) {
        clearInterval(chatInterval);
        chatInterval = null;
    }
    chatMessages = [];
    currentRoom = null;
}

function renderParticipants() {
    if (!currentRoom) return;
    
    document.getElementById('participant-count').textContent = currentRoom.participants.length;
    
    const container = document.getElementById('participants-list');
    container.innerHTML = currentRoom.participants.map(p => `
        <div class="participant-item">
            <img src="${p.avatar}" alt="${p.name}">
            <span>${p.name}</span>
        </div>
    `).join('');
}

function initializeMockChat() {
    // Initialize empty chat - users can start chatting
    chatMessages = [];
    renderChatMessages();
}

function renderChatMessages() {
    const container = document.getElementById('chat-messages');
    container.innerHTML = chatMessages.map(msg => `
        <div class="chat-message ${msg.isOwn ? 'own' : ''}">
            <img src="${msg.avatar}" alt="${msg.author}">
            <div class="message-content">
                ${!msg.isOwn ? `<div class="message-author">${msg.author}</div>` : ''}
                <div class="message-text">${msg.text}</div>
                <div class="message-time">${msg.time}</div>
            </div>
        </div>
    `).join('');
    
    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    
    if (!text) return;
    
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    chatMessages.push({
        author: userProfile.name,
        avatar: userProfile.avatar,
        text,
        time,
        isOwn: true
    });
    
    input.value = '';
    renderChatMessages();
}

// Profile
function initializeProfile() {
    updateProfileDisplay();
    
    document.getElementById('save-profile-btn').addEventListener('click', saveProfile);
    document.getElementById('change-avatar-btn').addEventListener('click', changeAvatar);
    const avatarInput = document.getElementById('avatar-file');
    if (avatarInput) {
        avatarInput.addEventListener('change', handleAvatarFileChange);
    }
    
    renderUserContributions();
}

function updateProfileDisplay() {
    document.getElementById('profile-display-name').textContent = userProfile.name;
    document.getElementById('edit-name').value = userProfile.name;
    document.getElementById('edit-course').value = userProfile.course;
    document.getElementById('edit-year').value = userProfile.year;
    document.getElementById('edit-bio').value = userProfile.bio;
    document.getElementById('profile-avatar').src = userProfile.avatar;
    
    // Header chips + bio
    const courseEl = document.getElementById('profile-course');
    const yearEl = document.getElementById('profile-year');
    const bioEl = document.getElementById('profile-bio');

    if (courseEl) {
        courseEl.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> ${userProfile.course || 'Add your course'}`;
    }

    if (yearEl) {
        const yearMap = {
            '1': '1st Year',
            '2': '2nd Year',
            '3': '3rd Year',
            '4': '4th Year',
            graduate: 'Graduate'
        };
        const label = yearMap[userProfile.year] || 'Year not set';
        yearEl.innerHTML = `<i class="fa-regular fa-calendar-days"></i> ${label}`;
    }

    if (bioEl) {
        bioEl.textContent = userProfile.bio || 'Add a short bio to let others know who you are.';
    }
    
    // Update navbar avatar and name
    const navAvatar = document.querySelector('.user-avatar-small');
    const navName = document.querySelector('.user-name-nav');
    if (navAvatar) navAvatar.src = userProfile.avatar;
    if (navName) navName.textContent = userProfile.name;
    
    // Calculate real stats from resources
    const userResources = resources.filter(r => r.author === userProfile.name);
    const totalViews = userResources.reduce((sum, r) => sum + (r.views || 0), 0);
    const totalDownloads = userResources.reduce((sum, r) => sum + (r.downloads || 0), 0);
    
    // Update stats
    const statsValue = document.querySelectorAll('.stat-value');
    if (statsValue.length >= 3) {
        statsValue[0].textContent = userResources.length; // Resources count
        statsValue[1].textContent = totalViews; // Total views
        statsValue[2].textContent = totalDownloads; // Total downloads
    }
}

function saveProfile() {
    userProfile.name = document.getElementById('edit-name').value;
    userProfile.course = document.getElementById('edit-course').value;
    userProfile.year = document.getElementById('edit-year').value;
    userProfile.bio = document.getElementById('edit-bio').value;
    
    updateProfileDisplay();
    renderUserContributions();
    persistUserProfile();
    
    alert('Profile updated successfully!');
}

function changeAvatar() {
    const input = document.getElementById('avatar-file');
    if (input) {
        input.click();
    }
}

async function handleAvatarFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        event.target.value = '';
        return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
        alert('Image must be 5MB or smaller');
        event.target.value = '';
        return;
    }

    // Optional: quick preview while uploading
    const reader = new FileReader();
    reader.onload = () => {
        const img = document.getElementById('profile-avatar');
        if (img) img.src = reader.result;
    };
    reader.readAsDataURL(file);

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('../api/avatar.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!response.ok || !result.url) {
            throw new Error(result.error || 'Upload failed');
        }

        // Build a relative URL from frontend/ to uploaded avatar
        const avatarUrl = `../${String(result.url).replace(/^\/+/, '')}`;

        userProfile.avatar = avatarUrl;
        persistUserProfile();

        // Update any resources authored by this user to use the new avatar
        resources = resources.map(r =>
            r.author === userProfile.name ? { ...r, authorAvatar: userProfile.avatar } : r
        );

        // Update any forum posts/comments authored by this user in the current session
        forumPosts = forumPosts.map(p =>
            p.author === userProfile.name ? { ...p, authorAvatar: userProfile.avatar } : p
        );
        currentComments = currentComments.map(c =>
            c.author === userProfile.name ? { ...c, authorAvatar: userProfile.avatar } : c
        );

        updateProfileDisplay();
        renderResources();
        renderForumPosts();
        renderComments();
        renderUserContributions();
        alert('Avatar updated successfully!');
    } catch (err) {
        console.error('Avatar upload error:', err);
        alert('Failed to upload avatar: ' + err.message);
    } finally {
        event.target.value = '';
    }
}

function renderUserContributions() {
    const userResources = resources.filter(r => r.author === userProfile.name);
    const container = document.getElementById('user-contributions');
    
    if (userResources.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">You haven\'t uploaded any resources yet.</p>';
        return;
    }
    
    container.innerHTML = userResources.map(resource => `
        <div class="contribution-item">
            <span class="resource-type ${resource.type}">${getTypeIcon(resource.type)}</span>
            <h4>${resource.title}</h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">
                <i class="fa-regular fa-eye"></i> ${resource.views} views • <i class="fa-solid fa-download"></i> ${resource.downloads} downloads
            </p>
        </div>
    `).join('');
}

function goToRegister() {   
    window.location.href = 'register.html';
}

function goToLogin() {   
    window.location.href = 'index.html';
}

function goToAdminLogin() {
    window.location.href = 'adminlogin.html';
}
