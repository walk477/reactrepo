--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `company_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contract_end_date` date DEFAULT NULL COMMENT 'تاریخ پایان قرارداد',
  `customer_type` enum('golden','normal') NOT NULL DEFAULT 'normal' COMMENT 'نوع مشتری (طلایی یا عادی)',
  `server_ip` varchar(45) DEFAULT NULL COMMENT 'آدرس IP سرور',
  `server_port` int(5) DEFAULT 22 COMMENT 'پورت سرور',
  `server_username` varchar(100) DEFAULT NULL COMMENT 'نام کاربری سرور',
  `server_password` varchar(255) DEFAULT NULL COMMENT 'رمز عبور سرور (باید رمزنگاری شود)',
  `app_folder_path` varchar(255) DEFAULT NULL COMMENT 'آدرس پوشه وب حساب',
  `created_by_user_id` int(11) NOT NULL COMMENT 'کاربری که این مشتری را ثبت کرده',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `project_server_path` varchar(255) DEFAULT NULL,
  `git_react_repo` varchar(255) DEFAULT NULL COMMENT 'آدرس HTTPS مخزن React مشتری',
  `git_php_repo` varchar(255) DEFAULT NULL COMMENT 'آدرس HTTPS مخزن PHP مشتری',
  `git_username` varchar(100) DEFAULT NULL COMMENT 'نام کاربری برای دسترسی HTTPS',
  `git_access_token` varchar(255) DEFAULT NULL COMMENT 'توکن دسترسی برای HTTPS',
  `git_ssh_key` text DEFAULT NULL COMMENT 'کلید SSH خصوصی',
  `last_react_sync` datetime DEFAULT NULL COMMENT 'آخرین همگام‌سازی پروژه React',
  `last_php_sync` datetime DEFAULT NULL COMMENT 'آخرین همگام‌سازی پروژه PHP',
  `react_branch` varchar(100) DEFAULT 'main' COMMENT 'شاخه اصلی پروژه React',
  `php_branch` varchar(100) DEFAULT 'main' COMMENT 'شاخه اصلی پروژه PHP',
  `git_react_repo_ssh` varchar(255) DEFAULT NULL COMMENT 'آدرس SSH مخزن React مشتری',
  `git_php_repo_ssh` varchar(255) DEFAULT NULL COMMENT 'آدرس SSH مخزن PHP مشتری',
  `git_ssh_key_public` text DEFAULT NULL COMMENT 'کلید SSH عمومی',
  `preferred_connection` enum('ssh','https') DEFAULT 'https' COMMENT 'روش ترجیحی اتصال به مخزن',
  `react_sync_status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'وضعیت همگام‌سازی React' CHECK (json_valid(`react_sync_status`)),
  `php_sync_status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'وضعیت همگام‌سازی PHP' CHECK (json_valid(`php_sync_status`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
