-- ایجاد جدول برای ذخیره به‌روزرسانی‌های ریپوزیتوری
CREATE TABLE `repository_updates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `repository_type` enum('react','php') NOT NULL COMMENT 'نوع ریپوزیتوری',
  `branch` varchar(100) NOT NULL COMMENT 'نام شاخه',
  `commit_count` int(11) NOT NULL DEFAULT 0 COMMENT 'تعداد کامیت‌ها',
  `last_commit_hash` varchar(40) NOT NULL COMMENT 'هش آخرین کامیت',
  `commit_message` text DEFAULT NULL COMMENT 'پیام کامیت',
  `author` varchar(255) DEFAULT NULL COMMENT 'نویسنده کامیت',
  `update_time` datetime NOT NULL COMMENT 'زمان به‌روزرسانی',
  PRIMARY KEY (`id`),
  KEY `idx_repo_type` (`repository_type`),
  KEY `idx_update_time` (`update_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
