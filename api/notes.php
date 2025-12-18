<?php
header('Content-Type: application/json');
include("../config/db.php");

$result = $conn->query("SELECT n.*, u.name as author_name FROM notes n LEFT JOIN users u ON n.uploaded_by = u.user_id ORDER BY n.created_at DESC");
$notes = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $notes[] = $row;
    }
} else {
    http_response_code(500);
    echo json_encode(["error" => "Database query failed"]);
    exit;
}

echo json_encode($notes);
$conn->close();
?>
