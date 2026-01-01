<?php
header('Content-Type: application/json');
include 'config.php';

$result = mysqli_query($conn, "SELECT user_id, name, email, role FROM users");
$users = [];
while ($row = mysqli_fetch_assoc($result)) {
    $users[] = $row;
}

echo json_encode($users);
mysqli_close($conn);
?>
