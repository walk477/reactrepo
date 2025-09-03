<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

class GitHubAccess {
    private $token;
    private $owner;
    private $repo;

    public function __construct($token, $repoUrl) {
        $this->token = $token;
        
        // استخراج owner و repo از URL گیت‌هاب
        if (preg_match('/github\.com\/([^\/]+)\/([^\/\.]+)/', $repoUrl, $matches)) {
            $this->owner = $matches[1];
            $this->repo = $matches[2];
        }
    }

    private function makeRequest($endpoint) {
        $ch = curl_init("https://api.github.com" . $endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: application/vnd.github.v3+json',
            'Authorization: Bearer ' . $this->token,
            'User-Agent: PHP'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return [
            'code' => $httpCode,
            'data' => json_decode($response, true)
        ];
    }

    public function checkAccess() {
        // بررسی دسترسی به مخزن
        $repoAccess = $this->makeRequest("/repos/{$this->owner}/{$this->repo}");
        
        if ($repoAccess['code'] === 200) {
            // دریافت اطلاعات کاربر
            $userInfo = $this->makeRequest("/user");
            
            if ($userInfo['code'] === 200) {
                // بررسی دسترسی‌های کاربر به مخزن
                $collaboratorCheck = $this->makeRequest("/repos/{$this->owner}/{$this->repo}/collaborators/{$userInfo['data']['login']}");
                
                return [
                    'success' => true,
                    'data' => [
                        'hasAccess' => $collaboratorCheck['code'] === 204,
                        'repoInfo' => [
                            'name' => $repoAccess['data']['name'],
                            'fullName' => $repoAccess['data']['full_name'],
                            'private' => $repoAccess['data']['private']
                        ],
                        'userInfo' => [
                            'login' => $userInfo['data']['login'],
                            'name' => $userInfo['data']['name'],
                            'email' => $userInfo['data']['email']
                        ],
                        'permission' => $collaboratorCheck['code'] === 204 ? 
                            $this->getCollaboratorPermission($userInfo['data']['login']) : 
                            null
                    ]
                ];
            }
        }

        return [
            'success' => false,
            'error' => 'Could not verify repository access'
        ];
    }

    private function getCollaboratorPermission($username) {
        $permissionCheck = $this->makeRequest("/repos/{$this->owner}/{$this->repo}/collaborators/{$username}/permission");
        return $permissionCheck['code'] === 200 ? $permissionCheck['data']['permission'] : null;
    }
}
