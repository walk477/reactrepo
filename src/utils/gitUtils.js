const { exec } = require('child_process');

// تابع کمکی برای اجرای دستورات گیت
function executeGitCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout.trim());
        });
    });
}

// تابع برای بررسی وضعیت گیت محلی
async function checkLocalGit() {
    try {
        // بررسی نصب بودن گیت
        await executeGitCommand('git --version');
        
        // دریافت اطلاعات کانفیگ
        const userName = await executeGitCommand('git config --global user.name');
        const userEmail = await executeGitCommand('git config --global user.email');
        
        // دریافت اطلاعات ریپوزیتوری
        const currentBranch = await executeGitCommand('git rev-parse --abbrev-ref HEAD');
        const status = await executeGitCommand('git status --porcelain');
        
        // دریافت اطلاعات آخرین کامیت
        const lastCommit = await executeGitCommand('git log -1 --pretty=format:"%h|%s|%an|%ad"');
        const [hash, message, author, date] = lastCommit.split('|');

        return {
            installed: true,
            config: {
                userName,
                userEmail
            },
            repoStatus: {
                currentBranch,
                hasChanges: status.length > 0,
                lastCommit: {
                    hash,
                    message,
                    author,
                    date
                }
            }
        };
    } catch (error) {
        return {
            installed: false,
            error: error.message
        };
    }
}

module.exports = {
    checkLocalGit
};
