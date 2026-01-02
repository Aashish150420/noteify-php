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
let viewMode = 'cards'; // 'cards' or 'list'
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
    loadViewMode(); // Load saved view mode
    loadNotesFromAPI();
    loadForumPostsFromAPI();
    renderRooms();
    updateRoomTimers();
    setInterval(updateRoomTimers, 60000); // Update timers every minute
});

// Load notes from API
async function loadNotesFromAPI() {
    try {
        const response = await fetch('../backend/api/notes.php');
        if (!response.ok) {
            throw new Error('Failed to fetch notes');
        }
        const data = await response.json();
        
        // Map API data to frontend format
        resources = data.map(note => {
            const authorName = note.author_name || 'Unknown';
            const isCurrentUser = authorName === userProfile.name;
            
            // Get author avatar - use profile_pic from database if available
            let authorAvatar;
            if (isCurrentUser) {
                // For current user, always use their current profile avatar
                authorAvatar = userProfile.avatar;
            } else if (note.author_profile_pic && note.author_profile_pic !== 'default.png' && note.author_profile_pic !== 'uploads/default.png' && note.author_profile_pic.trim() !== '') {
                // For other users, use their profile pic from database
                // Build relative path from frontend/ to uploads/
                // profile_pic is stored as "uploads/avatars/filename.jpg" in database
                let picPath = note.author_profile_pic.replace(/^\/+/, ''); // Remove leading slashes
                authorAvatar = `../${picPath}`;
            } else {
                // Fallback to generated avatar
                authorAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName || 'User')}&background=a855f7&color=fff`;
            }
            
            return {
                id: note.note_id,
                title: note.title,
                description: note.description || '',
                course: note.course || '',
                type: note.type || 'notes',
                year: note.year || new Date().getFullYear(),
                author: authorName,
                authorAvatar: authorAvatar,
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

// Make switchPage globally accessible immediately (before DOMContentLoaded)
window.switchPage = function(page) {
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
};

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

// Modals
function initializeModals() {
    // Upload Modal
    const uploadBtn = document.getElementById('upload-note-btn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            const modal = document.getElementById('upload-modal');
            if (modal) modal.classList.add('active');
        });
    }
    
    const closeUploadBtn = document.getElementById('close-upload-modal');
    if (closeUploadBtn) closeUploadBtn.addEventListener('click', closeUploadModal);
    const cancelUploadBtn = document.getElementById('cancel-upload-btn');
    if (cancelUploadBtn) cancelUploadBtn.addEventListener('click', closeUploadModal);
    const submitUploadBtn = document.getElementById('submit-upload-btn');
    if (submitUploadBtn) submitUploadBtn.addEventListener('click', handleUpload);
    
    // Post Modal
    const createPostBtn = document.getElementById('create-post-btn');
    if (createPostBtn) {
        createPostBtn.addEventListener('click', () => {
            const modal = document.getElementById('post-modal');
            if (modal) modal.classList.add('active');
        });
    }
    
    const closePostBtn = document.getElementById('close-post-modal');
    if (closePostBtn) closePostBtn.addEventListener('click', closePostModal);
    const cancelPostBtn = document.getElementById('cancel-post-btn');
    if (cancelPostBtn) cancelPostBtn.addEventListener('click', closePostModal);
    const submitPostBtn = document.getElementById('submit-post-btn');
    if (submitPostBtn) submitPostBtn.addEventListener('click', handleCreatePost);
    
    // Room Modal
    const createRoomBtn = document.getElementById('create-room-btn');
    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', () => {
            const modal = document.getElementById('room-modal');
            if (modal) {
                modal.classList.add('active');
                renderRoomColorPicker();
            }
        });
    }
    
    const closeRoomBtn = document.getElementById('close-room-modal');
    if (closeRoomBtn) closeRoomBtn.addEventListener('click', closeRoomModal);
    const cancelRoomBtn = document.getElementById('cancel-room-btn');
    if (cancelRoomBtn) cancelRoomBtn.addEventListener('click', closeRoomModal);
    const submitRoomBtn = document.getElementById('submit-room-btn');
    if (submitRoomBtn) submitRoomBtn.addEventListener('click', handleCreateRoom);
    
    // Chat Modal
    const closeChatBtn = document.getElementById('close-chat-modal');
    if (closeChatBtn) closeChatBtn.addEventListener('click', closeChatModal);
    const sendMessageBtn = document.getElementById('send-message-btn');
    if (sendMessageBtn) sendMessageBtn.addEventListener('click', sendMessage);
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
    
    // Post Detail Modal
    const closePostDetailBtn = document.getElementById('close-post-detail-modal');
    if (closePostDetailBtn) closePostDetailBtn.addEventListener('click', closePostDetailModal);
    const submitCommentBtn = document.getElementById('submit-comment-btn');
    if (submitCommentBtn) submitCommentBtn.addEventListener('click', handleAddComment);
    
    // File upload
    const uploadFileInput = document.getElementById('upload-file');
    if (uploadFileInput) {
        uploadFileInput.addEventListener('change', (e) => {
            const fileName = e.target.files[0]?.name || 'No file chosen';
            const fileNameEl = document.getElementById('file-name');
            if (fileNameEl) fileNameEl.textContent = fileName;
        });
    }
    
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
    const courseFilter = document.getElementById('course-filter');
    if (courseFilter) courseFilter.addEventListener('change', renderResources);
    
    const typeFilter = document.getElementById('type-filter');
    if (typeFilter) typeFilter.addEventListener('change', renderResources);
    
    const yearFilter = document.getElementById('year-filter');
    if (yearFilter) yearFilter.addEventListener('change', renderResources);
    
    const searchNotes = document.getElementById('search-notes');
    if (searchNotes) searchNotes.addEventListener('input', renderResources);
    
    // Forum categories
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            renderForumPosts(chip.dataset.category);
        });
    });
}

// Set view mode (cards or list) - make it global
window.setViewMode = function(mode) {
    viewMode = mode;
    localStorage.setItem('noteify_view_mode', mode);
    
    // Update button styles
    const cardsBtn = document.getElementById('view-cards-btn');
    const listBtn = document.getElementById('view-list-btn');
    if (cardsBtn && listBtn) {
        if (mode === 'cards') {
            cardsBtn.classList.add('btn-primary');
            cardsBtn.classList.remove('btn-secondary');
            listBtn.classList.remove('btn-primary');
            listBtn.classList.add('btn-secondary');
        } else {
            listBtn.classList.add('btn-primary');
            listBtn.classList.remove('btn-secondary');
            cardsBtn.classList.remove('btn-primary');
            cardsBtn.classList.add('btn-secondary');
        }
    }
    
    // Update container class
    const container = document.getElementById('resources-grid');
    if (container) {
        if (mode === 'list') {
            container.classList.add('resources-list-view');
        } else {
            container.classList.remove('resources-list-view');
        }
    }
    
    renderResources();
};

// Load view mode from localStorage
function loadViewMode() {
    const savedMode = localStorage.getItem('noteify_view_mode');
    if (savedMode === 'list' || savedMode === 'cards') {
        setViewMode(savedMode);
    }
}

// Resources
function renderResources() {
    const courseFilterEl = document.getElementById('course-filter');
    const typeFilterEl = document.getElementById('type-filter');
    const yearFilterEl = document.getElementById('year-filter');
    const searchNotesEl = document.getElementById('search-notes');
    const container = document.getElementById('resources-grid');
    
    if (!courseFilterEl || !typeFilterEl || !yearFilterEl || !searchNotesEl || !container) {
        return; // Elements not ready yet
    }
    
    const courseFilter = courseFilterEl.value;
    const typeFilter = typeFilterEl.value;
    const yearFilter = yearFilterEl.value;
    const searchTerm = searchNotesEl.value.toLowerCase();
    
    let filtered = resources.filter(resource => {
        const matchesCourse = courseFilter === 'all' || resource.course === courseFilter;
        const matchesType = typeFilter === 'all' || resource.type === typeFilter;
        const matchesYear = yearFilter === 'all' || resource.year.toString() === yearFilter;
        const matchesSearch = resource.title.toLowerCase().includes(searchTerm) ||
                            resource.description.toLowerCase().includes(searchTerm);
        
        return matchesCourse && matchesType && matchesYear && matchesSearch;
    });
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 3rem;">No resources found. Try adjusting your filters.</p>';
        return;
    }
    
    if (viewMode === 'list') {
        // List view
        container.innerHTML = filtered.map(resource => {
            const fileUrl = resource.file_path
                ? `../${resource.file_path.replace(/^\/+/, '')}`
                : null;
            
            return `
            <div class="resource-list-item" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; border-bottom: 1px solid var(--border-color);">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                        <span class="resource-type ${resource.type}" style="font-size: 0.85rem;">${getTypeIcon(resource.type)} ${getTypeLabel(resource.type)}</span>
                        <h3 style="margin: 0; font-size: 1.1rem;">${resource.title}</h3>
                    </div>
                    <div style="display: flex; gap: 1.5rem; color: var(--text-secondary); font-size: 0.9rem;">
                        <span><i class="fa-solid fa-graduation-cap"></i> ${resource.course}</span>
                        <span><i class="fa-regular fa-calendar-days"></i> ${resource.year}</span>
                        <span><i class="fa-regular fa-eye"></i> ${resource.views} views</span>
                        <span><i class="fa-solid fa-download"></i> ${resource.downloads} downloads</span>
                        <span><img src="${resource.authorAvatar}" alt="${resource.author}" style="width: 20px; height: 20px; border-radius: 50%; vertical-align: middle; margin-right: 0.25rem;"> ${resource.author || 'Unknown'}</span>
                    </div>
                    ${resource.description ? `<p style="margin: 0.5rem 0 0 0; color: var(--text-secondary); font-size: 0.9rem;">${resource.description.substring(0, 100)}${resource.description.length > 100 ? '...' : ''}</p>` : ''}
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    ${fileUrl ? `
                        <a class="btn btn-secondary" href="${fileUrl}" target="_blank" style="padding: 0.5rem 1rem;">
                            <i class="fa-regular fa-eye"></i> View
                        </a>
                        <a class="btn btn-primary" href="${fileUrl}" download style="padding: 0.5rem 1rem;">
                            <i class="fa-solid fa-download"></i> Download
                        </a>
                    ` : `
                        <button class="btn btn-secondary" disabled style="padding: 0.5rem 1rem;">View</button>
                        <button class="btn btn-primary" disabled style="padding: 0.5rem 1rem;">Download</button>
                    `}
                </div>
            </div>
            `;
        }).join('');
    } else {
        // Card view (default)
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
    
    // Get current user ID from session
    let userId = 1; // Default fallback
    try {
        const userResponse = await fetch('../backend/api/current_user.php');
        const userData = await userResponse.json();
        if (userData.user_id) {
            userId = userData.user_id;
        }
    } catch (error) {
        console.error('Error getting user ID:', error);
        // Use default if API fails
    }
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('course', course);
    formData.append('type', type);
    formData.append('year', year);
    formData.append('uploaded_by', userId);
    formData.append('file', fileInput.files[0]);
    
    try {
        const response = await fetch('../backend/api/upload.php', {
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
        const response = await fetch('../backend/api/forum.php');
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
        <div class="forum-post" data-post-id="${post.id}" style="cursor: pointer;">
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
    
    // Add click event listeners to forum posts
    container.querySelectorAll('.forum-post').forEach(postEl => {
        postEl.addEventListener('click', function(e) {
            e.stopPropagation();
            const postId = parseInt(this.getAttribute('data-post-id'));
            console.log('Forum post clicked, ID:', postId);
            if (postId && !isNaN(postId)) {
                if (typeof openPostDetail === 'function') {
                    openPostDetail(postId);
                } else {
                    console.error('openPostDetail function not found');
                }
            } else {
                console.error('Invalid post ID:', postId);
            }
        });
    });
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
        const response = await fetch('../backend/api/forum.php', {
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

window.openPostDetail = function(id) {
    console.log('openPostDetail called with ID:', id);
    console.log('Available forum posts:', forumPosts);
    
    // Try to find post by ID (handle both string and number IDs)
    currentPost = forumPosts.find(p => p.id == id || p.id === parseInt(id));
    
    if (!currentPost) {
        console.error('Post not found with ID:', id);
        alert('Post not found. Please refresh the page.');
        return;
    }
    
    console.log('Found post:', currentPost);
    
    const modal = document.getElementById('post-detail-modal');
    if (!modal) {
        console.error('Post detail modal not found in DOM');
        return;
    }
    
    modal.classList.add('active');
    document.getElementById('post-detail-title').textContent = currentPost.title;
    document.getElementById('post-detail-avatar').src = getForumAvatar(currentPost.author, currentPost.authorAvatar);
    document.getElementById('post-detail-author').textContent = currentPost.author;
    document.getElementById('post-detail-time').textContent = currentPost.time;
    document.getElementById('post-detail-category').innerHTML = `${CATEGORY_ICONS[currentPost.category] || ''} ${currentPost.category}`;
    document.getElementById('post-detail-category').className = `category-badge ${currentPost.category}`;
    document.getElementById('post-detail-content').textContent = currentPost.content;
    
    loadCommentsForCurrentPost();
};

function closePostDetailModal() {
    document.getElementById('post-detail-modal').classList.remove('active');
    currentPost = null;
}

async function loadCommentsForCurrentPost() {
    if (!currentPost) return;

    try {
        const response = await fetch(`../backend/api/comments.php?post_id=${currentPost.id}`);
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
        const response = await fetch('../backend/api/comments.php', {
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

window.selectRoomColor = function(color) {
    document.querySelectorAll('#room-color-picker .color-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.color === color);
    });
};

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

window.joinRoom = function(id) {
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
};

window.viewRoomDetails = function(id) {
    const room = rooms.find(r => r.id === id);
    if (!room) {
        alert('Room not found!');
        return;
    }
    openChatRoom(id);
};

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
async function initializeProfile() {
    // Load real profile data from API
    await loadUserProfile();
    
    updateProfileDisplay();
    
    document.getElementById('save-profile-btn').addEventListener('click', saveProfile);
    document.getElementById('change-avatar-btn').addEventListener('click', changeAvatar);
    const avatarInput = document.getElementById('avatar-file');
    if (avatarInput) {
        avatarInput.addEventListener('change', handleAvatarFileChange);
    }
    
    renderUserContributions();
}

// Load user profile from database
async function loadUserProfile() {
    try {
        const response = await fetch('../backend/api/user_profile.php');
        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }
        const data = await response.json();
        
        if (data.error) {
            console.error('Profile error:', data.error);
            return; // Keep default static data
        }
        
        // Update userProfile with real data
        userProfile.name = data.fullname || data.username || 'Student User';
        userProfile.email = data.email || 'student@university.edu';
        userProfile.course = data.course || 'Computer Science';
        userProfile.year = data.year || '3';
        userProfile.bio = data.bio || 'Passionate about learning and sharing knowledge with fellow students.';
        
        // Set avatar - use profile_pic if available, otherwise generate from name
        if (data.profile_pic && data.profile_pic !== 'default.png' && data.profile_pic !== 'uploads/default.png') {
            userProfile.avatar = `../${data.profile_pic}`;
        } else {
            userProfile.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name)}&background=a855f7&color=fff&size=200`;
        }
        
        // Update stats from database
        userProfile.notes_count = parseInt(data.notes_count) || 0;
        userProfile.total_views = parseInt(data.total_views) || 0;
        userProfile.total_downloads = parseInt(data.total_downloads) || 0;
        
        // Persist to localStorage
        persistUserProfile();
    } catch (error) {
        console.error('Error loading user profile:', error);
        // Keep default static data if API fails
    }
}

function updateProfileDisplay() {
    const profileDisplayName = document.getElementById('profile-display-name');
    const profileEmail = document.querySelector('.profile-email');
    const editName = document.getElementById('edit-name');
    const editCourse = document.getElementById('edit-course');
    const editYear = document.getElementById('edit-year');
    const editBio = document.getElementById('edit-bio');
    const profileAvatar = document.getElementById('profile-avatar');
    
    if (profileDisplayName) profileDisplayName.textContent = userProfile.name;
    if (profileEmail) profileEmail.textContent = userProfile.email || 'student@university.edu';
    if (editName) editName.value = userProfile.name;
    if (editCourse) editCourse.value = userProfile.course;
    if (editYear) editYear.value = userProfile.year;
    if (editBio) editBio.value = userProfile.bio;
    if (profileAvatar) profileAvatar.src = userProfile.avatar;
    
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
    
    // Use stats from database if available, otherwise calculate from resources
    const statsValue = document.querySelectorAll('.stat-value');
    if (statsValue.length >= 3) {
        if (userProfile.notes_count !== undefined) {
            // Use database stats
            statsValue[0].textContent = userProfile.notes_count;
            statsValue[1].textContent = userProfile.total_views || 0;
            statsValue[2].textContent = userProfile.total_downloads || 0;
        } else {
            // Fallback: calculate from resources
            const userResources = resources.filter(r => r.author === userProfile.name);
            const totalViews = userResources.reduce((sum, r) => sum + (r.views || 0), 0);
            const totalDownloads = userResources.reduce((sum, r) => sum + (r.downloads || 0), 0);
            statsValue[0].textContent = userResources.length;
            statsValue[1].textContent = totalViews;
            statsValue[2].textContent = totalDownloads;
        }
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

        const response = await fetch('../backend/api/avatar.php', {
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

function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.type = field.type === 'password' ? 'text' : 'password';
    }
}

function validateLogin() {
    const username = document.getElementById('username')?.value;
    const password = document.getElementById('password')?.value;
    
    if (!username || !password) {
        alert('Please fill in all fields');
        return false;
    }
    
    return true;
}

function validateRegister() {
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirm_password')?.value;
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return false;
    }
    
    return true;
}
