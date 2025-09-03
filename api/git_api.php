<?php

require_once './GitConnection.php';

class GitAPI {
    private $db;
    private $isDirectCall = true;
    private $isCLI;
    
    public function __construct(bool $isDirectCall = true) {
        $this->isDirectCall = $isDirectCall;
        $this->isCLI = php_sapi_name() === 'cli';
        
        try {
            $this->db = new mysqli('localhost', 'root', '', 'update_tracker');
            if ($this->db->connect_error) {
                $this->sendResponse(['error' => 'خطا در اتصال به دیتابیس: ' . $this->db->connect_error], 500);
            }
            $this->db->set_charset('utf8mb4');
        
        // Verify Git is available
        $this->setupGitEnvironment();
    }
    
    private function setupGitEnvironment(): void {
        try {
            // Test Git availability
            GitConnection::executeGitCommand('git --version', true);
        } catch (Exception $e) {
            error_log("Git setup error: " . $e->getMessage());
            throw new Exception("Git is not properly configured. Please ensure Git is installed and accessible.");
        }
    }

    private function executeCommand(string $command, bool $ignoreErrors = false): string {
        try {
            return GitConnection::executeGitCommand($command, $ignoreErrors);
        } catch (Exception $e) {
            error_log("Git command failed: " . $e->getMessage());
            if (!$ignoreErrors) {
                throw $e;
            }
            return '';
        }
    }

    private function getJsonInput(): array {
        if ($this->isCLI) {
            global $argv;
            if (count($argv) < 2) {
                fwrite(STDERR, "Error: No input provided\n");
                fwrite(STDERR, "Usage: php git_api.php '{\"customer_id\": 1}'\n");
                exit(1);
            }
            $input = $argv[1];
        } else {
            $input = file_get_contents('php://input');
        }
        
        $data = json_decode($input, true);
        if (!$data) {
            if ($this->isCLI) {
                fwrite(STDERR, "Error: Invalid JSON input\n");
                exit(1);
            }
            $this->sendResponse(['error' => 'Invalid JSON input'], 400);
        }
        return $data;
    }

    private function sendResponse($data, int $statusCode = 200): void {
        if ($this->isCLI) {
            if ($statusCode >= 400) {
                fwrite(STDERR, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n");
                exit(1);
            } else {
                echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";
                exit(0);
            }
        }
        
        http_response_code($statusCode);
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }

    private function isDirectApiCall(): bool {
        return $this->isDirectCall;
    }

    private function getCustomerRepoInfo(int $customerId): array {
        $stmt = $this->db->prepare("
            SELECT 
                c.id,
                c.project_server_path,
                c.git_react_repo,
                c.git_php_repo,
                c.react_branch,
                c.php_branch,
                c.git_access_token
            FROM customers c
            WHERE c.id = ?
        ");
        $stmt->bind_param("i", $customerId);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc() ?: [];
    }

    public function testGitConnection(?int $customerId = null): array {
        if ($customerId === null) {
            $data = $this->getJsonInput();
            $customerId = isset($data['customer_id']) ? (int)$data['customer_id'] : null;
        }

        if (!$customerId) {
            if ($this->isDirectApiCall()) {
                $this->sendResponse(['error' => 'شناسه مشتری الزامی است'], 400);
            }
            return [
                'status' => 'error',
                'message' => 'شناسه مشتری الزامی است'
            ];
        }

        $customerInfo = $this->getCustomerRepoInfo($customerId);
        if (!$customerInfo) {
            $this->sendResponse(['error' => 'مشتری یافت نشد'], 404);
        }

        $result = [
            'status' => 'testing',
            'connection_errors' => [],
            'connection_tests' => []
        ];

        foreach (['react', 'php'] as $repoType) {
            $repoUrl = $customerInfo["git_{$repoType}_repo"];
            $result['connection_tests'][$repoType] = [
                'status' => 'not_tested',
                'https_test' => ['status' => 'not_tested'],
                'ssh_test' => ['status' => 'not_tested'],
                'branch_test' => ['status' => 'not_tested'],
                'repository_info' => ['exists' => false],
                'errors' => []
            ];

            if (!$repoUrl) {
                continue;
            }

            try {
                // Test HTTPS connection
                $command = sprintf('git ls-remote %s HEAD', escapeshellarg($repoUrl));
                $output = $this->executeCommand($command);
                
                $result['connection_tests'][$repoType] = [
                    'status' => 'success',
                    'https_test' => [
                        'status' => 'success',
                        'message' => 'اتصال HTTPS موفق'
                    ],
                    'repository_info' => [
                        'exists' => true,
                        'message' => 'دسترسی به مخزن تایید شد'
                    ]
                ];
            } catch (Exception $e) {
                $error = $e->getMessage();
                $result['connection_errors'][$repoType] = [
                    'message' => 'خطا در اتصال به مخزن',
                    'details' => [$error]
                ];
                $result['connection_tests'][$repoType] = [
                    'status' => 'failed',
                    'https_test' => [
                        'status' => 'failed',
                        'message' => $error
                    ],
                    'repository_info' => [
                        'exists' => false,
                        'message' => 'خطا در دسترسی به مخزن: ' . $error
                    ],
                    'errors' => [$error]
                ];
            }
        }

        if (!empty($result['connection_errors'])) {
            $result['error'] = 'خطا در اتصال به مخازن';
        }

        $this->sendResponse($result);
        return $result;
    }

    private function validateGitConnection(string $url): array {
        $result = ['success' => false, 'message' => '', 'working_url' => null];
        
        try {
            // Try direct Git connection
            $command = sprintf('git ls-remote %s HEAD', escapeshellarg($url));
            $output = $this->executeCommand($command, true);
            
            if (!empty($output) && strpos($output, 'fatal') === false) {
                $result['success'] = true;
                $result['message'] = 'Repository validated successfully';
                $result['working_url'] = $url;
            } else {
                $result['message'] = 'Could not validate repository access';
            }
        } catch (Exception $e) {
            $result['message'] = $e->getMessage();
        }
        
        return $result;
    }
}

// Handle requests based on environment
if (php_sapi_name() === 'cli') {
    // CLI mode
    try {
        $api = new GitAPI();
        $api->testGitConnection();
    } catch (Exception $e) {
        fwrite(STDERR, "Error: " . $e->getMessage() . "\n");
        exit(1);
    }
} else {
    // Web mode
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Content-Type: application/json; charset=UTF-8");

    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        http_response_code(204);
        exit();
    }

    try {
        $api = new GitAPI();
        $api->testGitConnection();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'error' => 'خطای سیستمی',
            'message' => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
}
}
