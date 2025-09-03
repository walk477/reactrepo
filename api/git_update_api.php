<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'GitConnection.php';

class UpdateAPI {
    private $gitConnection;
    private $data;
    private $db;

    public function __construct() {
        $this->gitConnection = new GitConnection();
        $this->data = json_decode(file_get_contents("php://input"), true);
        
        $this->db = new PDO(
            "mysql:host=localhost;dbname=your_database;charset=utf8mb4",
            "your_username",
            "your_password"
        );
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    private function validateRequest() {
        $requiredFields = [
            'customerId',
            'projectType',
            'repoUrl',
            'branch',
            'projectPath'
        ];

        foreach ($requiredFields as $field) {
            if (!isset($this->data[$field]) || empty($this->data[$field])) {
                throw new Exception("Missing required field: $field");
            }
        }
    }

    private function updateRepository() {
        return $this->gitConnection->updateRepository(
            $this->data['repoUrl'],
            $this->data['branch'],
            $this->data['projectPath']
        );
    }

    private function logUpdate($status) {
        $stmt = $this->db->prepare("
            INSERT INTO repository_updates 
            (customer_id, project_type, status, update_date)
            VALUES (?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $this->data['customerId'],
            $this->data['projectType'],
            json_encode($status)
        ]);
    }

    public function handleRequest() {
        try {
            $this->validateRequest();
            
            // انجام به‌روزرسانی
            $status = $this->updateRepository();
            
            // ذخیره لاگ در دیتابیس
            $this->logUpdate($status);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'status' => $status
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
}

$api = new UpdateAPI();
$api->handleRequest();
