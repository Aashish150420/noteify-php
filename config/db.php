<?php
// Database connection for Noteify
// Update credentials here if needed
$conn = mysqli_connect("localhost", "root", "", "noteify_db");
if (!$conn) {
    die("Database connection failed: " . mysqli_connect_error());
}
?>
