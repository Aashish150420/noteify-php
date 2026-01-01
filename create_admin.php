<?php
// Quick script to create an admin user
// Run this file once: http://localhost/noteify-php/create_admin.php
// Then delete this file for security

include('config/db.php');

$admin_username = 'admin';
$admin_password = 'admin123'; // Change this!
$admin_email = 'admin@noteify.com';
$admin_fullname = 'Administrator';
$admin_course = 'Admin';

// Check if admin already exists
$check = mysqli_query($conn, "SELECT id FROM users WHERE username = '$admin_username' OR role = 'admin'");

if (mysqli_num_rows($check) > 0) {
    echo "Admin user already exists!<br>";
    echo "Username: admin<br>";
    echo "You can change the password in the database if needed.";
} else {
    $hashed_password = password_hash($admin_password, PASSWORD_DEFAULT);
    
    $sql = "INSERT INTO users (fullname, course, email, username, password, role) 
            VALUES ('$admin_fullname', '$admin_course', '$admin_email', '$admin_username', '$hashed_password', 'admin')";
    
    if (mysqli_query($conn, $sql)) {
        echo "Admin user created successfully!<br><br>";
        echo "Username: <strong>$admin_username</strong><br>";
        echo "Password: <strong>$admin_password</strong><br><br>";
        echo "<strong>IMPORTANT: Delete this file (create_admin.php) after use for security!</strong><br><br>";
        echo "<a href='frontend/adminlogin.html'>Go to Admin Login</a>";
    } else {
        echo "Error: " . mysqli_error($conn);
    }
}

mysqli_close($conn);
?>

