<?php
// Database connection for Noteify
// Update credentials here if needed
$conn = new mysqli("localhost", "root", "", "noteify_db");
if ($conn->connect_error) {
    die("Database connection failed");
}
?>
