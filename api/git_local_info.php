<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// تابع اجرای دستور در خط فرمان
function executeCommand($command) {
    $output = [];
    $returnVar = 0;
    exec($command . ' 2>&1', $output, $returnVar);
    return [
        'output' => implode("\n", $output),
        'status' => $returnVar
    ];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // بررسی نصب بودن گیت
        $gitVersion = executeCommand('git --version');
        if ($gitVersion['status'] !== 0) {
            throw new Exception('Git is not installed');
        }

        // دریافت اطلاعات گیت
        $userName = executeCommand('git config --global user.name');
        $userEmail = executeCommand('git config --global user.email');
        $currentBranch = executeCommand('git rev-parse --abbrev-ref HEAD');
        $status = executeCommand('git status --porcelain');
        $lastCommit = executeCommand('git log -1 --pretty=format:"%h|%s|%an|%ad"');

        // پردازش اطلاعات آخرین کامیت
        $commitParts = explode('|', $lastCommit['output']);
        
        $response = [
            'success' => true,
            'data' => [
                'installed' => true,
                'config' => [
                    'userName' => trim($userName['output']),
                    'userEmail' => trim($userEmail['output'])
                ],
                'repoStatus' => [
                    'currentBranch' => trim($currentBranch['output']),
                    'hasChanges' => !empty($status['output']),
                    'lastCommit' => count($commitParts) === 4 ? [
                        'hash' => $commitParts[0],
                        'message' => $commitParts[1],
                        'author' => $commitParts[2],
                        'date' => $commitParts[3]
                    ] : null
                ]
            ]
        ];

        echo json_encode($response);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage(),
            'data' => [
                'installed' => false
            ]
        ]);
    }
}
