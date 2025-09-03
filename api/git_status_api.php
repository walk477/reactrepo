<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check if the request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed'
    ]);
    exit();
}

require_once 'GitConnection.php';

class GitStatusAPI {
    private $gitConnection;
    private $data;
    private $db;
    private $githubIPs = [
        "192.30.252.0/22",
        "185.199.108.0/22",
        "140.82.112.0/20",
        "143.55.64.0/20"
    ];

    public function __construct() {
        try {
            // خواندن و پردازش داده‌های JSON
            $jsonInput = file_get_contents("php://input");
            if ($jsonInput === false) {
                throw new Exception("Failed to read request body");
            }

            $this->data = json_decode($jsonInput, true);
            if ($this->data === null && json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception("Invalid JSON format: " . json_last_error_msg());
            }

            // ایجاد نمونه از کلاس GitConnection
            $this->gitConnection = new GitConnection();

            // اتصال به دیتابیس
            try {
                $this->db = new PDO(
                    "mysql:host=localhost;dbname=webhesab;charset=utf8mb4",
                    "root",
                    ""
                );
                $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $this->db->exec("SET NAMES utf8mb4");
                $this->db->exec("SET CHARACTER SET utf8mb4");
                $this->db->exec("SET character_set_connection=utf8mb4");
            } catch (PDOException $e) {
                // در صورت خطا در اتصال به دیتابیس، لاگ می‌کنیم اما کار را ادامه می‌دهیم
                error_log("Database connection failed: " . $e->getMessage());
            }
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
            exit();
        }
    }

    private function validateRequest() {
        $requiredFields = [
            'customerId',
            'projectType',
            'customerRepoUrl',
            'customerBranch',
            'serverIp',
            'serverUsername',
            'projectPath',
            'connectionMethod'
        ];

        foreach ($requiredFields as $field) {
            if (!isset($this->data[$field]) || empty($this->data[$field])) {
                throw new Exception("Missing required field: $field");
            }
        }

        // اعتبارسنجی متد اتصال
        if ($this->data['connectionMethod'] === 'ssh' && empty($this->data['gitSshKey'])) {
            throw new Exception("SSH key is required for SSH connection method");
        }
        if ($this->data['connectionMethod'] === 'https' && 
            (empty($this->data['gitUsername']) || empty($this->data['gitAccessToken']))) {
            throw new Exception("Username and access token are required for HTTPS connection method");
        }
    }

    private function checkServerConnection() {
        $connection = ssh2_connect($this->data['serverIp'], $this->data['serverPort']);
        if (!$connection) {
            throw new Exception("Could not connect to server");
        }

        if (!empty($this->data['serverPassword'])) {
            if (!ssh2_auth_password($connection, $this->data['serverUsername'], $this->data['serverPassword'])) {
                throw new Exception("Could not authenticate with server");
            }
        } else {
            // استفاده از کلید SSH برای احراز هویت
            $privateKeyFile = tempnam(sys_get_temp_dir(), 'ssh_key_');
            file_put_contents($privateKeyFile, $this->data['gitSshKey']);
            chmod($privateKeyFile, 0600);
            
            if (!ssh2_auth_pubkey_file($connection, $this->data['serverUsername'], 
                                     $this->data['gitSshKeyPublic'], $privateKeyFile)) {
                unlink($privateKeyFile);
                throw new Exception("Could not authenticate with SSH key");
            }
            unlink($privateKeyFile);
        }

        return $connection;
    }

    private function compareRepositories() {
        $localRepo = $this->data['customerRepoUrl'];
        $companyRepo = $this->data['companyRepoUrl'];
        $branch = $this->data['customerBranch'];

        // دریافت آخرین کامیت از مخزن شرکت
        $companyLastCommit = $this->gitConnection->getLastCommit($companyRepo, $branch);
        
        // دریافت آخرین کامیت از مخزن مشتری
        $customerLastCommit = $this->gitConnection->getLastCommit($localRepo, $branch);

        // مقایسه تغییرات
        $comparison = $this->gitConnection->compareCommits($companyRepo, $localRepo, $branch);

        return [
            'needsUpdate' => $comparison['behindBy'] > 0,
            'behindCommits' => $comparison['behindBy'],
            'lastCommitDate' => $customerLastCommit['date'],
            'fileChanges' => [
                'added' => $comparison['added'],
                'modified' => $comparison['modified'],
                'deleted' => $comparison['deleted']
            ]
        ];
    }

    private function updateSyncHistory($customerId, $projectType, $status) {
        $stmt = $this->db->prepare("
            INSERT INTO repository_updates 
            (customer_id, project_type, status, changes_count, sync_date)
            VALUES (?, ?, ?, ?, NOW())
        ");
        
        $changesCount = count($status['fileChanges']['added']) +
                       count($status['fileChanges']['modified']) +
                       count($status['fileChanges']['deleted']);
        
        $stmt->execute([
            $customerId,
            $projectType,
            json_encode($status),
            $changesCount
        ]);
    }

    public function handleRequest() {
        try {
            // بررسی اعتبار درخواست
            $this->validateRequest();

            // بررسی وضعیت مخازن
            $status = $this->compareRepositories();
            
            // ذخیره نتایج در دیتابیس
            if ($this->db !== null) {
                try {
                    $this->updateSyncHistory(
                        $this->data['customerId'],
                        $this->data['projectType'],
                        $status
                    );
                } catch (Exception $e) {
                    // لاگ خطای دیتابیس
                    error_log("Failed to update sync history: " . $e->getMessage());
                }
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'status' => $status,
                'meta' => [
                    'customerRepoUrl' => $this->data['customerRepoUrl'],
                    'branch' => $this->data['customerBranch'],
                    'timestamp' => date('Y-m-d H:i:s')
                ]
            ], JSON_UNESCAPED_UNICODE);
            
        } catch (Exception $e) {
            $statusCode = 500;
            $message = $e->getMessage();
            
            // تعیین کد وضعیت مناسب بر اساس نوع خطا
            if (strpos($message, 'Missing required field') !== false) {
                $statusCode = 400;
            } elseif (strpos($message, 'Invalid JSON format') !== false) {
                $statusCode = 400;
            } elseif (strpos($message, 'Could not connect') !== false) {
                $statusCode = 503;
            }
            
            http_response_code($statusCode);
            echo json_encode([
                'success' => false,
                'error' => $message,
                'code' => $statusCode
            ], JSON_UNESCAPED_UNICODE);
        }
    }
}

$api = new GitStatusAPI();
$api->handleRequest();
