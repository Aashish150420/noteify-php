# Noteify - College Notes & Resources Platform

A full-stack web application for sharing college notes and resources with user authentication, admin panel, and forum features.

## Tech Stack
- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: PHP (no frameworks)
- **Database**: MySQL (raw SQL)
- **Storage**: Local file system (uploads folder)
- **Authentication**: PHP Sessions

## Features
- ✅ User registration and login
- ✅ Upload and download study materials (PDFs, Word docs)
- ✅ Forum discussions with comments
- ✅ User profiles with avatar uploads
- ✅ Admin panel for content management
- ✅ Filter and search resources
- ✅ Study rooms (chat functionality)
- ✅ View statistics (views, downloads)

## Setup Instructions

### 1. Database Setup
1. Open phpMyAdmin (http://localhost/phpmyadmin)
2. Import the `backend/database.sql` file or run it in SQL tab
3. This will create:
   - Database: `noteify_db`
   - Tables: `users`, `notes`, `forum_posts`, `forum_comments`
   - Sample data

### 2. Create Admin Account
Run the admin creation script:
```bash
php create_admin.php
```
Or access it via browser: `http://localhost/noteify-php/create_admin.php`

### 3. Configuration
- Database connection is configured in `config/db.php`
- Default settings (XAMPP):
  - Host: `localhost`
  - Username: `root`
  - Password: `` (empty)
  - Database: `noteify_db`

### 4. File Structure
```
noteify-php/
├── backend/
│   ├── api/
│   │   ├── admin/          # Admin API endpoints
│   │   │   ├── forum.php    # Admin forum management
│   │   │   ├── notes.php    # Admin notes management
│   │   │   ├── profile.php  # Admin profile
│   │   │   └── users.php   # User management
│   │   ├── avatar.php       # Avatar upload
│   │   ├── comments.php     # Forum comments
│   │   ├── current_user.php # Get current user
│   │   ├── forum.php        # Forum posts
│   │   ├── notes.php        # Get notes
│   │   ├── upload.php       # Upload files
│   │   ├── user_profile.php # User profile
│   │   └── users.php       # User list
│   ├── login.php            # User login
│   ├── logout.php           # Logout
│   ├── register.php         # User registration
│   └── database.sql         # Database schema
├── config/
│   └── db.php               # Database connection
├── frontend/
│   ├── admin/               # Admin panel
│   │   ├── index.html
│   │   └── admin.js
│   ├── cssfiles/
│   │   └── styles.css
│   ├── Homepage.html        # Main user interface
│   ├── index.html           # Login page
│   ├── register.html        # Registration page
│   ├── adminlogin.html      # Admin login
│   └── app.js               # Main JavaScript
├── uploads/
│   ├── avatars/             # Profile pictures
│   └── [files]              # Uploaded notes
├── create_admin.php         # Admin account creation
└── .gitignore               # Git ignore file
```

### 5. Running the Project
1. Start XAMPP (Apache and MySQL)
2. **For Users**: Open `http://localhost/noteify-php/frontend/index.html`
3. **For Admins**: Open `http://localhost/noteify-php/frontend/adminlogin.html`
4. Register a new account or login with existing credentials

## API Endpoints

### User Endpoints

#### GET `/backend/api/notes.php`
Returns JSON array of all notes with author information.

#### POST `/backend/api/upload.php`
Uploads a file and creates a note entry.

**Form Data:**
- `title` (required): Note title
- `description`: Note description
- `course`: Course name
- `type`: Type (notes, pastpaper, tutorial, reference)
- `year`: Year (integer)
- `uploaded_by`: User ID (integer)
- `file` (required): PDF/DOC file

#### POST `/backend/api/avatar.php`
Uploads a profile picture.

**Form Data:**
- `file` (required): Image file (JPEG, PNG, GIF, WebP)
- Max size: 5MB

#### GET `/backend/api/forum.php`
Returns JSON array of all forum posts.

#### POST `/backend/api/forum.php`
Creates a new forum post.

**JSON Body:**
```json
{
  "title": "Post title",
  "content": "Post content",
  "category": "homework|exams|discussion|projects|general",
  "author": "Author name",
  "authorAvatar": "Avatar URL"
}
```

#### GET `/backend/api/comments.php?post_id=X`
Returns comments for a specific post.

#### POST `/backend/api/comments.php`
Adds a comment to a post.

#### GET `/backend/api/user_profile.php`
Returns current user's profile information.

#### GET `/backend/api/current_user.php`
Returns current logged-in user ID.

### Admin Endpoints

#### GET `/backend/api/admin/notes.php`
Returns all notes for admin management.

#### DELETE `/backend/api/admin/notes.php?note_id=X`
Deletes a note.

#### GET `/backend/api/admin/forum.php?type=posts`
Returns all forum posts for admin management.

#### DELETE `/backend/api/admin/forum.php`
Deletes a forum post or comment.

**JSON Body:**
```json
{
  "type": "post|comment",
  "id": 123
}
```

#### GET `/backend/api/admin/users.php`
Returns all users.

#### GET `/backend/api/admin/profile.php`
Returns admin profile information.

## Authentication

- Users must register/login to upload content
- Session-based authentication using PHP sessions
- Admin accounts have special privileges
- Use `create_admin.php` to create admin accounts

## File Storage

- Notes: Stored in `uploads/` directory
- Avatars: Stored in `uploads/avatars/` directory
- Maximum file size: 10MB (notes), 5MB (avatars)
- Supported formats: PDF, DOC, DOCX (notes); JPEG, PNG, GIF, WebP (avatars)

## Recent Updates

- ✅ Fixed syntax error in `app.js` (missing closing brace)
- ✅ Fixed admin profile picture path issue
- ✅ Added complete admin panel with dashboard
- ✅ Added user authentication and sessions
- ✅ Added forum and comments functionality
- ✅ Added profile management with avatar uploads
- ✅ Added `.gitignore` to exclude uploads directory

## Notes

- The application uses PHP sessions for authentication
- Admin accounts can manage all content (notes, forum posts, users)
- User profiles persist across sessions
- Forum posts support categories: homework, exams, discussion, projects, general

