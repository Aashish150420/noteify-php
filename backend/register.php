<?php
session_start();
include('../config/db.php');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $fullname = mysqli_real_escape_string($conn, $_POST['fullname']);
    $course = mysqli_real_escape_string($conn, $_POST['course']);
    $year = isset($_POST['year']) ? mysqli_real_escape_string($conn, $_POST['year']) : '1';
    $email = mysqli_real_escape_string($conn, $_POST['email']);
    $username = mysqli_real_escape_string($conn, $_POST['username']);
    $bio = isset($_POST['bio']) ? mysqli_real_escape_string($conn, $_POST['bio']) : '';
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);

    // Profile picture upload
    $profile_pic = 'uploads/default.png';

    if (isset($_FILES['profile_pic']) && $_FILES['profile_pic']['error'] === 0) {
        $target_dir = __DIR__ . "/../uploads/avatars/";
        
        if (!is_dir($target_dir)) {
            mkdir($target_dir, 0777, true);
        }
        
        $filename = time() . "_" . basename($_FILES["profile_pic"]["name"]);
        $profile_pic = "uploads/avatars/" . $filename;
        
        move_uploaded_file($_FILES["profile_pic"]["tmp_name"], $target_dir . $filename);
    }

    // Check if email already exists
    $check = mysqli_query($conn, "SELECT id FROM users WHERE email = '$email' OR username = '$username'");
    
    if (mysqli_num_rows($check) > 0) {
        die("Email or username already registered. Please login.");
    }

    // Insert data into database
    $sql = "INSERT INTO users (fullname, course, year, email, username, password, profile_pic, bio, role) 
            VALUES ('$fullname', '$course', '$year', '$email', '$username', '$password', '$profile_pic', '$bio', 'user')";
    
    if (mysqli_query($conn, $sql)) {
        $_SESSION['user_id'] = mysqli_insert_id($conn);
        $_SESSION['role'] = 'user';
        header("Location: ../frontend/index.html");
        exit();
    } else {
        echo "Error: " . mysqli_error($conn);
    }
    
    mysqli_close($conn);
}
?>
