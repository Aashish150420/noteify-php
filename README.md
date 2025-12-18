# Noteify - College Notes & Resources Platform

A simple full-stack web application for sharing college notes and resources.

## Tech Stack
- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: PHP (no frameworks)
- **Database**: MySQL (raw SQL)
- **Storage**: Local file system (uploads folder)

## Setup Instructions

### 1. Database Setup
1. Open phpMyAdmin (http://localhost/phpmyadmin)
2. Import the `database.sql` file or run it in SQL tab
3. This will create:
   - Database: `noteify_db`
   - Tables: `users`, `notes`
   - Sample data

### 2. Configuration
- Database connection is configured in `config/db.php`
- Default settings (XAMPP):
  - Host: `localhost`
  - Username: `root`
  - Password: `` (empty)
  - Database: `noteify_db`

### 3. File Structure
```
noteify/
├── api/              # PHP backend APIs
│   ├── users.php     # GET - Fetch users
│   ├── notes.php     # GET - Fetch notes
│   └── upload.php    # POST - Upload files
├── config/
│   └── db.php        # Database connection
├── frontend/         # HTML, CSS, JS
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── uploads/           # Uploaded files storage
└── database.sql      # Database schema
```

### 4. Running the Project
1. Start XAMPP (Apache and MySQL)
2. Open browser: `http://localhost/noteify/frontend/`
3. The application should load and display notes from the database

## API Endpoints

### GET /api/users.php
Returns JSON array of all users.

### GET /api/notes.php
Returns JSON array of all notes with author information.

### POST /api/upload.php
Uploads a file and creates a note entry.

**Form Data:**
- `title` (required): Note title
- `description`: Note description
- `course`: Course name
- `type`: Type (notes, pastpaper, tutorial, reference)
- `year`: Year (integer)
- `uploaded_by`: User ID (integer)
- `file` (required): PDF/DOC file

**Response:**
```json
{
  "message": "File uploaded successfully",
  "note_id": 1
}
```

## Features
- View notes/resources
- Upload PDF/DOC files
- Filter by course, type, year
- Search functionality
- Download files

## Notes
- File uploads are stored in `/uploads/` folder
- Maximum file size: 10MB
- Supported formats: PDF, DOC, DOCX
- No authentication required (as per project requirements)

