-- اصلاح ساختار جدول customers برای پشتیبانی از هر دو روش دسترسی SSH و HTTPS
ALTER TABLE `customers`
DROP COLUMN `gitlab_ssh_url`,
DROP COLUMN `gitlab_https_url`,
DROP COLUMN `gitlab_token`;

-- اضافه کردن فیلدهای جدید برای دسترسی‌های SSH و HTTPS
ALTER TABLE `customers`
MODIFY `git_react_repo` varchar(255) DEFAULT NULL COMMENT 'آدرس HTTPS مخزن React مشتری',
ADD `git_react_repo_ssh` varchar(255) DEFAULT NULL COMMENT 'آدرس SSH مخزن React مشتری',
MODIFY `git_php_repo` varchar(255) DEFAULT NULL COMMENT 'آدرس HTTPS مخزن PHP مشتری',
ADD `git_php_repo_ssh` varchar(255) DEFAULT NULL COMMENT 'آدرس SSH مخزن PHP مشتری',
MODIFY `git_username` varchar(100) DEFAULT NULL COMMENT 'نام کاربری برای دسترسی HTTPS',
MODIFY `git_access_token` varchar(255) DEFAULT NULL COMMENT 'توکن دسترسی برای HTTPS',
MODIFY `git_ssh_key` text DEFAULT NULL COMMENT 'کلید SSH خصوصی',
ADD `git_ssh_key_public` text DEFAULT NULL COMMENT 'کلید SSH عمومی',
ADD `preferred_connection` enum('ssh','https') DEFAULT 'https' COMMENT 'روش ترجیحی اتصال به مخزن';

-- اضافه کردن فیلدهای وضعیت همگام‌سازی
ALTER TABLE `customers`
ADD `react_sync_status` JSON DEFAULT NULL COMMENT 'وضعیت همگام‌سازی React',
ADD `php_sync_status` JSON DEFAULT NULL COMMENT 'وضعیت همگام‌سازی PHP';

-- به‌روزرسانی داده‌های نمونه
UPDATE `customers` SET
`react_sync_status` = '{"behind_commits": 0, "last_check": null, "needs_update": false, "last_sync_method": "https"}',
`php_sync_status` = '{"behind_commits": 0, "last_check": null, "needs_update": false, "last_sync_method": "https"}',
`preferred_connection` = 'https'
WHERE id > 0;

-- ایجاد تریگر برای مدیریت وضعیت همگام‌سازی
DELIMITER //
CREATE TRIGGER `update_sync_status_on_repo_change` BEFORE UPDATE ON `customers`
FOR EACH ROW
BEGIN
    IF NEW.git_react_repo != OLD.git_react_repo OR NEW.git_react_repo_ssh != OLD.git_react_repo_ssh THEN
        SET NEW.react_sync_status = '{"behind_commits": 0, "last_check": null, "needs_update": true, "last_sync_method": null}';
    END IF;
    IF NEW.git_php_repo != OLD.git_php_repo OR NEW.git_php_repo_ssh != OLD.git_php_repo_ssh THEN
        SET NEW.php_sync_status = '{"behind_commits": 0, "last_check": null, "needs_update": true, "last_sync_method": null}';
    END IF;
END;//
DELIMITER ;
