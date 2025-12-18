-- Noteify Database Schema
-- Run this script in phpMyAdmin or MySQL command line to create the database and tables

CREATE DATABASE IF NOT EXISTS noteify_db;
USE noteify_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role VARCHAR(50) DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
    note_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    course VARCHAR(100),
    type VARCHAR(50),
    year INT,
    file_path VARCHAR(500) NOT NULL,
    uploaded_by INT,
    views INT DEFAULT 0,
    downloads INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Insert sample users
INSERT INTO users (name, email, role) VALUES
('Student User', 'student@university.edu', 'student'),
('Saurav Patel', 'saurav@example.com', 'student'),
('Sujan Ghimire', 'sujan@example.com', 'student'),
('Priya Singh', 'priya@example.com', 'student');

