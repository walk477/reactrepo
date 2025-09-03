// سرویس مدیریت گیت محلی
class LocalGitService {
    // دریافت اطلاعات کانفیگ گیت محلی
    static async getGitConfig() {
        try {
            const userNameCommand = 'git config --global user.name';
            const userEmailCommand = 'git config --global user.email';

            const userName = await this.executeCommand(userNameCommand);
            const userEmail = await this.executeCommand(userEmailCommand);

            return {
                userName: userName.trim(),
                userEmail: userEmail.trim()
            };
        } catch (error) {
            console.error('Error getting git config:', error);
            throw error;
        }
    }

    // دریافت وضعیت ریپوزیتوری فعلی
    static async getRepositoryStatus() {
        try {
            const statusCommand = 'git status --porcelain';
            const branchCommand = 'git rev-parse --abbrev-ref HEAD';
            const lastCommitCommand = 'git log -1 --pretty=format:"%h|%s|%an|%ad"';

            const status = await this.executeCommand(statusCommand);
            const branch = await this.executeCommand(branchCommand);
            const lastCommit = await this.executeCommand(lastCommitCommand);

            // پردازش اطلاعات آخرین کامیت
            const [hash, message, author, date] = lastCommit.split('|');

            return {
                hasChanges: status.length > 0,
                currentBranch: branch.trim(),
                lastCommit: {
                    hash: hash.trim(),
                    message: message.trim(),
                    author: author.trim(),
                    date: date.trim()
                }
            };
        } catch (error) {
            console.error('Error getting repository status:', error);
            throw error;
        }
    }

    // بررسی نصب بودن گیت
    static async isGitInstalled() {
        try {
            await this.executeCommand('git --version');
            return true;
        } catch (error) {
            return false;
        }
    }

    // اجرای دستور در ترمینال
    static executeCommand(command) {
        return new Promise((resolve, reject) => {
            const { exec } = require('child_process');
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(stdout);
            });
        });
    }
}

export default LocalGitService;
