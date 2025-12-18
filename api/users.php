<?php
header('Content-Type: application/json');
include("../config/db.php");

$result = $conn->query("SELECT user_id, name, email, role FROM users");
$users = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
} else {
    http_response_code(500);
    echo json_encode(["error" => "Database query failed"]);
    exit;
}

echo json_encode($users);
$conn->close();
?>
