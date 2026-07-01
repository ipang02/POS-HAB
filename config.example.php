<?php
// ============================================================
// HAB Barbershop — Database Configuration
// Copy this file to config.php and fill in your credentials
// ============================================================

define('DB_HOST', 'localhost');   // Always 'localhost' on Hostinger
define('DB_USER', 'u000000_dbuser');  // Hostinger username_dbuser format
define('DB_PASS', 'your_password');
define('DB_NAME', 'u000000_dbname');

// Connect
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($conn->connect_error) {
    die(json_encode(['error' => 'Database connection failed.']));
}
$conn->set_charset('utf8mb4');
