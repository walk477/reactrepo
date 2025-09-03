<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db_connect.php';

class CustomersAPI {
    private $db;
    private $requestMethod;
    private $customerId;

    public function __construct($db, $requestMethod, $customerId = null) {
        $this->db = $db;
        $this->requestMethod = $requestMethod;
        $this->customerId = $customerId;
    }

    public function processRequest() {
        switch ($this->requestMethod) {
            case 'GET':
                if ($this->customerId) {
                    $response = $this->getCustomer($this->customerId);
                } else {
                    $response = $this->getAllCustomers();
                }
                break;
            default:
                $response = $this->notFoundResponse();
                break;
        }
        
        header($response['status_code_header']);
        if ($response['body']) {
            echo $response['body'];
        }
    }

    private function getAllCustomers() {
        $query = "SELECT * FROM customers";
        try {
            $statement = $this->db->query($query);
            $result = $statement->fetchAll(PDO::FETCH_ASSOC);
            
            $response['status_code_header'] = 'HTTP/1.1 200 OK';
            $response['body'] = json_encode([
                'success' => true,
                'customers' => $result
            ]);
            return $response;
        } catch (PDOException $e) {
            return $this->unprocessableEntityResponse($e->getMessage());
        }
    }

    private function getCustomer($id) {
        $query = "SELECT * FROM customers WHERE id = :id";
        try {
            $statement = $this->db->prepare($query);
            $statement->execute(['id' => $id]);
            $result = $statement->fetch(PDO::FETCH_ASSOC);

            if ($result) {
                $response['status_code_header'] = 'HTTP/1.1 200 OK';
                $response['body'] = json_encode([
                    'success' => true,
                    'customer' => $result
                ]);
            } else {
                return $this->notFoundResponse();
            }
            return $response;
        } catch (PDOException $e) {
            return $this->unprocessableEntityResponse($e->getMessage());
        }
    }

    private function unprocessableEntityResponse($error = 'Invalid input') {
        $response['status_code_header'] = 'HTTP/1.1 422 Unprocessable Entity';
        $response['body'] = json_encode([
            'success' => false,
            'error' => $error
        ]);
        return $response;
    }

    private function notFoundResponse() {
        $response['status_code_header'] = 'HTTP/1.1 404 Not Found';
        $response['body'] = json_encode([
            'success' => false,
            'error' => 'Customer not found'
        ]);
        return $response;
    }
}

// Handle request
try {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $uri = explode('/', $uri);
    
    $customerId = null;
    if (isset($uri[4])) {
        $customerId = (int) $uri[4];
    }

    $dbConnection = new PDO(
        "mysql:host=localhost;dbname=webhesab;charset=utf8mb4",
        "root",
        ""
    );
    $dbConnection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $dbConnection->exec("SET NAMES utf8mb4");
    
    $api = new CustomersAPI($dbConnection, $_SERVER['REQUEST_METHOD'], $customerId);
    $api->processRequest();

} catch (Exception $e) {
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
