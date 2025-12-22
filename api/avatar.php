<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

// Simple image upload handler (no database)

if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(["error" => "No file uploaded"]);
    exit;
}

$file = $_FILES['file'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(["error" => "File upload error: " . $file['error']]);
    exit;
}

// Validate type and size
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$maxSize = 5 * 1024 * 1024; // 5MB

if (!in_array($file['type'], $allowedTypes)) {
    http_response_code(400);
    echo json_encode(["error" => "Only JPG, PNG, GIF and WEBP images are allowed"]);
    exit;
}

if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(["error" => "File size exceeds 5MB limit"]);
    exit;
}

// Ensure upload directory exists
$uploadDir = "../uploads/avatars/";
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Unique filename
$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$safeName = preg_replace('/[^a-zA-Z0-9_\-]/', '_', pathinfo($file['name'], PATHINFO_FILENAME));
$fileName = time() . "_" . $safeName . "." . $ext;
$target = $uploadDir . $fileName;

// Path relative to project root (for frontend)
$relativePath = "uploads/avatars/" . $fileName;

if (!move_uploaded_file($file['tmp_name'], $target)) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to save uploaded file"]);
    exit;
}

echo json_encode([
    "message" => "Avatar uploaded successfully",
    "url" => $relativePath
]);
?>


