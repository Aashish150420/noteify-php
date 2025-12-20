<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

include("../config/db.php");

// Get form data
$title = isset($_POST['title']) ? $_POST['title'] : '';
$description = isset($_POST['description']) ? $_POST['description'] : '';
$course = isset($_POST['course']) ? $_POST['course'] : '';
$type = isset($_POST['type']) ? $_POST['type'] : 'notes';
$year = isset($_POST['year']) ? intval($_POST['year']) : date('Y');
$uploaded_by = isset($_POST['uploaded_by']) ? intval($_POST['uploaded_by']) : 1;

// Validate required fields
if (empty($title) || !isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(["error" => "Title and file are required"]);
    exit;
}

// Create uploads directory if it doesn't exist
$uploadDir = "../uploads/";
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Handle file upload
$file = $_FILES['file'];
$allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
$maxSize = 10 * 1024 * 1024; // 10MB

if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(["error" => "File upload error: " . $file['error']]);
    exit;
}

if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(["error" => "File size exceeds 10MB limit"]);
    exit;
}

// Generate unique filename
$fileName = time() . "_" . basename($file['name']);
$target = $uploadDir . $fileName;
$relativePath = "uploads/" . $fileName; // Path relative to project root for database

// Move uploaded file
if (move_uploaded_file($file['tmp_name'], $target)) {
    // Escape strings for SQL (basic protection)
    $title = mysqli_real_escape_string($conn, $title);
    $description = mysqli_real_escape_string($conn, $description);
    $course = mysqli_real_escape_string($conn, $course);
    $type = mysqli_real_escape_string($conn, $type);
    
    // Insert into database (store relative path)
    $relativePathEscaped = mysqli_real_escape_string($conn, $relativePath);
    $sql = "INSERT INTO notes (title, description, course, type, year, file_path, uploaded_by)
            VALUES ('$title', '$description', '$course', '$type', $year, '$relativePathEscaped', $uploaded_by)";
    
    if (mysqli_query($conn, $sql)) {
        echo json_encode([
            "message" => "File uploaded successfully",
            "note_id" => mysqli_insert_id($conn)
        ]);
    } else {
        // Delete uploaded file if database insert fails
        unlink($target);
        http_response_code(500);
        echo json_encode(["error" => "Database insert failed: " . mysqli_error($conn)]);
    }
} else {
    http_response_code(500);
    echo json_encode(["error" => "Failed to move uploaded file"]);
}

mysqli_close($conn);
?>
