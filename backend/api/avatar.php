<?php
// API for uploading user avatars
header('Content-Type: application/json');
session_start();
include('../../config/db.php');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["error" => "Not authenticated"]);
    exit;
}

$user_id = intval($_SESSION['user_id']);

if (!isset($_FILES['file'])) {
    echo json_encode(["error" => "No file uploaded"]);
    exit;
}

$file = $_FILES['file'];

// Validate file type
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
if (!in_array($file['type'], $allowedTypes)) {
    echo json_encode(["error" => "Invalid file type. Only images are allowed."]);
    exit;
}

// Validate file size (5MB max)
if ($file['size'] > 5 * 1024 * 1024) {
    echo json_encode(["error" => "File too large. Maximum size is 5MB."]);
    exit;
}

$uploadDir = "../../uploads/avatars/";

if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$fileName = time() . "_" . $user_id . "_" . basename($file['name']);
$target = $uploadDir . $fileName;
$relativePath = "uploads/avatars/" . $fileName;

// Delete old avatar if exists
$oldAvatarQuery = mysqli_query($conn, "SELECT profile_pic FROM users WHERE id = $user_id");
if ($oldAvatarQuery && mysqli_num_rows($oldAvatarQuery) > 0) {
    $oldUser = mysqli_fetch_assoc($oldAvatarQuery);
    $oldPic = $oldUser['profile_pic'];
    if ($oldPic && $oldPic !== 'default.png' && $oldPic !== 'uploads/default.png' && file_exists("../../" . $oldPic)) {
        unlink("../../" . $oldPic);
    }
}

// Move uploaded file
if (move_uploaded_file($file['tmp_name'], $target)) {
    // Update database with new avatar path
    $relativePathEscaped = mysqli_real_escape_string($conn, $relativePath);
    $updateQuery = "UPDATE users SET profile_pic = '$relativePathEscaped' WHERE id = $user_id";
    
    if (mysqli_query($conn, $updateQuery)) {
        echo json_encode([
            "message" => "Avatar uploaded successfully",
            "url" => $relativePath
        ]);
    } else {
        // File uploaded but database update failed
        unlink($target); // Clean up
        echo json_encode(["error" => "Failed to update database: " . mysqli_error($conn)]);
    }
} else {
    echo json_encode(["error" => "Failed to upload file"]);
}

mysqli_close($conn);
?>
