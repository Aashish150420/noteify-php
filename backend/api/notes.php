<?php
header('Content-Type: application/json');
include("../../config/db.php");

// Check if status column exists in notes table
$checkColumn = mysqli_query($conn, "SHOW COLUMNS FROM notes LIKE 'status'");
$hasStatusColumn = mysqli_num_rows($checkColumn) > 0;

// Only show approved notes to regular users (or all notes if status column doesn't exist)
if ($hasStatusColumn) {
    $sql = "SELECT n.*, 
                   u.fullname as author_name,
                   u.profile_pic as author_profile_pic
            FROM notes n 
            LEFT JOIN users u ON n.uploaded_by = u.id 
            WHERE n.status = 'approved' OR n.status IS NULL
            ORDER BY n.created_at DESC";
} else {
    // If status column doesn't exist, show all notes (backward compatibility)
    $sql = "SELECT n.*, 
                   u.fullname as author_name,
                   u.profile_pic as author_profile_pic
            FROM notes n 
            LEFT JOIN users u ON n.uploaded_by = u.id 
            ORDER BY n.created_at DESC";
}

$result = mysqli_query($conn, $sql);
$notes = [];
while ($row = mysqli_fetch_assoc($result)) {
    $notes[] = $row;
}

echo json_encode($notes);
mysqli_close($conn);
?>
