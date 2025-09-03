<?php
require_once 'GitConnection.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Validate JWT token
require_once 'auth_middleware.php';
$user = validateToken();

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);
$customerId = $data['customerId'] ?? null;
$projectType = $data['projectType'] ?? null; // 'react' or 'php'

if (!$customerId || !$projectType) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required parameters']);
    exit;
}

try {
    // Initialize database connection
    $db = new PDO("mysql:host=localhost;dbname=your_database", "username", "password");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get customer's git settings
    $stmt = $db->prepare("SELECT * FROM customers WHERE id = ?");
    $stmt->execute([$customerId]);
    $customer = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$customer) {
        throw new Exception('Customer not found');
    }

    // Initialize Git connection
    $gitConnection = new GitConnection([
        'username' => $customer['git_username'],
        'access_token' => $customer['git_access_token'],
        'repo_url' => $projectType === 'react' ? $customer['git_react_repo'] : $customer['git_php_repo'],
        'branch' => $projectType === 'react' ? $customer['react_branch'] : $customer['php_branch'],
        'connection_type' => $customer['preferred_connection']
    ]);

    // Get the path to the local repository
    $repoPath = $projectType === 'react' ? '/path/to/react/repo' : '/path/to/php/repo';
    
    // Ensure we're on the correct branch
    $gitConnection->execute(['git', 'checkout', $customer["{$projectType}_branch"]], $repoPath);
    
    // Pull latest changes first to avoid conflicts
    $gitConnection->execute(['git', 'pull', 'origin', $customer["{$projectType}_branch"]], $repoPath);
    
    // Add all changes
    $gitConnection->execute(['git', 'add', '.'], $repoPath);
    
    // Commit changes
    $commitMessage = "Auto-update from WebHesab System - " . date('Y-m-d H:i:s');
    $gitConnection->execute(['git', 'commit', '-m', $commitMessage], $repoPath);
    
    // Push changes
    $pushResult = $gitConnection->execute([
        'git', 'push', 'origin', $customer["{$projectType}_branch"]
    ], $repoPath);

    // Log the operation
    $stmt = $db->prepare("INSERT INTO repository_updates (customer_id, project_type, operation, status, message) VALUES (?, ?, 'push', 'success', ?)");
    $stmt->execute([$customerId, $projectType, $commitMessage]);

    echo json_encode([
        'success' => true,
        'message' => 'Changes pushed successfully',
        'details' => $pushResult
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'details' => $e->getTrace()
    ]);

    // Log the error
    if (isset($db)) {
        $stmt = $db->prepare("INSERT INTO repository_updates (customer_id, project_type, operation, status, message) VALUES (?, ?, 'push', 'error', ?)");
        $stmt->execute([$customerId, $projectType, $e->getMessage()]);
    }
}
