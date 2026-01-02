<?php
session_start();
include('../config/db.php');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = trim($_POST['username']);
    $password = $_POST['password'];

    $username = mysqli_real_escape_string($conn, $username);
    
    // Check if status column exists
    $checkColumn = mysqli_query($conn, "SHOW COLUMNS FROM users LIKE 'status'");
    $hasStatusColumn = mysqli_num_rows($checkColumn) > 0;
    
    // Build query with status check if column exists
    if ($hasStatusColumn) {
        $sql = "SELECT id, password, role, COALESCE(status, 'active') as status 
                FROM users 
                WHERE username = '$username' 
                AND (status = 'active' OR status IS NULL)";
    } else {
        $sql = "SELECT id, password, role 
                FROM users 
                WHERE username = '$username'";
    }
    
    $result = mysqli_query($conn, $sql);

    if (mysqli_num_rows($result) > 0) {
        $user = mysqli_fetch_assoc($result);
        
        if (password_verify($password, $user['password'])) {
            // Double check status if column exists
            if ($hasStatusColumn && isset($user['status']) && $user['status'] === 'inactive') {
                echo "Your account has been deactivated. Please contact an administrator.";
            } else {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $username;
                $_SESSION['role'] = $user['role'];

                if ($user['role'] === 'admin') {
                    header("Location: ../frontend/admin/index.html");
                } else {
                    header("Location: ../frontend/Homepage.html");
                }
                exit();
            }
        } else {
            echo "Invalid password.";
        }
    } else {
        if ($hasStatusColumn) {
            echo "No active user found with that username, or account has been deactivated.";
        } else {
            echo "No user found with that username.";
        }
    }
    
    mysqli_close($conn);
}
?>
