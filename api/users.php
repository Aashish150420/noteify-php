<?php
header('Content-Type: application/json');
include("../config/db.php");

$result = mysqli_query($conn, "SELECT user_id, name, email, role FROM users");
$users = [];
if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $users[] = $row;
    }
} else {
    http_response_code(500);
    echo json_encode(["error" => "Database query failed"]);
    exit;
}

echo json_encode($users);
mysqli_close($conn);
?>
