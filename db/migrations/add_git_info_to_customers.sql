-- اضافه کردن فیلدهای مربوط به گیت در جدول مشتریان
ALTER TABLE customers
ADD git_react_repo VARCHAR(255) DEFAULT NULL COMMENT 'آدرس مخزن گیت React مشتری',
ADD git_php_repo VARCHAR(255) DEFAULT NULL COMMENT 'آدرس مخزن گیت PHP مشتری',
ADD git_username VARCHAR(100) DEFAULT NULL COMMENT 'نام کاربری گیت',
ADD git_access_token VARCHAR(255) DEFAULT NULL COMMENT 'توکن دسترسی به گیت',
ADD git_ssh_key TEXT DEFAULT NULL COMMENT 'کلید SSH برای دسترسی به گیت',
ADD last_react_sync DATETIME DEFAULT NULL COMMENT 'آخرین همگام‌سازی پروژه React',
ADD last_php_sync DATETIME DEFAULT NULL COMMENT 'آخرین همگام‌سازی پروژه PHP',
ADD react_branch VARCHAR(100) DEFAULT 'main' COMMENT 'شاخه اصلی پروژه React',
ADD php_branch VARCHAR(100) DEFAULT 'main' COMMENT 'شاخه اصلی پروژه PHP';
