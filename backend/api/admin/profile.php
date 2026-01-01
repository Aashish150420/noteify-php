<?php
// Admin API for fetching admin profile
// GET: Fetch admin user profile

header('Content-Type: application/json');
// Database connection
include('../../../config/db.php');

$method = $_SERVER['REQUEST_METHOD'];

// GET - Fetch admin profile
if ($method === 'GET') {
    // Get admin user ID from session or query parameter
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    $user_id = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : 0;
    
    if ($user_id <= 0) {
        echo json_encode(["error" => "User not authenticated"]);
        mysqli_close($conn);
        exit;
    }
    
    $sql = "SELECT id, fullname, email, username, role, profile_pic, course,
                   (SELECT COUNT(*) FROM notes WHERE uploaded_by = users.id) as notes_count,
                   (SELECT SUM(views) FROM notes WHERE uploaded_by = users.id) as total_views,
                   (SELECT SUM(downloads) FROM notes WHERE uploaded_by = users.id) as total_downloads
            FROM users 
            WHERE id = $user_id";
    
    $result = mysqli_query($conn, $sql);
    
    if ($result && mysqli_num_rows($result) > 0) {
        $user = mysqli_fetch_assoc($result);
        echo json_encode($user);
    } else {
        echo json_encode(["error" => "User not found"]);
    }
    
    mysqli_close($conn);
    exit;
}

echo json_encode(["error" => "Method not allowed"]);
mysqli_close($conn);
?>

