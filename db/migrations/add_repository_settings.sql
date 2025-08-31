-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 30, 2025 at 03:13 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `update_tracker`
--

-- --------------------------------------------------------

--
-- Table structure for table `site_settings`
--

CREATE TABLE `site_settings` (
  `id` int(1) NOT NULL DEFAULT 1,
  `site_title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `font_family` varchar(100) DEFAULT NULL,
  `primary_color` varchar(10) DEFAULT NULL,
  `text_color` varchar(10) DEFAULT NULL,
  `company_react_repo` varchar(255) DEFAULT NULL COMMENT 'آدرس مخزن گیت پروژه React شرکت',
  `company_php_repo` varchar(255) DEFAULT NULL COMMENT 'آدرس مخزن گیت پروژه PHP شرکت'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `site_settings`
--

INSERT INTO `site_settings` (`id`, `site_title`, `logo_url`, `font_family`, `primary_color`, `text_color`, `company_react_repo`, `company_php_repo`) VALUES
(1, 'وب حساب', '/api/uploads/logos/logo_1755516079.png', 'IRANSans', '#9f31a8', '#0c125a', NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `site_settings`
--
ALTER TABLE `site_settings`
  ADD PRIMARY KEY (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
