<?php
    // Include config (dbconnection)file
    include 'config.php';

    /// To check and collect data from the form
    if ($_SERVER["REQUEST_METHOD"] == "POST") {
       $fullname = $_POST['fullname'];
    $course = $_POST['course'];
    $email = $_POST['email'];
    $username = $_POST['username'];
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT); // hash password
    }

    // Profile picture upload
$profile_pic = 'uploads/default.png';

if (isset($_FILES['profile_pic']) && $_FILES['profile_pic']['error'] === 0) {

    $target_dir = __DIR__ . "/uploads/";

    if (!is_dir($target_dir)) {
        mkdir($target_dir, 0777, true);
    }

    $filename = time() . "_" . basename($_FILES["profile_pic"]["name"]);
    $profile_pic = "uploads/" . $filename;

    move_uploaded_file($_FILES["profile_pic"]["tmp_name"], $target_dir . $filename);
}

// Check if email already exists
    $check = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $check->bind_param("s", $email);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
        die("Email already registered. Please login.");
    }
    $check->close();


    // Insert data into database
    $sql = "INSERT INTO users (fullname, course, email, username, password, profile_pic) VALUES ('$fullname', '$course', '$email', '$username', '$password', '$profile_pic')";
    $stmt = $conn->prepare($sql);

    if ($stmt->execute()) {
        // Registration successful
        echo "Registration successful!";
        header("Location: ../frontend/index.html");
        exit();
    } else {
        // Error occurred
        echo "Error: " . $stmt->error;
    }

    $stmt->close();
    $conn->close();

    

?>

