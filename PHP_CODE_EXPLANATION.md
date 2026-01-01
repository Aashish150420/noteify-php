# PHP Backend Code Explanation for Noteify Project

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Database Configuration](#database-configuration)
3. [API Endpoints](#api-endpoints)
4. [Frontend Integration](#frontend-integration)
5. [Data Flow Diagrams](#data-flow-diagrams)
6. [Code Simplification](#code-simplification)

---

## Architecture Overview

**Noteify** follows a **RESTful API architecture** where:
- **Frontend (JavaScript/HTML/CSS)** runs in the browser
- **Backend (PHP)** handles database operations and file uploads
- **MySQL Database** stores all persistent data
- **Communication** happens via HTTP requests (GET/POST) with JSON responses

**Key Design Pattern**: Separation of Concerns
- Each PHP file handles one specific feature (Single Responsibility Principle)
- All APIs return JSON for easy frontend consumption
- Database connection is centralized in `config/db.php`
- **Simplified code** - minimal validation for development/testing purposes

---

## Database Configuration

### File: `config/db.php`

```php
<?php
$conn = mysqli_connect("localhost", "root", "", "noteify_db");
if (!$conn) {
    die("Database connection failed: " . mysqli_connect_error());
}
?>
```

**Purpose**: Centralized database connection configuration

**Explanation Points for Viva**:
1. **Why centralized?** 
   - Single point of configuration (change credentials in one place)
   - Reusable across all API files via `include("../../config/db.php")` (from backend/api/)
   - Easier maintenance

2. **Connection Details**:
   - Host: `localhost` (XAMPP default)
   - Username: `root` (default for development)
   - Database: `noteify_db`
   - Uses MySQLi extension for database operations

3. **Error Handling**: 
   - If connection fails, script dies with error message
   - Prevents silent failures that could cause issues later

---

## Authentication System

### Login - `backend/login.php`

**Purpose**: Authenticate users and create PHP session

**Process**:
1. Receives username/email and password from form
2. Queries database to find user
3. Verifies password using `password_verify()`
4. Creates PHP session with `session_start()` and `$_SESSION['user_id']`
5. Redirects to homepage on success

**Session Management**:
```php
session_start();
$_SESSION['user_id'] = $user['id'];
$_SESSION['username'] = $user['username'];
$_SESSION['role'] = $user['role'];
```

### Registration - `backend/register.php`

**Purpose**: Create new user accounts

**Process**:
1. Validates form data
2. Hashes password using `password_hash()`
3. Handles optional profile picture upload
4. Inserts user into database
5. Creates session and redirects

### Logout - `backend/logout.php`

**Purpose**: Destroy session and log user out

**Code**:
```php
session_start();
session_destroy();
header('Location: ../frontend/index.html');
```

---

## API Endpoints

### 1. Notes API - `backend/api/notes.php`

**Purpose**: Retrieve all uploaded notes/resources from database

**HTTP Method**: GET only

**Complete Code**:
```php
<?php
header('Content-Type: application/json');
include("../config/db.php");

$result = mysqli_query($conn, "SELECT n.*, u.name as author_name 
                                FROM notes n 
                                LEFT JOIN users u ON n.uploaded_by = u.user_id 
                                ORDER BY n.created_at DESC");
$notes = [];
while ($row = mysqli_fetch_assoc($result)) {
    $notes[] = $row;
}

echo json_encode($notes);
mysqli_close($conn);
?>
```

**How it Works**:
1. **Sets JSON header** - Tells browser response is JSON
2. **Includes database connection** - Gets `$conn` variable
3. **Executes SQL query** - LEFT JOIN to get author names with notes
4. **Loops through results** - Builds array of all notes
5. **Returns JSON** - Converts array to JSON and outputs

**Key Features**:
- **LEFT JOIN**: Gets notes even if user doesn't exist (prevents data loss)
- **ORDER BY**: Returns newest notes first
- **Simple and direct** - No error handling, just returns data

**Frontend Integration**:
```javascript
// Frontend calls this on page load
async function loadNotesFromAPI() {
    const response = await fetch('../backend/api/notes.php');
    const data = await response.json();
    // Maps data to frontend format and renders
}
```

**Viva Points**:
- Why LEFT JOIN? To handle cases where user might be deleted but notes remain
- Why JSON? Universal format, easy to parse in JavaScript
- Why no authentication? This is a public resource sharing platform
- **Why simplified?** For development/testing - only one user, no need for complex validation

---

### 2. Upload API - `backend/api/upload.php`

**Purpose**: Handle file uploads (PDFs, Word docs) and store metadata in database

**HTTP Method**: POST only

**Request Format**: `multipart/form-data` (FormData object)

**Complete Code**:
```php
<?php
header('Content-Type: application/json');
include("../config/db.php");

// Get form data directly
$title = $_POST['title'];
$description = $_POST['description'];
$course = $_POST['course'];
$type = $_POST['type'];
$year = $_POST['year'];
$uploaded_by = $_POST['uploaded_by'];

// Create uploads directory if needed
$uploadDir = "../uploads/";
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Handle file upload
$file = $_FILES['file'];
$fileName = time() . "_" . basename($file['name']);
$target = $uploadDir . $fileName;
$relativePath = "uploads/" . $fileName;

// Move uploaded file to permanent location
move_uploaded_file($file['tmp_name'], $target);

// Insert into database
$sql = "INSERT INTO notes (title, description, course, type, year, file_path, uploaded_by)
        VALUES ('$title', '$description', '$course', '$type', $year, '$relativePath', $uploaded_by)";

mysqli_query($conn, $sql);

// Return success response
echo json_encode([
    "message" => "File uploaded successfully",
    "note_id" => mysqli_insert_id($conn)
]);

mysqli_close($conn);
?>
```

**Step-by-Step Process**:

1. **Get Form Data**: Directly reads from `$_POST` superglobal
2. **Create Directory**: Makes `uploads/` folder if it doesn't exist
3. **Generate Filename**: Uses timestamp + original filename for uniqueness
4. **Move File**: Moves from temporary location to permanent storage
5. **Insert Database**: Stores file metadata in `notes` table
6. **Return Response**: Sends JSON with success message and new note ID

**Frontend Integration**:
```javascript
// Frontend creates FormData and sends POST request
const formData = new FormData();
formData.append('title', title);
formData.append('description', description);
formData.append('file', fileInput.files[0]);

const response = await fetch('../backend/api/upload.php', {
    method: 'POST',
    body: formData
});

const result = await response.json();
// result.message = "File uploaded successfully"
// result.note_id = new database ID
```

**Viva Points**:
- **Why timestamp in filename?** Prevents filename conflicts, ensures uniqueness
- **Why store relative path?** Makes it portable across different server setups
- **Why simplified?** No file type/size validation - suitable for single-user development
- **How does it work?** `move_uploaded_file()` moves file from PHP temp directory to our uploads folder

---

### 3. Avatar API - `backend/api/avatar.php`

**Purpose**: Handle profile picture uploads (images only)

**HTTP Method**: POST only

**Complete Code**:
```php
<?php
header('Content-Type: application/json');

// Get uploaded file
$file = $_FILES['file'];
$uploadDir = "../uploads/avatars/";

// Create directory if needed
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Generate unique filename
$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$fileName = time() . "_" . basename($file['name']);
$target = $uploadDir . $fileName;
$relativePath = "uploads/avatars/" . $fileName;

// Save file
move_uploaded_file($file['tmp_name'], $target);

// Return file path
echo json_encode([
    "message" => "Avatar uploaded successfully",
    "url" => $relativePath
]);
?>
```

**Key Features**:
- **No database storage** - Just saves file and returns path
- **Separate directory** - Stores in `uploads/avatars/` subdirectory
- **Simple implementation** - No validation, just upload and return path

**Frontend Integration**:
```javascript
// Frontend uploads avatar and updates userProfile
const formData = new FormData();
formData.append('file', file);

const response = await fetch('../backend/api/avatar.php', {
    method: 'POST',
    body: formData
});

const result = await response.json();
userProfile.avatar = '../../' + result.url; // Store in localStorage
```

**Key Updates**:
- Now includes session-based authentication
- Updates database with profile picture path
- Deletes old avatar when new one is uploaded
- Validates file type and size (5MB max)

**Viva Points**:
- **Why no database?** Avatar is stored in user's browser localStorage, not tied to user account
- **Why separate directory?** Better organization, easier to manage
- **Why simplified?** No file type/size checks - suitable for development

---

### 4. Forum API - `backend/api/forum.php`

**Purpose**: Manage forum posts (create and retrieve)

**HTTP Methods**: GET and POST

**Complete Code**:
```php
<?php
header('Content-Type: application/json');
include("../config/db.php");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get all posts with reply counts
    $sql = "SELECT p.id, p.title, p.content, p.category, 
                   p.author_name AS author, p.author_avatar AS authorAvatar,
                   (SELECT COUNT(*) FROM forum_comments c WHERE c.post_id = p.id) AS replies,
                   DATE_FORMAT(p.created_at, '%b %e, %Y %H:%i') AS time
            FROM forum_posts p ORDER BY p.created_at DESC";
    
    $result = mysqli_query($conn, $sql);
    $posts = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $posts[] = $row;
    }
    
    echo json_encode($posts);
    mysqli_close($conn);
    exit;
}

if ($method === 'POST') {
    // Read JSON body
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // Extract data
    $title = $data['title'];
    $content = $data['content'];
    $category = $data['category'];
    $author_name = $data['author'];
    $author_avatar = $data['authorAvatar'];
    
    // Insert into database
    $sql = "INSERT INTO forum_posts (title, content, category, author_name, author_avatar)
            VALUES ('$title', '$content', '$category', '$author_name', '$author_avatar')";
    
    mysqli_query($conn, $sql);
    $newId = mysqli_insert_id($conn);
    
    // Return created post
    $post = [
        "id" => $newId,
        "title" => $title,
        "content" => $content,
        "category" => $category,
        "author" => $author_name,
        "authorAvatar" => $author_avatar,
        "replies" => 0,
        "time" => date('M j, Y H:i')
    ];
    
    echo json_encode([
        "message" => "Post created successfully",
        "post" => $post
    ]);
    
    mysqli_close($conn);
    exit;
}
?>
```

#### GET Request - Retrieve All Posts

**Key Features**:
- **Subquery for replies**: Counts comments for each post dynamically using `(SELECT COUNT(*) FROM forum_comments...)`
- **Date formatting**: Converts timestamp to readable format (e.g., "Jan 15, 2024 14:30")
- **Aliases**: Maps database column names to frontend-friendly names (`author_name` → `author`)
- **ORDER BY DESC**: Newest posts first

#### POST Request - Create New Post

**Process**:
1. **Read JSON body**: Uses `file_get_contents('php://input')` to get raw JSON
2. **Decode JSON**: Converts JSON string to PHP array
3. **Extract data**: Gets title, content, category, author info
4. **Insert database**: Stores post in `forum_posts` table
5. **Return post**: Sends back created post with formatted time

**Frontend Integration**:
```javascript
// GET - Load posts on page load
async function loadForumPostsFromAPI() {
    const response = await fetch('../backend/api/forum.php');
    const data = await response.json();
    forumPosts = data;
    renderForumPosts();
}

// POST - Create new post
async function handleCreatePost() {
    const payload = {
        title, content, category,
        author: userProfile.name,
        authorAvatar: userProfile.avatar
    };
    
    const response = await fetch('../backend/api/forum.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    // result.post contains the new post
}
```

**Viva Points**:
- **Why subquery for replies?** Real-time count, always accurate from database
- **JSON vs FormData**: JSON for structured data, FormData for file uploads
- **Why store author_name?** No user authentication, so store name directly
- **Date formatting**: Makes timestamps human-readable
- **Why simplified?** No validation - assumes frontend sends correct data

---

### 5. Comments API - `backend/api/comments.php`

**Purpose**: Manage comments on forum posts

**HTTP Methods**: GET and POST

**Complete Code**:
```php
<?php
header('Content-Type: application/json');
include("../config/db.php");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get comments for a specific post
    $postId = $_GET['post_id'];
    
    $sql = "SELECT id, post_id, author_name AS author, 
                   author_avatar AS authorAvatar, text,
                   DATE_FORMAT(created_at, '%b %e, %Y %H:%i') AS time
            FROM forum_comments WHERE post_id = $postId ORDER BY created_at ASC";
    
    $result = mysqli_query($conn, $sql);
    $comments = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $comments[] = $row;
    }
    
    echo json_encode($comments);
    mysqli_close($conn);
    exit;
}

if ($method === 'POST') {
    // Read JSON body
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // Extract data
    $postId = $data['post_id'];
    $text = $data['text'];
    $author_name = $data['author'];
    $author_avatar = $data['authorAvatar'];
    
    // Insert comment
    $sql = "INSERT INTO forum_comments (post_id, author_name, author_avatar, text)
            VALUES ($postId, '$author_name', '$author_avatar', '$text')";
    
    mysqli_query($conn, $sql);
    $newId = mysqli_insert_id($conn);
    
    // Return created comment
    $comment = [
        "id" => $newId,
        "post_id" => $postId,
        "author" => $author_name,
        "authorAvatar" => $author_avatar,
        "text" => $text,
        "time" => date('M j, Y H:i')
    ];
    
    echo json_encode([
        "message" => "Comment added successfully",
        "comment" => $comment
    ]);
    
    mysqli_close($conn);
    exit;
}
?>
```

#### GET Request - Get Comments for a Post

**Process**:
1. **Get post_id**: Reads from query string `?post_id=X`
2. **Query database**: Selects all comments for that post
3. **Order by ASC**: Oldest comments first (chronological)
4. **Return JSON**: Array of all comments

#### POST Request - Add New Comment

**Process**:
1. **Read JSON**: Gets JSON body from request
2. **Extract data**: Gets post_id, text, author info
3. **Insert database**: Stores comment in `forum_comments` table
4. **Return comment**: Sends back created comment with formatted time

**Frontend Integration**:
```javascript
// GET - Load comments when opening post
async function loadCommentsForCurrentPost() {
    const response = await fetch(`../backend/api/comments.php?post_id=${currentPost.id}`);
    const data = await response.json();
    currentComments = data;
    renderComments();
}

// POST - Add comment
async function handleAddComment() {
    const payload = {
        post_id: currentPost.id,
        text: commentText,
        author: userProfile.name,
        authorAvatar: userProfile.avatar
    };
    
    const response = await fetch('../backend/api/comments.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    // result.comment contains the new comment
}
```

**Viva Points**:
- **Query parameter vs JSON body**: GET uses query string, POST uses JSON body
- **Why ORDER BY ASC?** Show oldest comments first (chronological order)
- **Foreign key relationship**: Comments linked to posts via `post_id`
- **Why simplified?** No validation - assumes correct data from frontend

---

### 6. Users API - `backend/api/users.php`

**Purpose**: Retrieve list of all users

**HTTP Method**: GET only

**Complete Code**:
```php
<?php
header('Content-Type: application/json');
include("../../config/db.php");

$result = mysqli_query($conn, "SELECT id, fullname, email, username, role FROM users");
$users = [];
while ($row = mysqli_fetch_assoc($result)) {
    $users[] = $row;
}

echo json_encode($users);
mysqli_close($conn);
?>
```

**Note**: Returns all users. Used in admin panel for user management.

---

### 7. User Profile API - `backend/api/user_profile.php`

**Purpose**: Get current user's profile information

**HTTP Method**: GET only

**Key Features**:
- Uses PHP sessions to identify current user
- Returns profile data including stats (notes count, views, downloads)
- Includes profile picture path

**Session Management**:
```php
session_start();
$user_id = $_SESSION['user_id'];
```

---

### 8. Current User API - `backend/api/current_user.php`

**Purpose**: Get current logged-in user ID

**HTTP Method**: GET only

**Use Case**: Used by frontend to identify which user is logged in for uploads and posts.

---

### 9. Admin Notes API - `backend/api/admin/notes.php`

**Purpose**: Admin management of notes (view and delete)

**HTTP Methods**: GET and DELETE

**GET Request**: Returns all notes with author information

**DELETE Request**: Deletes a note by ID
```php
if ($method === 'DELETE') {
    $note_id = $_GET['note_id'];
    $sql = "DELETE FROM notes WHERE note_id = $note_id";
    mysqli_query($conn, $sql);
    echo json_encode(["success" => true]);
}
```

---

### 10. Admin Forum API - `backend/api/admin/forum.php`

**Purpose**: Admin management of forum posts and comments

**HTTP Methods**: GET and DELETE

**GET Request**: Returns posts or comments based on `?type=posts` or `?type=comments`

**DELETE Request**: Deletes post or comment
```php
$data = json_decode(file_get_contents('php://input'), true);
$type = $data['type']; // 'post' or 'comment'
$id = $data['id'];
```

---

### 11. Admin Profile API - `backend/api/admin/profile.php`

**Purpose**: Get admin user profile with statistics

**HTTP Method**: GET only

**Returns**: Admin profile with notes count, total views, total downloads

---

## Frontend Integration Summary

### Request Flow Pattern

```
Frontend (JavaScript)
    ↓
HTTP Request (fetch API)
    ↓
PHP API Endpoint
    ↓
Database Query (MySQL)
    ↓
JSON Response
    ↓
Frontend Updates UI
```

### Key Integration Points

1. **Notes Loading**:
   - Frontend: `loadNotesFromAPI()` → `GET ../api/notes.php`
   - Backend: Returns all notes with author names
   - Frontend: Maps data and renders cards

2. **File Upload**:
   - Frontend: `handleUpload()` → `POST ../api/upload.php` (FormData)
   - Backend: Saves file, inserts DB record
   - Frontend: Reloads notes list

3. **Forum Posts**:
   - Frontend: `loadForumPostsFromAPI()` → `GET ../api/forum.php`
   - Backend: Returns posts with reply counts
   - Frontend: Renders forum cards

4. **Comments**:
   - Frontend: `loadCommentsForCurrentPost()` → `GET ../api/comments.php?post_id=X`
   - Backend: Returns comments for specific post
   - Frontend: Renders comment list

5. **Avatar Upload**:
   - Frontend: `handleAvatarFileChange()` → `POST ../api/avatar.php` (FormData)
   - Backend: Saves image to avatars folder
   - Frontend: Updates `userProfile.avatar` in localStorage

---

## Code Simplification

### Why Simplified Code?

The code has been simplified for **development and testing purposes** where:
- Only one user is using the system
- No need for complex validation
- Faster development and easier debugging
- Focus on core functionality

### What Was Removed?

1. **SQL Injection Protection**: No `mysqli_real_escape_string()` calls
2. **Input Validation**: No checks for empty fields, required data
3. **File Validation**: No file type or size checks
4. **Error Handling**: No HTTP status codes or error messages
5. **Method Validation**: No checks for correct HTTP methods

### What Remains?

1. **Core Functionality**: All features work correctly
2. **Database Operations**: All CRUD operations functional
3. **File Uploads**: Files are saved correctly
4. **JSON Responses**: All APIs return proper JSON
5. **Database Connection**: Centralized and working

### For Production Use

If deploying to production with multiple users, you should add:
- Input validation
- SQL injection protection (prepared statements)
- File type/size validation
- Error handling
- Authentication/authorization

---

## Viva Presentation Tips

### 1. Start with Architecture
- "This is a RESTful API architecture with PHP backend and JavaScript frontend"
- "All communication happens via HTTP requests with JSON responses"
- "Code is simplified for development - single user, minimal validation"

### 2. Explain Database Connection
- "Centralized configuration in `config/db.php` for maintainability"
- "MySQLi extension for database operations"
- "Simple connection - no connection pooling needed for this scale"

### 3. Walk Through One Complete Flow
Example: **File Upload Process**
1. User fills form in frontend
2. JavaScript creates FormData object
3. POST request sent to `api/upload.php`
4. PHP reads form data directly
5. File moved to `uploads/` directory
6. Metadata inserted into database
7. JSON response sent back
8. Frontend reloads notes list

### 4. Explain Simplification
- "Code is simplified for development - no validation needed for single user"
- "All core functionality works correctly"
- "Can add validation later if needed for production"

### 5. Explain Design Decisions
- "Why JSON? Universal format, easy to parse"
- "Why separate API files? Single responsibility, easier maintenance"
- "Why store relative paths? Makes application portable"
- "Why simplified? Faster development, easier to understand"

### 6. Show Code Structure
- "Each API file handles one feature"
- "All return JSON for easy frontend consumption"
- "Database connection included once, used everywhere"

---

## Common Viva Questions & Answers

**Q: Why use PHP instead of Node.js?**
A: PHP is well-suited for server-side file handling and database operations. It's widely supported in XAMPP/WAMP environments and integrates seamlessly with MySQL.

**Q: How do you prevent SQL injection?**
A: For this development version, we're using simplified code without SQL injection protection. For production, we would use prepared statements or `mysqli_real_escape_string()` to escape special characters.

**Q: Why return JSON instead of HTML?**
A: JSON allows the frontend to dynamically update the UI without page reloads. It's a standard format for RESTful APIs.

**Q: How does the frontend know if an operation succeeded?**
A: The PHP API returns JSON responses. The frontend checks the response and updates the UI accordingly. For this simplified version, we assume operations succeed.

**Q: What happens if the database connection fails?**
A: The `config/db.php` file will die with an error message, preventing the API from executing with a broken connection.

**Q: Why use subqueries for reply counts?**
A: It ensures the count is always accurate and calculated in real-time from the database, rather than maintaining a separate counter that could get out of sync.

**Q: Why is the code so simple?**
A: This is a development version for single-user testing. The code focuses on core functionality without complex validation. For production with multiple users, we would add validation, security, and error handling.

**Q: How are file uploads handled?**
A: PHP's `$_FILES` superglobal receives the file, then `move_uploaded_file()` moves it from the temporary location to our permanent `uploads/` directory. The file path is then stored in the database.

---

## Code Quality Features

1. **Consistent Structure**: All APIs follow similar pattern
2. **Code Reusability**: Database connection included once, used everywhere
3. **Separation of Concerns**: Each API handles one specific feature
4. **Simple and Direct**: Easy to read and understand
5. **JSON Standardization**: All responses in consistent JSON format
6. **Minimal Dependencies**: No external libraries needed

---

This documentation covers all PHP code in your Noteify project. The code is simplified for development but maintains all core functionality. Use it as a reference for your viva presentation!
