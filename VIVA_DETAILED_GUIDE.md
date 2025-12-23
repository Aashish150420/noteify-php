# Complete Viva Guide for Noteify PHP Backend

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Explanation](#architecture-explanation)
3. [Database Structure](#database-structure)
4. [API Endpoints Detailed](#api-endpoints-detailed)
5. [Frontend-Backend Integration](#frontend-backend-integration)
6. [Code Walkthrough](#code-walkthrough)
7. [Common Viva Questions](#common-viva-questions)
8. [Presentation Tips](#presentation-tips)

---

## Project Overview

### What is Noteify?
**Noteify** is a college notes and resource sharing platform where students can:
- Upload and download study materials (PDFs, Word docs)
- Participate in forum discussions
- Comment on forum posts
- Upload profile pictures
- View study resources by course, type, and year

### Technology Stack
- **Frontend**: HTML, CSS, JavaScript (Vanilla JS)
- **Backend**: PHP (Server-side scripting)
- **Database**: MySQL (Relational database)
- **Server**: XAMPP (Apache + MySQL + PHP)

### Why This Stack?
- **PHP**: Easy to learn, great for file handling, integrates well with MySQL
- **MySQL**: Reliable, free, perfect for structured data
- **Vanilla JavaScript**: No framework dependencies, lightweight, fast
- **XAMPP**: All-in-one solution for local development

---

## Architecture Explanation

### RESTful API Architecture

```
┌─────────────┐         HTTP Requests         ┌─────────────┐
│   Browser   │  ──────────────────────────>  │   PHP API   │
│ (Frontend)  │                                │  (Backend)  │
│             │  <──────────────────────────  │             │
│             │      JSON Responses            │             │
└─────────────┘                                └──────┬──────┘
                                                       │
                                                       │ SQL Queries
                                                       ↓
                                                ┌─────────────┐
                                                │   MySQL     │
                                                │  Database   │
                                                └─────────────┘
```

### How It Works

1. **User Action**: User clicks button or loads page in browser
2. **Frontend Request**: JavaScript `fetch()` makes HTTP request to PHP file
3. **PHP Processing**: PHP file receives request, processes data, queries database
4. **Database Query**: MySQL executes SQL query and returns results
5. **JSON Response**: PHP formats data as JSON and sends back to browser
6. **UI Update**: JavaScript receives JSON, updates page without reload

### Key Design Principles

1. **Separation of Concerns**
   - Frontend handles UI/UX
   - Backend handles data/logic
   - Database stores data

2. **Single Responsibility**
   - Each PHP file does one thing
   - `notes.php` - only handles notes
   - `forum.php` - only handles forum posts

3. **Stateless Communication**
   - Each request is independent
   - No session management needed
   - JSON responses are self-contained

---

## Database Structure

### Tables Overview

#### 1. `users` Table
```sql
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role VARCHAR(50) DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Purpose**: Stores user account information

#### 2. `notes` Table
```sql
CREATE TABLE notes (
    note_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    course VARCHAR(100),
    type VARCHAR(50),
    year INT,
    file_path VARCHAR(500) NOT NULL,
    uploaded_by INT,
    views INT DEFAULT 0,
    downloads INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id)
);
```
**Purpose**: Stores uploaded study materials metadata

#### 3. `forum_posts` Table
```sql
CREATE TABLE forum_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    author_name VARCHAR(100) NOT NULL,
    author_avatar VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Purpose**: Stores forum discussion posts

#### 4. `forum_comments` Table
```sql
CREATE TABLE forum_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    author_avatar VARCHAR(500),
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Purpose**: Stores comments on forum posts

### Relationships

- `notes.uploaded_by` → `users.user_id` (Foreign Key)
- `forum_comments.post_id` → `forum_posts.id` (Logical relationship)

---

## API Endpoints Detailed

### 1. Notes API (`api/notes.php`)

#### Purpose
Retrieve all uploaded notes/resources from database

#### Code Breakdown
```php
<?php
// 1. Set response type to JSON
header('Content-Type: application/json');

// 2. Include database connection
include("../config/db.php");

// 3. SQL Query with JOIN
$result = mysqli_query($conn, 
    "SELECT n.*, u.name as author_name 
     FROM notes n 
     LEFT JOIN users u ON n.uploaded_by = u.user_id 
     ORDER BY n.created_at DESC");

// 4. Build array of results
$notes = [];
while ($row = mysqli_fetch_assoc($result)) {
    $notes[] = $row;
}

// 5. Return as JSON
echo json_encode($notes);
mysqli_close($conn);
?>
```

#### Key Concepts

**LEFT JOIN Explained**:
```sql
SELECT n.*, u.name as author_name 
FROM notes n 
LEFT JOIN users u ON n.uploaded_by = u.user_id
```
- Gets ALL notes (even if user deleted)
- If user exists, includes user name
- If user doesn't exist, `author_name` is NULL
- Prevents data loss

**Why ORDER BY DESC?**
- Newest notes appear first
- Better user experience
- Most recent content is most relevant

#### Frontend Usage
```javascript
async function loadNotesFromAPI() {
    const response = await fetch('../api/notes.php');
    const data = await response.json();
    // data is array of note objects
    // Each object has: note_id, title, description, course, 
    //                  type, year, file_path, author_name, etc.
}
```

---

### 2. Upload API (`api/upload.php`)

#### Purpose
Handle file uploads and store metadata in database

#### Complete Flow

**Step 1: Receive Form Data**
```php
$title = $_POST['title'];
$description = $_POST['description'];
$course = $_POST['course'];
$type = $_POST['type'];
$year = $_POST['year'];
$uploaded_by = $_POST['uploaded_by'];
```
- `$_POST` contains form field values
- Directly accessed (no validation in simplified version)

**Step 2: Handle File Upload**
```php
$file = $_FILES['file'];
$fileName = time() . "_" . basename($file['name']);
$target = "../uploads/" . $fileName;
move_uploaded_file($file['tmp_name'], $target);
```

**Key Functions**:
- `$_FILES['file']` - PHP superglobal for uploaded files
- `time()` - Current timestamp (ensures unique filename)
- `basename()` - Gets just filename (removes path)
- `move_uploaded_file()` - Moves file from temp to permanent location

**Why Timestamp in Filename?**
- Prevents filename conflicts
- If two users upload "notes.pdf", they get different names
- Example: `1734567890_notes.pdf` vs `1734567891_notes.pdf`

**Step 3: Store in Database**
```php
$relativePath = "uploads/" . $fileName;
$sql = "INSERT INTO notes (title, description, course, type, year, file_path, uploaded_by)
        VALUES ('$title', '$description', '$course', '$type', $year, '$relativePath', $uploaded_by)";
mysqli_query($conn, $sql);
```

**Why Relative Path?**
- `uploads/file.pdf` instead of `/var/www/html/uploads/file.pdf`
- Makes application portable
- Works on different servers

**Step 4: Return Response**
```php
echo json_encode([
    "message" => "File uploaded successfully",
    "note_id" => mysqli_insert_id($conn)
]);
```
- `mysqli_insert_id()` - Gets the auto-generated ID of last insert
- Frontend can use this to update UI immediately

#### Frontend Usage
```javascript
const formData = new FormData();
formData.append('title', 'My Notes');
formData.append('file', fileInput.files[0]);

fetch('../api/upload.php', {
    method: 'POST',
    body: formData  // FormData automatically sets Content-Type
});
```

**Why FormData?**
- Required for file uploads
- Can send both text fields and files
- Browser handles encoding automatically

---

### 3. Forum API (`api/forum.php`)

#### GET Request - Retrieve All Posts

**Code**:
```php
if ($method === 'GET') {
    $sql = "SELECT p.id, p.title, p.content, p.category, 
                   p.author_name AS author, p.author_avatar AS authorAvatar,
                   (SELECT COUNT(*) FROM forum_comments c 
                    WHERE c.post_id = p.id) AS replies,
                   DATE_FORMAT(p.created_at, '%b %e, %Y %H:%i') AS time
            FROM forum_posts p ORDER BY p.created_at DESC";
    
    $result = mysqli_query($conn, $sql);
    $posts = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $posts[] = $row;
    }
    echo json_encode($posts);
}
```

**Subquery Explained**:
```sql
(SELECT COUNT(*) FROM forum_comments c WHERE c.post_id = p.id) AS replies
```
- For each post, counts how many comments exist
- Calculated in real-time (always accurate)
- No need to maintain separate counter

**Date Formatting**:
```sql
DATE_FORMAT(p.created_at, '%b %e, %Y %H:%i')
```
- `%b` - Abbreviated month (Jan, Feb, etc.)
- `%e` - Day of month (1-31)
- `%Y` - 4-digit year
- `%H:%i` - 24-hour time
- Result: "Jan 15, 2024 14:30"

#### POST Request - Create New Post

**Code**:
```php
if ($method === 'POST') {
    // 1. Read JSON body
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // 2. Extract data
    $title = $data['title'];
    $content = $data['content'];
    $category = $data['category'];
    $author_name = $data['author'];
    $author_avatar = $data['authorAvatar'];
    
    // 3. Insert into database
    $sql = "INSERT INTO forum_posts (title, content, category, author_name, author_avatar)
            VALUES ('$title', '$content', '$category', '$author_name', '$author_avatar')";
    mysqli_query($conn, $sql);
    
    // 4. Return created post
    $newId = mysqli_insert_id($conn);
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
    echo json_encode(["message" => "Post created successfully", "post" => $post]);
}
```

**JSON Body Reading**:
```php
$input = file_get_contents('php://input');
$data = json_decode($input, true);
```
- `php://input` - Raw request body
- `json_decode()` - Converts JSON string to PHP array
- Second parameter `true` - Returns associative array (not object)

**Why Return Created Post?**
- Frontend can immediately add it to UI
- No need to reload all posts
- Better user experience

#### Frontend Usage
```javascript
// GET posts
fetch('../api/forum.php')
  .then(res => res.json())
  .then(posts => console.log(posts));

// POST new post
fetch('../api/forum.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        title: 'My Question',
        content: 'How do I study?',
        category: 'homework',
        author: 'John Doe',
        authorAvatar: '../uploads/avatars/avatar.png'
    })
});
```

---

### 4. Comments API (`api/comments.php`)

#### GET Request - Get Comments for Post

**Code**:
```php
if ($method === 'GET') {
    $postId = $_GET['post_id'];
    
    $sql = "SELECT id, post_id, author_name AS author, 
                   author_avatar AS authorAvatar, text,
                   DATE_FORMAT(created_at, '%b %e, %Y %H:%i') AS time
            FROM forum_comments 
            WHERE post_id = $postId 
            ORDER BY created_at ASC";
    
    $result = mysqli_query($conn, $sql);
    $comments = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $comments[] = $row;
    }
    echo json_encode($comments);
}
```

**Query Parameter**:
- `$_GET['post_id']` - Gets value from URL: `?post_id=5`
- Used to filter comments for specific post

**Why ORDER BY ASC?**
- Oldest comments first
- Natural conversation flow
- Users see discussion in chronological order

#### POST Request - Add Comment

**Code**:
```php
if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    $postId = $data['post_id'];
    $text = $data['text'];
    $author_name = $data['author'];
    $author_avatar = $data['authorAvatar'];
    
    $sql = "INSERT INTO forum_comments (post_id, author_name, author_avatar, text)
            VALUES ($postId, '$author_name', '$author_avatar', '$text')";
    
    mysqli_query($conn, $sql);
    $newId = mysqli_insert_id($conn);
    
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
}
```

#### Frontend Usage
```javascript
// GET comments
fetch(`../api/comments.php?post_id=${postId}`)
  .then(res => res.json())
  .then(comments => console.log(comments));

// POST comment
fetch('../api/comments.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        post_id: 5,
        text: 'Great question!',
        author: 'Jane Doe',
        authorAvatar: '../uploads/avatars/jane.png'
    })
});
```

---

### 5. Avatar API (`api/avatar.php`)

#### Purpose
Upload profile pictures (images only)

#### Code
```php
<?php
header('Content-Type: application/json');

$file = $_FILES['file'];
$uploadDir = "../uploads/avatars/";

// Create directory if needed
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Generate filename
$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$fileName = time() . "_" . basename($file['name']);
$target = $uploadDir . $fileName;
$relativePath = "uploads/avatars/" . $fileName;

// Save file
move_uploaded_file($file['tmp_name'], $target);

// Return path
echo json_encode([
    "message" => "Avatar uploaded successfully",
    "url" => $relativePath
]);
?>
```

**Key Functions**:
- `pathinfo($file['name'], PATHINFO_EXTENSION)` - Gets file extension (.jpg, .png)
- `mkdir($uploadDir, 0777, true)` - Creates directory with full permissions
- `move_uploaded_file()` - Saves uploaded file

**Why No Database?**
- Avatar stored in browser localStorage
- Not tied to user account
- Each browser session has its own avatar

#### Frontend Usage
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('../api/avatar.php', {
    method: 'POST',
    body: formData
})
.then(res => res.json())
.then(result => {
    userProfile.avatar = '../' + result.url;
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
});
```

---

## Frontend-Backend Integration

### Complete Request-Response Cycle

#### Example: Uploading a Note

**1. User Action**
```
User fills form → Clicks "Upload" button
```

**2. Frontend JavaScript**
```javascript
async function handleUpload() {
    const formData = new FormData();
    formData.append('title', document.getElementById('title').value);
    formData.append('file', document.getElementById('file').files[0]);
    
    const response = await fetch('../api/upload.php', {
        method: 'POST',
        body: formData
    });
    
    const result = await response.json();
    if (result.message === "File uploaded successfully") {
        alert('Uploaded!');
        loadNotesFromAPI(); // Reload notes list
    }
}
```

**3. PHP Processing**
```php
// Receives FormData
$title = $_POST['title'];
$file = $_FILES['file'];

// Saves file
move_uploaded_file($file['tmp_name'], $target);

// Stores in database
mysqli_query($conn, "INSERT INTO notes...");

// Returns JSON
echo json_encode(["message" => "File uploaded successfully"]);
```

**4. Frontend Update**
```javascript
// Receives JSON response
// Updates UI
// Shows success message
// Reloads notes list
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERFACE                       │
│  (HTML Forms, Buttons, Display Areas)                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│              JAVASCRIPT (Frontend)                      │
│  - Event Listeners                                      │
│  - Form Data Collection                                 │
│  - fetch() API Calls                                    │
│  - JSON Parsing                                         │
│  - DOM Manipulation                                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTP Request (GET/POST)
                     │ with Data (FormData/JSON)
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  PHP API (Backend)                       │
│  - Receives Request                                     │
│  - Processes Data                                       │
│  - Database Queries                                     │
│  - File Operations                                      │
│  - JSON Response                                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ SQL Queries
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  MYSQL DATABASE                          │
│  - Stores Data                                         │
│  - Returns Results                                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Query Results
                     ↓
┌─────────────────────────────────────────────────────────┐
│              PHP API (Backend)                          │
│  - Formats as JSON                                      │
│  - Sends Response                                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ JSON Response
                     ↓
┌─────────────────────────────────────────────────────────┐
│              JAVASCRIPT (Frontend)                      │
│  - Receives JSON                                        │
│  - Updates UI                                           │
│  - Shows Results                                        │
└─────────────────────────────────────────────────────────┘
```

---

## Code Walkthrough

### Understanding PHP Superglobals

**1. `$_POST`**
- Contains form data sent via POST method
- Example: `$_POST['title']` gets value of input with name="title"

**2. `$_GET`**
- Contains URL query parameters
- Example: `$_GET['post_id']` gets value from `?post_id=5`

**3. `$_FILES`**
- Contains uploaded file information
- Example: `$_FILES['file']` contains:
  - `['name']` - Original filename
  - `['tmp_name']` - Temporary file location
  - `['size']` - File size in bytes
  - `['type']` - MIME type

### Database Functions

**1. `mysqli_query($conn, $sql)`**
- Executes SQL query
- Returns result set or TRUE/FALSE

**2. `mysqli_fetch_assoc($result)`**
- Gets one row as associative array
- Returns NULL when no more rows

**3. `mysqli_insert_id($conn)`**
- Gets auto-generated ID from last INSERT
- Useful for returning new record ID

**4. `mysqli_close($conn)`**
- Closes database connection
- Good practice to free resources

### JSON Functions

**1. `json_encode($array)`**
- Converts PHP array to JSON string
- Example: `[1, 2, 3]` → `"[1,2,3]"`

**2. `json_decode($string, true)`**
- Converts JSON string to PHP array
- Second parameter `true` = associative array
- Example: `'{"name":"John"}'` → `["name" => "John"]`

### File Functions

**1. `move_uploaded_file($source, $destination)`**
- Moves uploaded file from temp to permanent location
- Returns TRUE on success

**2. `basename($path)`**
- Gets filename from full path
- Example: `/var/www/file.pdf` → `file.pdf`

**3. `pathinfo($file, PATHINFO_EXTENSION)`**
- Gets file extension
- Example: `notes.pdf` → `pdf`

---

## Common Viva Questions

### Q1: Why use PHP instead of Node.js or Python?

**Answer**:
- PHP is specifically designed for web development
- Excellent file handling capabilities (perfect for uploads)
- Seamless MySQL integration
- Widely supported in shared hosting
- Easy to learn and deploy
- XAMPP provides complete development environment

### Q2: How does the frontend communicate with backend?

**Answer**:
- JavaScript `fetch()` API makes HTTP requests
- GET requests for retrieving data
- POST requests for creating/uploading data
- PHP processes requests and returns JSON
- Frontend receives JSON and updates UI dynamically
- No page reloads needed (AJAX pattern)

### Q3: Why use JSON instead of HTML?

**Answer**:
- JSON is lightweight and fast
- Easy to parse in JavaScript
- Standard format for REST APIs
- Allows dynamic UI updates without page reload
- Can send structured data (arrays, objects)
- Universal format (works with any frontend)

### Q4: Explain the database structure.

**Answer**:
- **users**: Stores user account information
- **notes**: Stores uploaded file metadata (title, description, file path)
- **forum_posts**: Stores discussion posts
- **forum_comments**: Stores comments on posts
- Foreign key relationship: `notes.uploaded_by` → `users.user_id`
- Logical relationship: `forum_comments.post_id` → `forum_posts.id`

### Q5: How are file uploads handled?

**Answer**:
1. Frontend creates FormData object with file
2. POST request sent to PHP with FormData
3. PHP receives file via `$_FILES` superglobal
4. Generate unique filename using timestamp
5. Move file from temp location to `uploads/` folder
6. Store file path in database
7. Return success message with file path

### Q6: Why is the code simplified (no validation)?

**Answer**:
- This is a development version for single-user testing
- Focus on core functionality first
- Faster development and easier debugging
- Can add validation later for production
- Suitable for learning and demonstration purposes

### Q7: How does the forum reply count work?

**Answer**:
- Uses SQL subquery to count comments in real-time
- `(SELECT COUNT(*) FROM forum_comments WHERE post_id = p.id) AS replies`
- Calculated dynamically for each post
- Always accurate, no need to maintain separate counter
- Updates automatically when comments are added

### Q8: What happens if database connection fails?

**Answer**:
- `config/db.php` checks connection
- If fails, script dies with error message
- Prevents API from running with broken connection
- Error message helps identify the problem
- In production, would log error and show user-friendly message

### Q9: Why use LEFT JOIN in notes query?

**Answer**:
- Gets all notes even if user is deleted
- Prevents data loss
- If user exists, includes user name
- If user doesn't exist, `author_name` is NULL
- Better than INNER JOIN which would hide notes with deleted users

### Q10: How does the avatar system work?

**Answer**:
- Avatar uploaded via `api/avatar.php`
- File saved to `uploads/avatars/` folder
- Path returned in JSON response
- Frontend stores path in browser localStorage
- Not stored in database (client-side only)
- Persists across page reloads via localStorage

---

## Presentation Tips

### 1. Start Strong
- "I've built a college notes sharing platform using PHP and MySQL"
- "It follows RESTful API architecture with JSON communication"
- "The code is simplified for development but maintains all core functionality"

### 2. Show Architecture
- Draw or explain the request-response cycle
- Show how frontend and backend communicate
- Explain separation of concerns

### 3. Demonstrate One Complete Flow
**Example: Uploading a Note**
1. Show the HTML form
2. Explain JavaScript code that collects data
3. Show the HTTP request being sent
4. Walk through PHP code that processes it
5. Show database insertion
6. Show JSON response
7. Show UI update

### 4. Explain Key Concepts
- **RESTful API**: GET for reading, POST for creating
- **JSON**: Universal data format
- **Database Relationships**: Foreign keys, JOINs
- **File Handling**: Upload, storage, retrieval

### 5. Be Honest About Simplifications
- "This is a development version"
- "No validation for faster development"
- "Would add security for production"
- Shows understanding of best practices

### 6. Show You Understand
- Explain WHY you made certain choices
- Show you know what could be improved
- Demonstrate understanding of concepts, not just code

### 7. Practice Common Questions
- Prepare answers for questions above
- Practice explaining code flow
- Be ready to draw diagrams

### 8. Keep It Simple
- Don't overcomplicate explanations
- Use simple language
- Focus on understanding, not memorization

---

## Quick Reference Checklist

Before your viva, make sure you can:

- [ ] Explain the overall architecture
- [ ] Walk through one complete API endpoint
- [ ] Explain database structure and relationships
- [ ] Show how frontend and backend communicate
- [ ] Explain file upload process
- [ ] Answer why code is simplified
- [ ] Explain what would be added for production
- [ ] Draw the request-response cycle
- [ ] Explain JSON usage
- [ ] Show understanding of PHP superglobals

---

## Final Tips

1. **Be Confident**: You built this, you understand it
2. **Be Honest**: Admit simplifications, show you know what's missing
3. **Be Clear**: Use simple language, avoid jargon
4. **Be Prepared**: Practice explaining each API endpoint
5. **Be Enthusiastic**: Show you enjoyed building this

Good luck with your viva! 🎓

