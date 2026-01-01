<?php
session_start();
include('../config/db.php');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = trim($_POST['username']);
    $password = $_POST['password'];

    $username = mysqli_real_escape_string($conn, $username);
    $result = mysqli_query($conn, "SELECT id, password, role FROM users WHERE username = '$username'");

    if (mysqli_num_rows($result) > 0) {
        $user = mysqli_fetch_assoc($result);
        
        if (password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $username;
            $_SESSION['role'] = $user['role'];

                if ($user['role'] === 'admin') {
                    header("Location: ../frontend/admin/index.html");
                } else {
                    header("Location: ../frontend/Homepage.html");
                }
            exit();
        } else {
            echo "Invalid password.";
        }
    } else {
        echo "No user found with that username.";
    }
    
    mysqli_close($conn);
}
?>
