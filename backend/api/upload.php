<?php
header('Content-Type: application/json');
include("../../config/db.php");

$title = mysqli_real_escape_string($conn, $_POST['title']);
$description = mysqli_real_escape_string($conn, $_POST['description']);
$course = mysqli_real_escape_string($conn, $_POST['course']);
$type = mysqli_real_escape_string($conn, $_POST['type']);
$year = intval($_POST['year']);
$uploaded_by = intval($_POST['uploaded_by']);

$uploadDir = "../../uploads/";
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$file = $_FILES['file'];
$fileName = time() . "_" . basename($file['name']);
$target = $uploadDir . $fileName;
$relativePath = "uploads/" . $fileName;

move_uploaded_file($file['tmp_name'], $target);

$sql = "INSERT INTO notes (title, description, course, type, year, file_path, uploaded_by)
        VALUES ('$title', '$description', '$course', '$type', $year, '$relativePath', $uploaded_by)";

mysqli_query($conn, $sql);

echo json_encode([
    "message" => "File uploaded successfully",
    "note_id" => mysqli_insert_id($conn)
]);

mysqli_close($conn);
?>
