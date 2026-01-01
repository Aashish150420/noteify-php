<?php
header('Content-Type: application/json');
include("../../config/db.php");

$result = mysqli_query($conn, "SELECT n.*, u.fullname as author_name FROM notes n LEFT JOIN users u ON n.uploaded_by = u.id ORDER BY n.created_at DESC");
$notes = [];
while ($row = mysqli_fetch_assoc($result)) {
    $notes[] = $row;
}

echo json_encode($notes);
mysqli_close($conn);
?>
