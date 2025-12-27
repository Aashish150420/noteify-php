<?php
    include 'config.php';
    //fetch data from login form
    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $username = $_POST['username'];
        $password = $_POST['password'];

        //execute SQL statement
        $stmt = $conn->prepare("SELECT id, password FROM users WHERE username = ?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $stmt->store_result();

        //check if user exists
        if ($stmt->num_rows > 0) {
            $stmt->bind_result($id, $hashed_password);
            $stmt->fetch();

            //verify password
            if (password_verify($password, $hashed_password)) {
                
                //start session and redirect to dashboard
                session_start();
                $_SESSION['user_id'] = $id;
                header("Location: ../frontend/Homepage.html");
                exit();
            } else {
                echo "Invalid password.";
            }
        } else {
            echo "No user found with that username.";
        }

        $stmt->close();
        $conn->close();
    }
?>