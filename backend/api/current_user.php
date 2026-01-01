<?php
// API to get current logged-in user ID
header('Content-Type: application/json');
session_start();

if (isset($_SESSION['user_id'])) {
    echo json_encode([
        "user_id" => $_SESSION['user_id'],
        "username" => $_SESSION['username'] ?? '',
        "role" => $_SESSION['role'] ?? 'user'
    ]);
} else {
    echo json_encode([
        "user_id" => null,
        "error" => "Not logged in"
    ]);
}
?>

