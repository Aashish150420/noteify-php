<?php
// Database connection for Noteify

$conn = mysqli_connect("localhost", "root", "", "noteify_db");
if (!$conn) {
    die("Database connection failed: " . mysqli_connect_error());
}
?>
