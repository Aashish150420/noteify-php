# Noteify - College Notes & Resources Platform

A full-stack web application for sharing college notes and resources with user authentication, admin panel, and forum features.

## Tech Stack
- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: PHP (no frameworks)
- **Database**: MySQL (raw SQL)
- **Storage**: Local file system (uploads folder)
- **Authentication**: PHP Sessions

## Features

### User Features
- ✅ User registration and login with secure authentication
- ✅ Upload and download study materials (PDFs, Word docs)
- ✅ Forum discussions with categories and comments
- ✅ User profiles with avatar uploads and bio
- ✅ Filter and search resources by course, type, and year
- ✅ Study rooms (chat functionality)
- ✅ View statistics (views, downloads)
- ✅ Click on forum posts to view details and comments
- ✅ View profile pictures of all users in notes

### Admin Features
- ✅ **Dashboard**: View total users, notes, and recent uploads statistics
- ✅ **User Management**: 
  - View all users with their details
  - Activate/deactivate user accounts
  - Delete user accounts
  - View user notes count
- ✅ **Notes Management**:
  - View all uploaded notes
  - Approve/reject notes (status management)
  - Delete notes
  - View author information
- ✅ **Forum Moderation**:
  - View all forum posts and comments
  - Delete posts and comments
  - Moderate discussions
- ✅ **Profile Management**: Update admin profile and avatar

## Setup Instructions

### 1. Database Setup
1. Open phpMyAdmin (http://localhost/phpmyadmin)
2. Import the `backend/database.sql` file or run it in SQL tab
3. This will create:
   - Database: `noteify_db`
   - Tables: `users`, `notes`, `forum_posts`, `forum_comments`
   - Columns: The schema includes `status` columns for `users` and `notes` tables (added automatically if missing)

**Note**: The application automatically adds the `status` column to `users` and `notes` tables if they don't exist. This allows for:
- User account activation/deactivation
- Note approval/rejection workflow

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

#### GET `/backend/api/admin/users.php`
Returns all users with their status, notes count, and profile information.

**Response:**
```json
[
  {
    "id": 1,
    "fullname": "John Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "role": "user",
    "status": "active",
    "notes_count": 5,
    "profile_pic": "uploads/avatars/..."
  }
]
```

#### PUT `/backend/api/admin/users.php`
Activate or deactivate a user account.

**JSON Body:**
```json
{
  "user_id": 1,
  "status": "active|inactive"
}
```

#### DELETE `/backend/api/admin/users.php`
Delete a user account.

**JSON Body:**
```json
{
  "user_id": 1
}
```

#### GET `/backend/api/admin/notes.php`
Returns all notes with author information and status for admin management.

**Response:**
```json
[
  {
    "note_id": 1,
    "title": "Note Title",
    "author_name": "John Doe",
    "status": "approved|pending|rejected",
    "views": 10,
    "downloads": 5
  }
]
```

#### PUT `/backend/api/admin/notes.php`
Approve or reject a note.

**JSON Body:**
```json
{
  "note_id": 1,
  "status": "approved|rejected"
}
```

#### DELETE `/backend/api/admin/notes.php`
Delete a note.

**JSON Body:**
```json
{
  "note_id": 1
}
```

#### GET `/backend/api/admin/forum.php?type=posts`
Returns all forum posts for admin management.

#### GET `/backend/api/admin/forum.php?type=comments`
Returns all forum comments for admin management.

#### DELETE `/backend/api/admin/forum.php`
Deletes a forum post or comment.

**JSON Body:**
```json
{
  "type": "post|comment",
  "id": 123
}
```

#### GET `/backend/api/admin/profile.php`
Returns admin profile information.

#### POST `/backend/api/admin/profile.php`
Updates admin profile and avatar.

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

## Git Configuration

The `.gitignore` file excludes the following from version control:
- **User uploads**: `uploads/` directory (all user-generated content)
- **Image files**: `*.jpg`, `*.jpeg`, `*.png`, `*.gif`, `*.webp`, etc.
- **Document files**: `*.pdf`, `*.doc`, `*.docx`, `*.xls`, etc.
- **OS files**: `.DS_Store`, `Thumbs.db`, `desktop.ini`
- **IDE files**: `.vscode/`, `.idea/`, `*.swp`, `*.swo`
- **Logs and temporary files**: `*.log`, `*.tmp`, `*.temp`
- **PHP cache**: `*.cache`

This keeps the repository clean and prevents large files from being tracked.

## Recent Updates

### Version 2.0 - Admin Panel Enhancement
- ✅ **Admin Dashboard**: Real-time statistics for users, notes, and recent uploads
- ✅ **User Management**: Complete CRUD operations for user accounts
  - View all users with detailed information
  - Activate/deactivate user accounts
  - Delete user accounts with safety checks
- ✅ **Notes Management**: Full moderation system
  - View all notes with author details
  - Approve/reject notes with status management
  - Delete notes functionality
- ✅ **Forum Moderation**: Enhanced moderation tools
  - View all posts and comments
  - Delete posts and comments
  - Toggle between posts and comments view
- ✅ **UI Improvements**: Consistent design across all pages
  - Modern card-based form design
  - Improved login, register, and admin login pages
  - Better spacing and layout consistency
  - Icons for better user experience
- ✅ **Bug Fixes**:
  - Fixed forum post click handler (now opens post details and comments)
  - Fixed profile pictures display for all users in notes
  - Fixed database query errors (created_at column issue)
  - Improved error handling in admin APIs
- ✅ **Technical Updates**:
  - Updated `.gitignore` to exclude image files and user uploads
  - Enhanced API responses with profile picture data
  - Improved event handling and error messages
  - Added better debugging and validation

### Version 1.0 - Initial Release
- ✅ Fixed syntax error in `app.js` (missing closing brace)
- ✅ Fixed admin profile picture path issue
- ✅ Added user authentication and sessions
- ✅ Added forum and comments functionality
- ✅ Added profile management with avatar uploads
- ✅ Added `.gitignore` to exclude uploads directory

## Admin Panel Features

### Dashboard
- **Statistics Overview**: 
  - Total number of users
  - Total number of notes
  - Recent uploads list
- **Quick Actions**: Easy navigation to management pages

### User Management
- View all registered users with:
  - Full name, email, username
  - Role (user/admin)
  - Notes count
  - Account status (active/inactive)
- Actions available:
  - Activate inactive accounts
  - Deactivate active accounts
  - Delete user accounts (with safety checks)
- **Safety Features**: 
  - Cannot delete own account
  - Cannot modify admin accounts

### Notes Management
- View all uploaded notes with:
  - Title, author, course, type
  - Views and downloads count
  - Approval status
- Actions available:
  - Approve pending notes
  - Reject notes
  - Delete notes
- **Status System**: 
  - `approved`: Visible to all users
  - `pending`: Awaiting approval
  - `rejected`: Hidden from users

### Forum Moderation
- View all forum posts and comments
- Delete inappropriate content
- Toggle between posts and comments view
- See author information for all content

## Database Schema

### Users Table
- `id`: Primary key
- `fullname`, `email`, `username`: User information
- `password`: Hashed password
- `role`: 'user' or 'admin'
- `status`: 'active' or 'inactive' (auto-added if missing)
- `profile_pic`: Path to profile picture
- `course`, `year`, `bio`: Additional user details

### Notes Table
- `note_id`: Primary key
- `title`, `description`, `course`, `type`, `year`: Note details
- `file_path`: Path to uploaded file
- `uploaded_by`: Foreign key to users table
- `views`, `downloads`: Statistics
- `status`: 'approved', 'pending', or 'rejected' (auto-added if missing)
- `created_at`: Timestamp

### Forum Tables
- `forum_posts`: Stores forum posts with categories
- `forum_comments`: Stores comments linked to posts

## Notes

- The application uses PHP sessions for authentication
- Admin accounts can manage all content (notes, forum posts, users)
- User profiles persist across sessions
- Forum posts support categories: homework, exams, discussion, projects, general
- Profile pictures are stored in `uploads/avatars/` directory
- Notes are stored in `uploads/` directory
- All user-uploaded files are excluded from git via `.gitignore`
- The application uses RESTful API architecture for frontend-backend communication
- Database schema is automatically updated (status columns added if missing)

## Troubleshooting

### Profile Pictures Not Showing
- Check that `uploads/avatars/` directory exists and has write permissions
- Verify the profile picture path in the database
- Clear browser cache (hard refresh: Ctrl+F5)

### Forum Posts Not Clickable
- Check browser console for JavaScript errors
- Ensure `post-detail-modal` exists in the HTML
- Verify that `openPostDetail` function is defined

### Admin Panel Errors
- Ensure you're logged in as an admin user
- Check that session is active
- Verify database connection in `config/db.php`
- Check browser console for API errors

### Database Connection Issues
- Verify XAMPP MySQL is running
- Check credentials in `config/db.php`
- Ensure database `noteify_db` exists

