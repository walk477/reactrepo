<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'auth_middleware.php';
$user = validateToken();

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$customerId = $data['customerId'] ?? null;

if (!$customerId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing customer ID']);
    exit;
}

try {
    $db = new PDO("mysql:host=localhost;dbname=your_database", "username", "password");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // دریافت اطلاعات گیت مشتری
    $stmt = $db->prepare("SELECT git_username, git_access_token, git_react_repo, git_php_repo, preferred_connection FROM customers WHERE id = ?");
    $stmt->execute([$customerId]);
    $customer = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$customer) {
        throw new Exception('مشتری یافت نشد');
    }

    if (!$customer['git_username'] || !$customer['git_access_token']) {
        throw new Exception('اطلاعات دسترسی گیت تنظیم نشده است');
    }

    // تست اتصال به مخزن React
    if ($customer['git_react_repo']) {
        $reactUrl = $customer['git_react_repo'];
        if ($customer['preferred_connection'] === 'https') {
            $reactUrl = preg_replace('/^https:\/\//', 'https://' . $customer['git_username'] . ':' . $customer['git_access_token'] . '@', $reactUrl);
        }
        
        exec("git ls-remote $reactUrl 2>&1", $output, $returnVar);
        if ($returnVar !== 0) {
            throw new Exception('خطا در اتصال به مخزن React: ' . implode("\n", $output));
        }
    }

    // تست اتصال به مخزن PHP
    if ($customer['git_php_repo']) {
        $phpUrl = $customer['git_php_repo'];
        if ($customer['preferred_connection'] === 'https') {
            $phpUrl = preg_replace('/^https:\/\//', 'https://' . $customer['git_username'] . ':' . $customer['git_access_token'] . '@', $phpUrl);
        }
        
        exec("git ls-remote $phpUrl 2>&1", $output, $returnVar);
        if ($returnVar !== 0) {
            throw new Exception('خطا در اتصال به مخزن PHP: ' . implode("\n", $output));
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'اتصال به مخازن گیت با موفقیت تست شد'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage()
    ]);
}
