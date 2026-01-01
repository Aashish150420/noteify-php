# PHP API Quick Reference - Viva Cheat Sheet

## API Endpoints Overview

### User Endpoints

| Endpoint | Method | Purpose | Input | Output |
|----------|--------|---------|-------|--------|
| `backend/api/notes.php` | GET | Get all notes | None | JSON array of notes |
| `backend/api/upload.php` | POST | Upload file | FormData | JSON with note_id |
| `backend/api/avatar.php` | POST | Upload avatar | FormData | JSON with file URL |
| `backend/api/forum.php` | GET | Get all posts | None | JSON array of posts |
| `backend/api/forum.php` | POST | Create post | JSON body | JSON with new post |
| `backend/api/comments.php` | GET | Get comments | ?post_id=X | JSON array of comments |
| `backend/api/comments.php` | POST | Add comment | JSON body | JSON with new comment |
| `backend/api/users.php` | GET | Get all users | None | JSON array of users |
| `backend/api/user_profile.php` | GET | Get user profile | Session | JSON profile data |
| `backend/api/current_user.php` | GET | Get current user | Session | JSON user ID |

### Admin Endpoints

| Endpoint | Method | Purpose | Input | Output |
|----------|--------|---------|-------|--------|
| `backend/api/admin/notes.php` | GET | Get all notes | None | JSON array of notes |
| `backend/api/admin/notes.php` | DELETE | Delete note | ?note_id=X | JSON success/error |
| `backend/api/admin/forum.php` | GET | Get posts/comments | ?type=posts\|comments | JSON array |
| `backend/api/admin/forum.php` | DELETE | Delete post/comment | JSON body | JSON success/error |
| `backend/api/admin/users.php` | GET | Get all users | None | JSON array of users |
| `backend/api/admin/profile.php` | GET | Get admin profile | Session | JSON profile data |

---

## Key Code Patterns

### 1. Standard API Structure
```php
<?php
header('Content-Type: application/json');
include("../config/db.php");

// Process request
// ...

// Return JSON
echo json_encode($data);
mysqli_close($conn);
?>
```

### 2. GET Request Pattern
```php
$sql = "SELECT * FROM table_name ORDER BY created_at DESC";
$result = mysqli_query($conn, $sql);
$items = [];
while ($row = mysqli_fetch_assoc($result)) {
    $items[] = $row;
}
echo json_encode($items);
```

### 3. POST Request with FormData (File Upload)
```php
$title = $_POST['title'];
$file = $_FILES['file'];
$fileName = time() . "_" . basename($file['name']);
move_uploaded_file($file['tmp_name'], $target);

$sql = "INSERT INTO table (title, file_path) VALUES ('$title', '$path')";
mysqli_query($conn, $sql);
```

### 4. POST Request with JSON Body
```php
$input = file_get_contents('php://input');
$data = json_decode($input, true);

$title = $data['title'];
$content = $data['content'];

$sql = "INSERT INTO table (title, content) VALUES ('$title', '$content')";
mysqli_query($conn, $sql);
```

### 5. GET with Query Parameter
```php
$postId = $_GET['post_id'];
$sql = "SELECT * FROM comments WHERE post_id = $postId";
```

---

## Database Tables Used

1. **users** - User accounts
   - `id`, `fullname`, `email`, `username`, `password`, `role`, `profile_pic`, `course`, `year`, `bio`, `created_at`

2. **notes** - Uploaded resources
   - `note_id`, `title`, `description`, `course`, `type`, `year`, `file_path`, `uploaded_by`, `views`, `downloads`, `created_at`

3. **forum_posts** - Forum posts
   - `id`, `title`, `content`, `category`, `author_name`, `author_avatar`, `created_at`

4. **forum_comments** - Comments on posts
   - `id`, `post_id`, `author_name`, `author_avatar`, `text`, `created_at`

---

## Code Simplification Notes

### What's Simplified?
- ✅ No SQL injection protection (no `mysqli_real_escape_string`)
- ✅ No input validation (no empty checks, type checks)
- ✅ No file validation (no type/size checks)
- ✅ No error handling (no HTTP status codes)
- ✅ No method validation (no POST/GET checks)

### Why Simplified?
- Single user development environment
- Faster development and testing
- Focus on core functionality
- Easy to understand and modify

### For Production:
Would need to add:
- Prepared statements for SQL
- Input validation
- File type/size validation
- Error handling
- Authentication

---

## Frontend Integration Points

### Notes
```javascript
// GET all notes
fetch('../api/notes.php')
  .then(res => res.json())
  .then(data => console.log(data));

// POST upload note
const formData = new FormData();
formData.append('title', title);
formData.append('file', file);
fetch('../api/upload.php', {
  method: 'POST',
  body: formData
});
```

### Forum
```javascript
// GET all posts
fetch('../api/forum.php')
  .then(res => res.json())
  .then(data => console.log(data));

// POST create post
fetch('../api/forum.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title, content, category, author, authorAvatar })
});
```

### Comments
```javascript
// GET comments for post
fetch(`../api/comments.php?post_id=${postId}`)
  .then(res => res.json())
  .then(data => console.log(data));

// POST add comment
fetch('../api/comments.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ post_id, text, author, authorAvatar })
});
```

### Avatar
```javascript
// POST upload avatar
const formData = new FormData();
formData.append('file', file);
fetch('../api/avatar.php', {
  method: 'POST',
  body: formData
});
```

---

## Common Viva Questions

**Q: How does frontend communicate with backend?**
A: Using JavaScript `fetch()` API to make HTTP requests to PHP endpoints, receiving JSON responses.

**Q: Why is the code so simple?**
A: This is a development version for single-user testing. Code focuses on core functionality without complex validation. For production, we would add security and validation.

**Q: Why use JSON?**
A: Universal format, easy to parse in JavaScript, standard for REST APIs.

**Q: How are file uploads handled?**
A: Using PHP `$_FILES` superglobal to receive file, then `move_uploaded_file()` to save it to permanent location. File path stored in database.

**Q: What happens on database error?**
A: In this simplified version, errors aren't handled. For production, we would check query results and return appropriate error messages.

**Q: Why use subqueries for reply counts?**
A: Ensures count is always accurate and calculated in real-time from database, rather than maintaining a separate counter.

**Q: How does GET vs POST work?**
A: GET requests read data (no body), POST requests create data (with body - either FormData for files or JSON for structured data).

**Q: Why separate API files?**
A: Single responsibility principle - each file handles one feature, making code easier to maintain and understand.

---

## Quick Code Snippets

### Database Connection
```php
include("../config/db.php"); // Gets $conn variable
```

### Execute Query and Get Results
```php
$result = mysqli_query($conn, $sql);
$items = [];
while ($row = mysqli_fetch_assoc($result)) {
    $items[] = $row;
}
```

### Get Last Insert ID
```php
mysqli_query($conn, $sql);
$newId = mysqli_insert_id($conn);
```

### Format Date
```php
DATE_FORMAT(created_at, '%b %e, %Y %H:%i') // "Jan 15, 2024 14:30"
date('M j, Y H:i') // Same format in PHP
```

### Count with Subquery
```php
(SELECT COUNT(*) FROM forum_comments c WHERE c.post_id = p.id) AS replies
```

---

## File Structure

```
backend/
  ├── api/
  │   ├── admin/          - Admin API endpoints
  │   │   ├── forum.php   - Admin forum management
  │   │   ├── notes.php   - Admin notes management
  │   │   ├── profile.php - Admin profile
  │   │   └── users.php   - User management
  │   ├── avatar.php      - POST upload avatar
  │   ├── comments.php    - GET/POST comments
  │   ├── current_user.php - GET current user
  │   ├── forum.php       - GET/POST forum posts
  │   ├── notes.php       - GET all notes
  │   ├── upload.php      - POST upload file
  │   ├── user_profile.php - GET user profile
  │   └── users.php       - GET all users
  ├── login.php           - User login
  ├── logout.php          - Logout
  ├── register.php        - User registration
  └── database.sql        - Database schema

config/
  └── db.php              - Database connection

frontend/
  ├── admin/              - Admin panel
  │   ├── index.html
  │   └── admin.js
  └── app.js              - Main JavaScript

uploads/
  ├── [files]             - Uploaded notes
  └── avatars/            - Profile pictures
```

---

## Key PHP Functions Used

- `mysqli_connect()` - Connect to database
- `mysqli_query()` - Execute SQL query
- `mysqli_fetch_assoc()` - Get row as associative array
- `mysqli_insert_id()` - Get last inserted ID
- `json_encode()` - Convert array to JSON
- `file_get_contents('php://input')` - Read JSON body
- `json_decode()` - Convert JSON to array
- `move_uploaded_file()` - Save uploaded file
- `basename()` - Get filename from path
- `pathinfo()` - Get file extension
- `time()` - Get current timestamp

---

This quick reference covers all essential PHP code patterns in your Noteify project!
