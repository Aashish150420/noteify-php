<?php
// Admin API for managing users
// GET: Fetch all users

header('Content-Type: application/json');
// Database connection
include('../../../config/db.php');

$method = $_SERVER['REQUEST_METHOD'];

// GET - Fetch all users
if ($method === 'GET') {
    $sql = "SELECT id, fullname, email, username, role, profile_pic, 
                   (SELECT COUNT(*) FROM notes WHERE uploaded_by = users.id) as notes_count
            FROM users 
            ORDER BY created_at DESC";
    
    $result = mysqli_query($conn, $sql);
    $users = [];
    
    if ($result) {
        while ($row = mysqli_fetch_assoc($result)) {
            $users[] = $row;
        }
    }
    
    echo json_encode($users);
    mysqli_close($conn);
    exit;
}

echo json_encode(["error" => "Method not allowed"]);
mysqli_close($conn);
?>

