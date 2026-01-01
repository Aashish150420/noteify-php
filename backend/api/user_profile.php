<?php
// API to get current logged-in user profile
header('Content-Type: application/json');
session_start();
include('../../config/db.php');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["error" => "Not logged in"]);
    mysqli_close($conn);
    exit;
}

$user_id = intval($_SESSION['user_id']);

// Fetch user profile with stats
$sql = "SELECT id, fullname, email, username, role, profile_pic, course, year, bio,
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
?>

