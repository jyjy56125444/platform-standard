CREATE DATABASE  IF NOT EXISTS `egg_minimal_prod` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `egg_minimal_prod`;
-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: dbconn.sealoshzh.site    Database: egg_minimal_prod
-- ------------------------------------------------------
-- Server version	8.0.30

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '535e3b66-aa68-11f0-b027-eafde378a1b4:1-5651292';

--
-- Table structure for table `mobile_app`
--

DROP TABLE IF EXISTS `mobile_app`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mobile_app` (
  `APP_ID` int NOT NULL AUTO_INCREMENT COMMENT '应用ID',
  `APP_NAME` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '应用名称',
  `APP_FULLNAME` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '应用全称',
  `APP_TYPE` int DEFAULT NULL COMMENT '应用类型：1-Android，2-iOS，3-WebApp',
  `APP_ICON` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '应用图标（网络链接）',
  `CREATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `UPDATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `CREATOR` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `UPDATER` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  PRIMARY KEY (`APP_ID`),
  KEY `idx_app_name` (`APP_NAME`),
  KEY `idx_app_type` (`APP_TYPE`),
  KEY `idx_create_time` (`CREATE_TIME`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='移动应用管理业务主表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mobile_app`
--

LOCK TABLES `mobile_app` WRITE;
/*!40000 ALTER TABLE `mobile_app` DISABLE KEYS */;
INSERT INTO `mobile_app` VALUES (33,'android框架3.0','android开发框架项目',1,'http://platform-standard.oss-cn-hangzhou.aliyuncs.com/apps/icons/1768813724430_jwn1op.webp','2026-01-19 17:08:58','2026-01-19 17:08:58','admin','admin'),(34,'als','阿拉善污水管控',1,'http://platform-standard.oss-cn-hangzhou.aliyuncs.com/apps/icons/1772153422047_q9e6cz.jpg','2026-02-27 08:50:34','2026-02-27 08:50:34','fuhh','fuhh'),(35,'上海质控运维','shqc',1,'http://platform-standard.oss-cn-hangzhou.aliyuncs.com/apps/icons/1779691643661_kpwbrg.png','2026-05-25 14:47:25','2026-05-25 14:47:25','admin','admin');
/*!40000 ALTER TABLE `mobile_app` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mobile_app_info`
--

DROP TABLE IF EXISTS `mobile_app_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mobile_app_info` (
  `ID` int NOT NULL AUTO_INCREMENT COMMENT '扩展信息ID',
  `APP_ID` int NOT NULL COMMENT '应用ID',
  `DEVELOPER` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '开发人员',
  `INTERFACE_DEVELOPER` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '接口开发人员',
  `DESIGNER` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '设计人员',
  `REMARK` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注',
  `CREATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `UPDATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `CREATOR` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `UPDATER` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  PRIMARY KEY (`ID`),
  UNIQUE KEY `uk_app_id` (`APP_ID`),
  KEY `idx_create_time` (`CREATE_TIME`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='移动应用扩展信息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mobile_app_info`
--

LOCK TABLES `mobile_app_info` WRITE;
/*!40000 ALTER TABLE `mobile_app_info` DISABLE KEYS */;
INSERT INTO `mobile_app_info` VALUES (33,33,'王一凡','王一凡','王一凡',NULL,'2026-01-19 17:08:58','2026-01-19 17:08:58','admin','admin'),(34,34,NULL,NULL,NULL,NULL,'2026-02-27 08:50:34','2026-02-27 08:50:34','fuhh','fuhh'),(35,35,NULL,NULL,NULL,NULL,'2026-05-25 14:47:25','2026-05-25 14:47:25','admin','admin');
/*!40000 ALTER TABLE `mobile_app_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mobile_app_log`
--

DROP TABLE IF EXISTS `mobile_app_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mobile_app_log` (
  `ID` bigint NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `VERSION_ID` int DEFAULT NULL COMMENT '版本ID，对应 mobile_version.VERSION_ID，可空',
  `APP_ID` int NOT NULL COMMENT '应用ID，对应 mobile_app.APP_ID',
  `ACTION` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '操作类型：create/update/publish/rollback/delete 等',
  `ACTION_DETAIL` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '操作描述或差异信息（JSON/文本）',
  `OPERATOR_ID` int NOT NULL COMMENT '客户端操作者用户ID',
  `OPERATOR_NAME` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '客户端操作者用户名快照',
  `RESULT_STATUS` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'success' COMMENT '执行结果：success/fail/pending',
  `CLIENT_IP` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '操作者 IP',
  `EXTRA_DATA` json DEFAULT NULL COMMENT '扩展字段，如发布参数、审批信息等',
  `CREATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
  PRIMARY KEY (`ID`),
  KEY `idx_app` (`APP_ID`),
  KEY `idx_version` (`VERSION_ID`),
  KEY `idx_operator_time` (`OPERATOR_ID`,`CREATE_TIME`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='移动应用操作日志';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mobile_app_log`
--

LOCK TABLES `mobile_app_log` WRITE;
/*!40000 ALTER TABLE `mobile_app_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `mobile_app_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mobile_app_ticket`
--

DROP TABLE IF EXISTS `mobile_app_ticket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mobile_app_ticket` (
  `ID` int NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `APP_ID` int NOT NULL COMMENT '应用ID，对应 mobile_app.APP_ID',
  `APP_USER_ID` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '应用用户标识（可以是 UUID 或 int 形式）',
  `PLATFORM_NAME` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '平台名称',
  `TICKET` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '凭据字符串（唯一）',
  `CLIENT_IP` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '获取票据时的IP',
  `CREATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`ID`),
  UNIQUE KEY `uk_ticket` (`TICKET`),
  KEY `idx_app_user_platform` (`APP_ID`,`APP_USER_ID`,`PLATFORM_NAME`),
  KEY `idx_create_time` (`CREATE_TIME`),
  CONSTRAINT `fk_mobile_app_ticket_app` FOREIGN KEY (`APP_ID`) REFERENCES `mobile_app` (`APP_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='App Ticket 表（移动端访问凭据，仅用于统计和审计）';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mobile_app_ticket`
--

LOCK TABLES `mobile_app_ticket` WRITE;
/*!40000 ALTER TABLE `mobile_app_ticket` DISABLE KEYS */;
INSERT INTO `mobile_app_ticket` VALUES (1,34,'661','','app_ticket_333963e315243582fd1ab9df504d704e','172.16.0.108','2026-02-27 09:34:05'),(2,33,'661','','app_ticket_4a3adfa7ea0accaadb33c952596b6641','172.16.0.120','2026-02-27 10:01:11'),(3,34,'60c6bc21cecd493ca05273f2141f4387','','app_ticket_990b741e38640869e145c3c727aad9ba','172.16.0.114','2026-02-27 13:49:50'),(4,34,'2da6099448ef445ab1c411e28c48fafe','','app_ticket_72ddb81d58df9f00d3c2be2a3e850f84','172.16.0.78','2026-02-27 15:28:27'),(5,34,'2da6099448ef445ab1c411e28c48fafe','','app_ticket_3fd8a3c74111bb539be2301ddf34663d','172.16.0.108','2026-02-28 09:33:23'),(6,34,'2da6099448ef445ab1c411e28c48fafe','','app_ticket_a0cb5b9f248fbfc85b77624ddc156052','172.16.0.114','2026-02-28 13:14:10'),(7,34,'2da6099448ef445ab1c411e28c48fafe','','app_ticket_c3a02428040dd64fc13cf5f0ec5cf72d','172.16.0.125','2026-03-02 11:26:53'),(8,34,'2da6099448ef445ab1c411e28c48fafe','','app_ticket_0f9049856a2af70ed842c241edb09662','172.16.0.78','2026-03-05 13:46:06'),(9,34,'2da6099448ef445ab1c411e28c48fafe','','app_ticket_26d8ce7379cdc976b04fe677df3f9305','172.16.0.127','2026-03-06 16:11:36'),(10,34,'76c44f9e1c874c5daabc95b6fad1c0ce','','app_ticket_ace25e786273c3e13897d5c5032cbc50','172.16.0.83','2026-03-11 10:25:10'),(11,34,'60c6bc21cecd493ca05273f2141f4387','','app_ticket_0bb9e006a93140bef5baf5f6eacb6894','172.16.0.129','2026-03-11 10:41:10'),(12,34,'8fe23791d2974b2a8c40ca2f125fbf9a','','app_ticket_65cdd7a18ae2f5bff7390689ca483c8e','172.16.0.126','2026-03-11 10:46:27'),(13,34,'2da6099448ef445ab1c411e28c48fafe','','app_ticket_33056438dc70a006fb4abb200c2f1aa5','172.16.0.119','2026-03-11 13:43:55'),(14,34,'2da6099448ef445ab1c411e28c48fafe','','app_ticket_2ad4e8e6d5e8d529d3bf7c0a12bf6e61','172.16.0.121','2026-03-18 16:19:15'),(15,34,'2da6099448ef445ab1c411e28c48fafe','','app_ticket_a6f5b1726a12235897028fe08a1de81d','172.16.0.125','2026-03-19 10:23:22'),(16,34,'2da6099448ef445ab1c411e28c48fafe','','app_ticket_cc4a2432cb291c830d664f54337db54e','172.16.0.83','2026-03-20 17:24:17'),(17,34,'2da6099448ef445ab1c411e28c48fafe','','app_ticket_fb631d3fdb8eb73b2f2dc42208807c82','172.16.0.129','2026-04-03 16:58:06');
/*!40000 ALTER TABLE `mobile_app_ticket` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mobile_app_user`
--

DROP TABLE IF EXISTS `mobile_app_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mobile_app_user` (
  `ID` int NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `APP_ID` int NOT NULL COMMENT '应用ID，对应 mobile_app.APP_ID',
  `USER_GUID` int NOT NULL COMMENT '用户ID，对应 plat_users.USER_GUID',
  `PERMISSIONS` int DEFAULT NULL COMMENT '权限位掩码，1=管理版本、2=编辑应用、4=查看，仅保留以便后续扩展',
  `REMARK` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注说明',
  `CREATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `UPDATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `CREATOR` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '添加人',
  `UPDATER` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '最后修改人',
  PRIMARY KEY (`ID`),
  UNIQUE KEY `uk_app_user` (`APP_ID`,`USER_GUID`),
  KEY `idx_user_guid` (`USER_GUID`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='移动应用授权开发者关系表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mobile_app_user`
--

LOCK TABLES `mobile_app_user` WRITE;
/*!40000 ALTER TABLE `mobile_app_user` DISABLE KEYS */;
INSERT INTO `mobile_app_user` VALUES (32,33,1,1,'应用创建者','2026-01-19 17:08:58','2026-01-19 17:08:58','admin','admin'),(38,34,11,1,'应用创建者','2026-02-27 08:50:34','2026-02-27 08:50:34','fuhh','fuhh'),(39,35,1,1,'应用创建者','2026-05-25 14:47:25','2026-05-25 14:47:25','admin','admin');
/*!40000 ALTER TABLE `mobile_app_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mobile_version`
--

DROP TABLE IF EXISTS `mobile_version`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mobile_version` (
  `ID` int NOT NULL AUTO_INCREMENT COMMENT '版本ID',
  `APP_ID` int NOT NULL COMMENT '应用ID',
  `VERSION_TYPE` int NOT NULL COMMENT '版本类型：1-正式版，2-测试版，3-开发版',
  `VERSION` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '版本号',
  `VERSION_CODE` int NOT NULL COMMENT '版本序号，用于排序，数值越大版本越新',
  `COMMENT` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '版本说明',
  `DOWNLOAD_SIZE` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '下载大小',
  `DOWNLOAD_URL` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '下载地址',
  `DOWNLOAD_SCAN_IMG` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '二维码图片',
  `CREATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `UPDATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `CREATOR` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `UPDATER` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  PRIMARY KEY (`ID`),
  UNIQUE KEY `uk_app_version_unique` (`APP_ID`,`VERSION_TYPE`,`VERSION`,`VERSION_CODE`),
  KEY `idx_app_id` (`APP_ID`),
  KEY `idx_version_type` (`VERSION_TYPE`),
  KEY `idx_version` (`VERSION`),
  KEY `idx_create_time` (`CREATE_TIME`),
  KEY `idx_version_code` (`APP_ID`,`VERSION_TYPE`,`VERSION_CODE`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='移动应用版本记录表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mobile_version`
--

LOCK TABLES `mobile_version` WRITE;
/*!40000 ALTER TABLE `mobile_version` DISABLE KEYS */;
INSERT INTO `mobile_version` VALUES (15,33,1,'1.2',3,'更新mojs2相关功能','38.14MB','http://platform-standard.oss-cn-hangzhou.aliyuncs.com/apps/packages/1768813794179_uznx10.apk',NULL,'2026-01-19 17:09:58','2026-01-19 17:09:58','admin','admin'),(16,34,1,'1.0.3',14,'移动中间平台迁移，在线更新接口变更','32.40MB','http://platform-standard.oss-cn-hangzhou.aliyuncs.com/apps/packages/1772172113985_ej12g2.apk',NULL,'2026-02-27 10:09:22','2026-02-27 14:15:59','fuhh','fuhh');
/*!40000 ALTER TABLE `mobile_version` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plat_user_log`
--

DROP TABLE IF EXISTS `plat_user_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plat_user_log` (
  `ID` bigint NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `USER_GUID` int NOT NULL COMMENT '用户唯一标识',
  `USER_NAME` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '用户名',
  `OPERATE` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '操作描述',
  `USER_IP` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '用户IP(支持IPv6)',
  `CREATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `UPDATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`ID`),
  KEY `idx_user_guid_time` (`USER_GUID`,`CREATE_TIME`),
  KEY `idx_user_name` (`USER_NAME`)
) ENGINE=InnoDB AUTO_INCREMENT=337 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户操作日志';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plat_user_log`
--

LOCK TABLES `plat_user_log` WRITE;
/*!40000 ALTER TABLE `plat_user_log` DISABLE KEYS */;
INSERT INTO `plat_user_log` VALUES (258,1,'admin','创建应用：android框架3.0','39.144.156.211','2026-01-19 17:08:58','2026-01-19 17:08:58'),(259,1,'admin','创建版本：AppID=33, Version=1.2','39.144.156.211','2026-01-19 17:09:58','2026-01-19 17:09:58'),(260,12,'shenhai','登录','36.153.31.154','2026-01-19 17:12:03','2026-01-19 17:12:03'),(261,13,'wangxn','登录','36.153.31.154','2026-01-19 17:12:34','2026-01-19 17:12:34'),(262,10,'fuyu','登录','39.144.156.211','2026-01-19 17:12:50','2026-01-19 17:12:50'),(263,12,'shenhai','登录','36.153.31.154','2026-01-19 17:14:48','2026-01-19 17:14:48'),(264,1,'admin','登录','39.144.156.211','2026-01-19 17:24:31','2026-01-19 17:24:31'),(265,11,'fuhh','登录','36.153.31.154','2026-01-20 09:59:01','2026-01-20 09:59:01'),(266,11,'fuhh','登录','36.153.31.154','2026-01-20 13:16:25','2026-01-20 13:16:25'),(267,11,'fuhh','登录','36.153.31.154','2026-01-20 14:43:12','2026-01-20 14:43:12'),(268,1,'admin','登录','36.153.31.154','2026-01-21 08:54:08','2026-01-21 08:54:08'),(269,11,'fuhh','登录','36.153.31.154','2026-01-21 09:46:10','2026-01-21 09:46:10'),(270,1,'admin','登录','39.144.153.63','2026-01-21 10:06:36','2026-01-21 10:06:36'),(271,11,'fuhh','登录','36.153.31.154','2026-01-21 10:51:28','2026-01-21 10:51:28'),(272,1,'admin','登录','39.144.156.193','2026-01-21 13:26:18','2026-01-21 13:26:18'),(273,13,'wangxn','登录','36.153.31.154','2026-01-22 08:22:55','2026-01-22 08:22:55'),(274,11,'fuhh','登录','36.153.31.154','2026-01-23 13:43:58','2026-01-23 13:43:58'),(275,11,'fuhh','登录','36.153.31.154','2026-01-23 13:46:50','2026-01-23 13:46:50'),(276,11,'fuhh','登录','36.153.31.154','2026-01-23 16:53:11','2026-01-23 16:53:11'),(277,13,'wangxn','登录','36.153.31.154','2026-01-26 08:54:44','2026-01-26 08:54:44'),(278,1,'admin','登录','223.104.148.59','2026-01-26 09:25:30','2026-01-26 09:25:30'),(279,1,'admin','登录','36.153.31.154','2026-01-27 11:12:08','2026-01-27 11:12:08'),(280,11,'fuhh','登录','36.153.31.154','2026-01-27 13:26:10','2026-01-27 13:26:10'),(281,1,'admin','登录','36.153.31.154','2026-01-27 16:06:40','2026-01-27 16:06:40'),(282,11,'fuhh','登录','36.153.31.154','2026-01-28 10:24:40','2026-01-28 10:24:40'),(283,1,'admin','登录','36.153.31.154','2026-01-29 13:41:55','2026-01-29 13:41:55'),(284,13,'wangxn','登录','36.153.31.154','2026-02-06 17:12:01','2026-02-06 17:12:01'),(285,1,'admin','登录','36.153.31.154','2026-02-09 09:14:39','2026-02-09 09:14:39'),(286,1,'admin','登录','36.153.31.154','2026-02-09 13:12:43','2026-02-09 13:12:43'),(287,1,'admin','登录','36.153.31.154','2026-02-09 15:16:47','2026-02-09 15:16:47'),(288,1,'admin','添加应用用户：AppID=33, UserID=12','36.153.31.154','2026-02-09 15:44:25','2026-02-09 15:44:25'),(289,1,'admin','删除应用用户：AppID=33, UserID=undefined','36.153.31.154','2026-02-09 15:48:08','2026-02-09 15:48:08'),(290,1,'admin','添加应用用户：AppID=33, UserID=12','36.153.31.154','2026-02-09 15:48:24','2026-02-09 15:48:24'),(291,1,'admin','添加应用用户：AppID=33, UserID=13','36.153.31.154','2026-02-09 15:48:33','2026-02-09 15:48:33'),(292,1,'admin','删除应用用户：AppID=33, UserID=undefined','36.153.31.154','2026-02-09 15:48:46','2026-02-09 15:48:46'),(293,1,'admin','添加应用用户：AppID=33, UserID=12','36.153.31.154','2026-02-09 15:50:18','2026-02-09 15:50:18'),(294,12,'shenhai','登录','36.153.31.154','2026-02-09 16:56:23','2026-02-09 16:56:23'),(295,1,'admin','登录','36.153.31.154','2026-02-09 17:00:57','2026-02-09 17:00:57'),(296,1,'admin','添加应用用户：AppID=33, UserID=13','36.153.31.154','2026-02-09 17:03:15','2026-02-09 17:03:15'),(297,1,'admin','删除应用用户：AppID=33, UserID=undefined','36.153.31.154','2026-02-09 17:03:22','2026-02-09 17:03:22'),(298,1,'admin','登录','39.144.156.197','2026-02-10 08:25:15','2026-02-10 08:25:15'),(299,1,'admin','登录','36.153.31.154','2026-02-10 08:36:49','2026-02-10 08:36:49'),(300,1,'admin','登录','36.153.31.154','2026-02-10 09:58:38','2026-02-10 09:58:38'),(301,1,'admin','登录','36.153.31.154','2026-02-10 10:51:37','2026-02-10 10:51:37'),(302,1,'admin','登录','36.153.31.154','2026-02-24 10:11:36','2026-02-24 10:11:36'),(303,1,'admin','登录','36.153.31.154','2026-02-24 10:53:55','2026-02-24 10:53:55'),(304,1,'admin','登录','36.153.31.154','2026-02-24 13:06:22','2026-02-24 13:06:22'),(305,11,'fuhh','登录','36.153.31.154','2026-02-27 08:47:54','2026-02-27 08:47:54'),(306,11,'fuhh','创建应用：als','36.153.31.154','2026-02-27 08:50:34','2026-02-27 08:50:34'),(307,1,'admin','登录','36.153.31.154','2026-02-27 10:02:52','2026-02-27 10:02:52'),(308,11,'fuhh','登录','36.153.31.154','2026-02-27 10:05:05','2026-02-27 10:05:05'),(309,11,'fuhh','创建版本：AppID=34, Version=1.0.2','36.153.31.154','2026-02-27 10:09:22','2026-02-27 10:09:22'),(310,1,'admin','登录','39.144.156.167','2026-02-27 10:11:20','2026-02-27 10:11:20'),(311,1,'admin','登录','36.153.31.154','2026-02-27 10:17:58','2026-02-27 10:17:58'),(312,11,'fuhh','登录','36.153.31.154','2026-02-27 10:19:00','2026-02-27 10:19:00'),(313,1,'admin','登录','36.153.31.154','2026-02-27 10:21:02','2026-02-27 10:21:02'),(314,11,'fuhh','登录','36.153.31.154','2026-02-27 11:27:54','2026-02-27 11:27:54'),(315,11,'fuhh','更新版本：ID=16','36.153.31.154','2026-02-27 11:28:29','2026-02-27 11:28:29'),(316,11,'fuhh','更新版本：ID=16','36.153.31.154','2026-02-27 11:28:35','2026-02-27 11:28:35'),(317,1,'admin','登录','36.153.31.154','2026-02-27 13:27:14','2026-02-27 13:27:14'),(318,1,'admin','登录','36.153.31.154','2026-02-27 13:30:38','2026-02-27 13:30:38'),(319,11,'fuhh','登录','36.153.31.154','2026-02-27 14:01:30','2026-02-27 14:01:30'),(320,11,'fuhh','登录','36.153.31.154','2026-02-27 14:02:16','2026-02-27 14:02:16'),(321,11,'fuhh','更新版本：ID=16','36.153.31.154','2026-02-27 14:15:59','2026-02-27 14:15:59'),(322,1,'admin','登录','36.153.31.154','2026-03-02 15:12:56','2026-03-02 15:12:56'),(323,1,'admin','登录','36.153.31.154','2026-03-02 15:22:57','2026-03-02 15:22:57'),(324,1,'admin','登录','36.153.31.154','2026-03-02 16:23:22','2026-03-02 16:23:22'),(325,1,'admin','登录','36.153.31.154','2026-03-03 13:24:47','2026-03-03 13:24:47'),(326,1,'admin','登录','36.153.31.154','2026-03-03 15:39:21','2026-03-03 15:39:21'),(327,1,'admin','登录','36.153.31.154','2026-03-04 09:59:23','2026-03-04 09:59:23'),(328,1,'admin','登录','36.153.31.154','2026-03-04 13:34:45','2026-03-04 13:34:45'),(329,1,'admin','登录','36.153.31.154','2026-03-05 15:14:06','2026-03-05 15:14:06'),(330,11,'fuhh','登录','36.153.31.154','2026-03-11 10:16:21','2026-03-11 10:16:21'),(331,1,'admin','登录','36.153.31.154','2026-03-12 13:31:10','2026-03-12 13:31:10'),(332,1,'admin','登录','36.153.31.154','2026-03-19 16:05:55','2026-03-19 16:05:55'),(333,1,'admin','登录','36.153.31.154','2026-03-20 11:08:06','2026-03-20 11:08:06'),(334,11,'fuhh','登录','36.153.31.154','2026-04-17 08:59:02','2026-04-17 08:59:02'),(335,1,'admin','登录','39.144.153.215','2026-05-25 14:40:35','2026-05-25 14:40:35'),(336,1,'admin','创建应用：上海质控运维','39.144.153.215','2026-05-25 14:47:25','2026-05-25 14:47:25');
/*!40000 ALTER TABLE `plat_user_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plat_users`
--

DROP TABLE IF EXISTS `plat_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plat_users` (
  `USER_GUID` int NOT NULL AUTO_INCREMENT COMMENT '用户唯一标识',
  `USER_NAME` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户名（登录名）',
  `USER_REAL_NAME` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '真实姓名',
  `USER_PWD` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户密码（加密存储）',
  `USER_LEV` int DEFAULT '1' COMMENT '用户级别：1-普通用户，2-管理员',
  `USER_EMAIL` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '用户邮箱',
  `USER_MOBILE` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '用户手机号',
  `USER_AVATAR` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '用户头像（网络链接）',
  `USER_STATUS` int DEFAULT '1' COMMENT '用户状态：1-正常，0-禁用',
  `CREATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `UPDATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`USER_GUID`),
  UNIQUE KEY `USER_NAME` (`USER_NAME`),
  KEY `idx_user_name` (`USER_NAME`),
  KEY `idx_user_email` (`USER_EMAIL`),
  KEY `idx_user_status` (`USER_STATUS`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标准平台用户表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plat_users`
--

LOCK TABLES `plat_users` WRITE;
/*!40000 ALTER TABLE `plat_users` DISABLE KEYS */;
INSERT INTO `plat_users` VALUES (1,'admin','超级管理员','$2b$10$iU9lhdNiLNNK8GiGRHeZV.854iH7L5XKobSFGXpYS7DaL7eQWoMfi',1,'admin@example.com',NULL,'http://platform-standard.oss-cn-hangzhou.aliyuncs.com/avatars/1762392388372_p2z30v.jpg',1,'2025-11-04 08:45:09','2025-11-06 01:26:28'),(10,'fuyu','付雨','$2b$10$cmTG4v0EDlOU9VisdQiMz.9k/4jkwc4B3w2D8IgeK1QTAAdRlc8ri',2,'fuyu@sinoyd.com',NULL,NULL,1,'2026-01-19 17:04:13','2026-01-19 17:04:13'),(11,'fuhh','付会会','$2b$10$Z5z4CpsobBqhV6igVd2DBOWGpQHbx6vHTXvd8abHLa9qeZfTIg.Au',2,'fuhh@sinoyd.com',NULL,NULL,1,'2026-01-19 17:04:50','2026-01-19 17:04:50'),(12,'shenhai','沈海','$2b$10$t3WVzjA7.ujdlk6yTzRHSe8vypX62bWRC7HB8kDKSZdl4hVS.WqC.',2,'shenhai@sinoyd.com',NULL,NULL,1,'2026-01-19 17:07:19','2026-01-19 17:07:19'),(13,'wangxn','汪兴楠','$2b$10$bRUE60yyeytTrgqj6Y.XNej8ukDrIEIinT/DXXN8fR9/cLHLfj2nG',2,'wangxn@sinoyd.com',NULL,NULL,1,'2026-01-19 17:07:50','2026-01-19 17:07:50');
/*!40000 ALTER TABLE `plat_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rag_config`
--

DROP TABLE IF EXISTS `rag_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rag_config` (
  `CONFIG_ID` int NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `APP_ID` int NOT NULL COMMENT '应用ID，对应 mobile_app.APP_ID',
  `MILVUS_COLLECTION` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Milvus集合名称（每个应用一个集合）',
  `VECTOR_DIMENSION` int DEFAULT '1024' COMMENT '向量维度（创建Collection时必需，如：1024）',
  `EMBEDDING_MODEL` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'qwen2.5-vl-embedding' COMMENT 'Embedding模型名称',
  `LLM_MODEL` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'qwen-turbo' COMMENT 'LLM模型名称',
  `SYSTEM_PROMPT` text COLLATE utf8mb4_unicode_ci COMMENT '系统提示词（用于 RAG 问答），NULL 时使用代码默认值',
  `USER_PROMPT_TEMPLATE` text COLLATE utf8mb4_unicode_ci COMMENT '用户提示词模板（支持 {context} 和 {question} 变量），NULL 时使用代码默认值',
  `LLM_TEMPERATURE` decimal(3,2) DEFAULT '0.70' COMMENT 'LLM 温度参数（0.0-2.0），控制输出随机性，默认0.7',
  `LLM_MAX_TOKENS` int DEFAULT '2000' COMMENT 'LLM 最大 Token 数（1-8000），控制输出长度，默认2000',
  `LLM_TOP_P` decimal(3,2) DEFAULT '0.80' COMMENT 'LLM Top P 参数（0.0-1.0），控制核采样，默认0.8',
  `TOP_K` int DEFAULT '5' COMMENT '检索Top K数量',
  `SIMILARITY_THRESHOLD` decimal(5,4) DEFAULT '0.7000' COMMENT '相似度阈值（0-1）',
  `INDEX_TYPE` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'HNSW' COMMENT '索引类型：HNSW（高质量）/IVF_FLAT（经济）/IVF_PQ（压缩）/AUTOINDEX（自动）',
  `INDEX_PARAMS` json DEFAULT NULL COMMENT '索引参数（JSON对象），如：{"M": 16, "efConstruction": 200, "nlist": 1024}。注意：HNSW用M/efConstruction，IVF用nlist，IVF_PQ用nlist/m。NULL时使用默认参数',
  `RERANK_ENABLED` tinyint DEFAULT '0' COMMENT '是否启用Rerank重排序：1-启用，0-禁用',
  `RERANK_MODEL` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Rerank模型名称（如：bge-reranker-base、bge-reranker-large等）',
  `RERANK_TOP_K` int DEFAULT '10' COMMENT 'Rerank的Top K数量（通常比检索TOP_K大，用于重排序候选）',
  `RERANK_PARAMS` json DEFAULT NULL COMMENT 'Rerank参数（JSON对象），如：{"top_n": 5, "return_documents": true}',
  `CHUNK_MAX_LENGTH` int DEFAULT '2048' COMMENT '分块最大长度（字符数），默认2048',
  `CHUNK_OVERLAP` int DEFAULT '100' COMMENT '分块重叠长度（字符数），默认100',
  `CHUNK_SEPARATORS` json DEFAULT NULL COMMENT '分隔符列表（JSON数组），如：["\\n\\n\\n", "\\n\\n", "\\n", "。", "！", "？", ". ", "! ", "? ", " ", ""]。NULL时使用默认分隔符',
  `COMMON_QUESTIONS` json DEFAULT NULL COMMENT '常用问题列表（JSON数组），格式：[{"question": "问题内容", "order": 1}, ...]，最多3个。question必传，order选填（不传时使用数组索引），NULL时使用系统默认',
  `STATUS` int DEFAULT '1' COMMENT '配置状态：1-启用，0-禁用',
  `REMARK` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注说明',
  `CREATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `UPDATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `CREATOR` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `UPDATER` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  PRIMARY KEY (`CONFIG_ID`),
  UNIQUE KEY `uk_app_id` (`APP_ID`),
  KEY `idx_status` (`STATUS`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RAG配置表（按APP_ID维度）';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rag_config`
--

LOCK TABLES `rag_config` WRITE;
/*!40000 ALTER TABLE `rag_config` DISABLE KEYS */;
INSERT INTO `rag_config` VALUES (10,33,'rag_app_33',1024,'text-embedding-v4','qwen-plus','你是一个专业的智能客服助手，专门为用户提供关于\"android框架3.0\"应用的业务信息和操作指南。\n\n你的职责：\n1. 基于提供的文档内容，尽量回答用户关于\"android框架3.0\"的功能、使用方法、操作步骤等问题；即使文档只部分相关，也要根据已有信息给出尽可能有帮助的回答，而不要轻易判断为“没有相关内容”\n2. 回答要简洁、清晰、有条理，优先使用列表、步骤等方式呈现\n3. 如果文档中有具体的操作步骤，请按照文档中的顺序和内容详细说明\n4. 当文档内容与用户问题存在部分关联时，请主动引用相关段落，用你自己的话进行总结、推理和补充说明，帮助用户形成完整的理解；在推理时要以文档内容为基础，避免脱离文档进行无根据信息的发挥\n5. 只有在文档内容明显与用户问题无关、或者文档中完全没有涉及相关主题时，才可以说明\"文档中未找到相关信息\"，并补充说明是因为文档中没有相关描述；在这种情况下，可以基于通用常识给出简要建议，但必须明确区分“文档依据”和“通用建议”，不要把猜测说成是文档中的结论\n6. 对于技术性问题，请引用文档中的具体内容，确保准确性\n7. 回答要友好、专业，使用通俗易懂的语言\n\n注意事项：\n- 只回答与\"android框架3.0\"相关的问题\n- 如果用户问题与文档内容无关，请礼貌地引导用户提出相关问题\n- 如果文档内容不完整或存在矛盾，请如实告知用户\n- **重要：如果文档中包含图片（Markdown 格式的 `![alt](url)` 或 HTML 的 `<img>` 标签），请在回答中完整保留这些图片引用，不要用文字描述替代图片**\n\n以下是关于\"android框架3.0\"的相关文档内容：\n\n{context}\n\n用户问题：{question}\n\n请基于上述文档内容，准确、详细地回答用户的问题；在文档部分相关时，优先利用已有内容进行推理和补充说明，仅在文档完全没有涉及相关主题时才说明\"文档中未找到相关信息\"。\n\n**特别提醒：如果文档中包含图片引用（如 `![描述](图片URL)`），请在你的回答中完整保留这些图片的 Markdown 格式，以便用户能够看到相关图片。**','请回答用户的问题。',0.70,2000,0.80,5,0.4000,'HNSW',NULL,0,NULL,10,NULL,2048,100,'[\"\\n\\n\\n\", \"\\n\\n\", \"\\n\", \"。\", \"！\", \"？\", \". \", \"! \", \"? \", \" \", \"\"]',NULL,1,NULL,'2026-01-19 17:08:58','2026-01-19 17:08:58','admin','admin'),(11,34,'rag_app_34',1024,'text-embedding-v4','qwen-plus','你是一个专业的智能客服助手，专门为用户提供关于\"als\"应用的业务信息和操作指南。\n\n你的职责：\n1. 基于提供的文档内容，尽量回答用户关于\"als\"的功能、使用方法、操作步骤等问题；即使文档只部分相关，也要根据已有信息给出尽可能有帮助的回答，而不要轻易判断为“没有相关内容”\n2. 回答要简洁、清晰、有条理，优先使用列表、步骤等方式呈现\n3. 如果文档中有具体的操作步骤，请按照文档中的顺序和内容详细说明\n4. 当文档内容与用户问题存在部分关联时，请主动引用相关段落，用你自己的话进行总结、推理和补充说明，帮助用户形成完整的理解；在推理时要以文档内容为基础，避免脱离文档进行无根据信息的发挥\n5. 只有在文档内容明显与用户问题无关、或者文档中完全没有涉及相关主题时，才可以说明\"文档中未找到相关信息\"，并补充说明是因为文档中没有相关描述；在这种情况下，可以基于通用常识给出简要建议，但必须明确区分“文档依据”和“通用建议”，不要把猜测说成是文档中的结论\n6. 对于技术性问题，请引用文档中的具体内容，确保准确性\n7. 回答要友好、专业，使用通俗易懂的语言\n\n注意事项：\n- 只回答与\"als\"相关的问题\n- 如果用户问题与文档内容无关，请礼貌地引导用户提出相关问题\n- 如果文档内容不完整或存在矛盾，请如实告知用户\n- **重要：如果文档中包含图片（Markdown 格式的 `![alt](url)` 或 HTML 的 `<img>` 标签），请在回答中完整保留这些图片引用，不要用文字描述替代图片**\n\n以下是关于\"als\"的相关文档内容：\n\n{context}\n\n用户问题：{question}\n\n请基于上述文档内容，准确、详细地回答用户的问题；在文档部分相关时，优先利用已有内容进行推理和补充说明，仅在文档完全没有涉及相关主题时才说明\"文档中未找到相关信息\"。\n\n**特别提醒：如果文档中包含图片引用（如 `![描述](图片URL)`），请在你的回答中完整保留这些图片的 Markdown 格式，以便用户能够看到相关图片。**','请回答用户的问题。',0.70,2000,0.80,5,0.4000,'HNSW',NULL,0,NULL,10,NULL,2048,100,'[\"\\n\\n\\n\", \"\\n\\n\", \"\\n\", \"。\", \"！\", \"？\", \". \", \"! \", \"? \", \" \", \"\"]',NULL,1,NULL,'2026-02-27 08:50:34','2026-02-27 08:50:34','fuhh','fuhh'),(12,35,'rag_app_35',1024,'text-embedding-v4','qwen-plus','你是一个专业的智能客服助手，专门为用户提供关于\"上海质控运维\"应用的业务信息和操作指南。\n\n你的职责：\n1. 基于提供的文档内容，尽量回答用户关于\"上海质控运维\"的功能、使用方法、操作步骤等问题；即使文档只部分相关，也要根据已有信息给出尽可能有帮助的回答，而不要轻易判断为“没有相关内容”\n2. 回答要简洁、清晰、有条理，优先使用列表、步骤等方式呈现\n3. 如果文档中有具体的操作步骤，请按照文档中的顺序和内容详细说明\n4. 当文档内容与用户问题存在部分关联时，请主动引用相关段落，用你自己的话进行总结、推理和补充说明，帮助用户形成完整的理解；在推理时要以文档内容为基础，避免脱离文档进行无根据信息的发挥\n5. 只有在文档内容明显与用户问题无关、或者文档中完全没有涉及相关主题时，才可以说明\"文档中未找到相关信息\"，并补充说明是因为文档中没有相关描述；在这种情况下，可以基于通用常识给出简要建议，但必须明确区分“文档依据”和“通用建议”，不要把猜测说成是文档中的结论\n6. 对于技术性问题，请引用文档中的具体内容，确保准确性\n7. 回答要友好、专业，使用通俗易懂的语言\n\n注意事项：\n- 只回答与\"上海质控运维\"相关的问题\n- 如果用户问题与文档内容无关，请礼貌地引导用户提出相关问题\n- 如果文档内容不完整或存在矛盾，请如实告知用户\n- **重要：如果文档中包含图片（Markdown 格式的 `![alt](url)` 或 HTML 的 `<img>` 标签），请在回答中完整保留这些图片引用，不要用文字描述替代图片**\n\n以下是关于\"上海质控运维\"的相关文档内容：\n\n{context}\n\n用户问题：{question}\n\n请基于上述文档内容，准确、详细地回答用户的问题；在文档部分相关时，优先利用已有内容进行推理和补充说明，仅在文档完全没有涉及相关主题时才说明\"文档中未找到相关信息\"。\n\n**特别提醒：如果文档中包含图片引用（如 `![描述](图片URL)`），请在你的回答中完整保留这些图片的 Markdown 格式，以便用户能够看到相关图片。**','请回答用户的问题。',0.70,2000,0.80,5,0.4000,'HNSW',NULL,0,NULL,10,NULL,2048,100,'[\"\\n\\n\\n\", \"\\n\\n\", \"\\n\", \"。\", \"！\", \"？\", \". \", \"! \", \"? \", \" \", \"\"]',NULL,1,NULL,'2026-05-25 14:47:25','2026-05-25 14:47:25','admin','admin');
/*!40000 ALTER TABLE `rag_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rag_document`
--

DROP TABLE IF EXISTS `rag_document`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rag_document` (
  `DOC_ID` int NOT NULL AUTO_INCREMENT COMMENT '文档ID',
  `APP_ID` int NOT NULL COMMENT '应用ID，对应 mobile_app.APP_ID',
  `DOC_NAME` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '文档名称',
  `DOC_TYPE` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '文档类型：pdf/docx/doc/md/txt等',
  `DOC_SIZE` bigint DEFAULT '0' COMMENT '文档大小（字节）',
  `FILE_PATH` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '文件存储路径（OSS或本地）',
  `FILE_URL` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '文件访问URL',
  `STATUS` int DEFAULT '0' COMMENT '处理状态：0-待处理，1-处理中，2-已完成，3-失败',
  `MILVUS_COLLECTION` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Milvus集合名称（每个应用一个集合）',
  `CHUNK_COUNT` int DEFAULT '0' COMMENT '分块数量',
  `VECTOR_COUNT` int DEFAULT '0' COMMENT '向量数量',
  `ERROR_MSG` text COLLATE utf8mb4_unicode_ci COMMENT '错误信息（处理失败时）',
  `UPLOADER_ID` int NOT NULL COMMENT '上传者ID，对应 plat_users.USER_GUID',
  `UPLOADER_NAME` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '上传者名称',
  `CREATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `UPDATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`DOC_ID`),
  KEY `idx_app_id` (`APP_ID`),
  KEY `idx_status` (`STATUS`),
  KEY `idx_uploader` (`UPLOADER_ID`),
  KEY `idx_create_time` (`CREATE_TIME`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RAG应用文档主表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rag_document`
--

LOCK TABLES `rag_document` WRITE;
/*!40000 ALTER TABLE `rag_document` DISABLE KEYS */;
/*!40000 ALTER TABLE `rag_document` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rag_document_chunk`
--

DROP TABLE IF EXISTS `rag_document_chunk`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rag_document_chunk` (
  `CHUNK_ID` bigint NOT NULL AUTO_INCREMENT COMMENT '分块ID',
  `DOC_ID` int NOT NULL COMMENT '文档ID，对应 rag_document.DOC_ID',
  `APP_ID` int NOT NULL COMMENT '应用ID，对应 mobile_app.APP_ID',
  `CHUNK_INDEX` int NOT NULL COMMENT '分块序号（从0开始）',
  `CHUNK_TEXT` text COLLATE utf8mb4_unicode_ci COMMENT '分块文本内容（用于预览）',
  `CHUNK_SIZE` int DEFAULT '0' COMMENT '分块大小（字符数）',
  `MILVUS_ID` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Milvus中的向量ID（用于删除和更新）',
  `METADATA` json DEFAULT NULL COMMENT '元数据JSON（存储页码、章节等信息）',
  `CREATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`CHUNK_ID`),
  UNIQUE KEY `uk_doc_chunk` (`DOC_ID`,`CHUNK_INDEX`),
  KEY `idx_app_id` (`APP_ID`),
  KEY `idx_doc_id` (`DOC_ID`),
  KEY `idx_milvus_id` (`MILVUS_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RAG应用文档分块表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rag_document_chunk`
--

LOCK TABLES `rag_document_chunk` WRITE;
/*!40000 ALTER TABLE `rag_document_chunk` DISABLE KEYS */;
/*!40000 ALTER TABLE `rag_document_chunk` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rag_session`
--

DROP TABLE IF EXISTS `rag_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rag_session` (
  `SESSION_ID` bigint NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  `APP_ID` int NOT NULL COMMENT '应用ID，对应 mobile_app.APP_ID',
  `USER_ID` int NOT NULL COMMENT '用户ID，对应 plat_users.USER_GUID',
  `USER_NAME` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '用户名称',
  `SESSION_TITLE` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '会话标题（首条问题摘要或用户自定义）',
  `STATUS` tinyint DEFAULT '0' COMMENT '会话状态：0-正常，1-归档/结束',
  `EXTRA` json DEFAULT NULL COMMENT '会话扩展信息（JSON，如当时的模型配置等）',
  `CREATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `UPDATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`SESSION_ID`),
  KEY `idx_app_id` (`APP_ID`),
  KEY `idx_user` (`USER_ID`),
  KEY `idx_status` (`STATUS`),
  KEY `idx_create_time` (`CREATE_TIME`),
  CONSTRAINT `fk_rag_session_app` FOREIGN KEY (`APP_ID`) REFERENCES `mobile_app` (`APP_ID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rag_session_user` FOREIGN KEY (`USER_ID`) REFERENCES `plat_users` (`USER_GUID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RAG 会话表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rag_session`
--

LOCK TABLES `rag_session` WRITE;
/*!40000 ALTER TABLE `rag_session` DISABLE KEYS */;
INSERT INTO `rag_session` VALUES (34,33,12,'shenhai','测测',0,NULL,'2026-01-19 17:13:19','2026-01-19 17:13:42'),(36,33,11,'fuhh','kotlin',0,NULL,'2026-01-20 13:16:58','2026-01-20 13:17:27'),(41,33,1,'admin','测测',0,NULL,'2026-02-24 13:09:50','2026-03-20 11:08:23'),(42,33,1,'admin','kotlin简介',0,NULL,'2026-02-24 13:11:52','2026-02-24 13:12:10'),(43,35,1,'admin','怎么部署',0,NULL,'2026-05-25 15:27:03','2026-05-25 15:27:45');
/*!40000 ALTER TABLE `rag_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rag_session_message`
--

DROP TABLE IF EXISTS `rag_session_message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rag_session_message` (
  `MESSAGE_ID` bigint NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `SESSION_ID` bigint NOT NULL COMMENT '会话ID，对应 rag_session.SESSION_ID',
  `APP_ID` int NOT NULL COMMENT '应用ID，对应 mobile_app.APP_ID（冗余）',
  `USER_ID` int DEFAULT NULL COMMENT '用户ID：user消息为用户ID，assistant消息可为NULL或系统ID',
  `ROLE` enum('user','assistant') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色：user/assistant',
  `CONTENT` longtext COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '消息内容（用户问题或助手回答）',
  `SOURCE_DOCS` json DEFAULT NULL COMMENT '检索到的文档列表（仅assistant消息使用）',
  `TOKENS_USED` int DEFAULT '0' COMMENT '本次回复使用的Token数（assistant）',
  `RESPONSE_TIME` int DEFAULT '0' COMMENT '本次回复耗时（毫秒，assistant）',
  `STREAMED` tinyint DEFAULT '0' COMMENT '是否通过流式生成：0-否，1-是',
  `CREATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`MESSAGE_ID`),
  KEY `idx_session` (`SESSION_ID`),
  KEY `idx_app_id` (`APP_ID`),
  KEY `idx_user` (`USER_ID`),
  KEY `idx_role` (`ROLE`),
  KEY `idx_create_time` (`CREATE_TIME`),
  CONSTRAINT `fk_rag_session_message_app` FOREIGN KEY (`APP_ID`) REFERENCES `mobile_app` (`APP_ID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rag_session_message_session` FOREIGN KEY (`SESSION_ID`) REFERENCES `rag_session` (`SESSION_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=209 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RAG 会话消息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rag_session_message`
--

LOCK TABLES `rag_session_message` WRITE;
/*!40000 ALTER TABLE `rag_session_message` DISABLE KEYS */;
INSERT INTO `rag_session_message` VALUES (183,34,33,12,'user','测测',NULL,0,0,0,'2026-01-19 17:13:42'),(184,34,33,NULL,'assistant','您好，欢迎使用智能客服助手！?  \n您说的“测测”是指想测试一下功能，还是有具体的问题需要帮助呢？  \n如果有任何关于“android框架3.0”的问题，我很乐意为您解答～  \n\n（目前知识库中暂无相关业务信息，但我会尽力提供友好协助！）','[]',0,3726,1,'2026-01-19 17:13:42'),(189,36,33,11,'user','kotlin',NULL,0,0,0,'2026-01-20 13:17:27'),(190,36,33,NULL,'assistant','您提到“kotlin”，以下是基于文档中与 **Kotlin** 相关的信息整理的说明：\n\n### 关于 Kotlin 在 \"android框架3.0\" 中的应用\n\n本项目是一个 **Android 原生 Kotlin 框架项目**，全面使用 Kotlin 语言进行开发，具备现代 Android 开发的最佳实践。以下是具体信息：\n\n#### ✅ 技术栈支持\n- **语言**: 全项目采用 **Kotlin** 作为主要开发语言\n- **KTX 扩展**: 使用 `core-ktx` 等 AndroidX 的 Kotlin 扩展库，提升代码简洁性和可读性\n\n#### ✅ 工程配置（来自 `build.gradle.kts`）\n```kotlin\n// 启用 Kotlin 插件\nplugins {\n    id(\"com.android.application\")\n    kotlin(\"android\")\n}\n\n// 使用 Kotlin 的 DSL 风格构建脚本（.kts）\ncompileSdk = 34\ndefaultConfig {\n    applicationId = \"com.example.tt\"\n    minSdk = 23\n    targetSdk = 34\n}\n```\n\n> 注：`.kts` 文件本身就是 Kotlin 脚本，说明整个构建系统也基于 Kotlin 实现。\n\n#### ✅ 主要功能模块中的 Kotlin 特性应用\n1. **基类封装**\n   - 使用 Kotlin 的 `open class`、`abstract class` 实现 `BaseActivity` / `BaseFragment`\n   - 利用 `by lazy`、扩展函数等特性简化 UI 初始化和工具调用\n\n2. **ViewBinding + Kotlin**\n   - 启用了 `viewBinding`，结合 Kotlin 空安全（null safety）机制，避免空指针异常\n   - 示例：\n     ```kotlin\n     class MainActivity : BaseActivity() {\n         private lateinit var binding: ActivityMainBinding\n         override fun onCreate(savedInstanceState: Bundle?) {\n             binding = ActivityMainBinding.inflate(layoutInflater)\n             setContentView(binding.root)\n         }\n     }\n     ```\n\n3. **网络层封装（FrmHttpController）**\n   - 使用 Kotlin 协程（Coroutine）或高阶函数封装异步请求（虽未明说，但符合现代 Kotlin 实践）\n\n4. **工具类统一封装**\n   - 权限工具、JSON 工具、AES 加解密工具等均以 Kotlin 单例（`object`）或顶层函数形式提供\n\n#### ✅ 其他 Kotlin 生态集成\n- 使用 `libs.versions.toml` 管理依赖版本（新 Gradle 功能，推荐用于 Kotlin 多模块项目）\n- 已启用 Compose（Jetpack Compose），这是 Kotlin 优先的声明式 UI 框架：\n  ```kotlin\n  // build.gradle.kts 中启用 compose\n  buildFeatures {\n      compose = true\n  }\n  ```\n\n---\n\n### 总结：Kotlin 的角色\n| 方面 | 说明 |\n|------|------|\n| **核心语言** | 整个项目完全基于 Kotlin 编写 |\n| **语法优势** | 利用空安全、扩展函数、委托属性等特性提升开发效率 |\n| **架构支撑** | 支持现代化 Android 架构组件（如 Lifecycle、Navigation）的 Kotlin 风格调用 |\n| **未来扩展** | 已准备向 Jetpack Compose 迁移（当前主体仍为 ViewBinding） |\n\n如果您有关于 **如何用 Kotlin 写某个功能模块**（如扫码、H5 容器通信、网络请求等）的具体问题，请进一步提问，我可以提供示例代码或调用方式。\n\n--- \n\n目前文档中未包含 Kotlin 示例代码图片，因此无图片引用插入。  \n如有其他具体需求（如“Kotlin 如何调用 JSBridge”），欢迎继续提问！','[{\"text\": \"### 项目概览  \\n\\n本项目是一个 Android 原生 Kotlin 框架项目，对常见移动端业务能力进行了统一封装，开箱即用、便于二次开发。整体特点：  \\n\\n- 技术栈  \\n\\n    - 语言: Kotlin  \\n\\n    - 框架组件: AndroidX、Navigation、ViewBinding、（已开启 Compose 能力但当前页面主体仍为 ViewBinding）  \\n\\n    - 网络: OkHttp + 自封装 `FrmHttpController`  \\n\\n    - 图片与附件: Glide / ZoomImage / Matisse 附件选择  \\n\\n    - 扫码: Google MLKit 条码识别 + CameraX  \\n\\n    - 定位: 高德地图定位 SDK（`AMapLocationClient`）  \\n\\n    - Web 容器: 自定义 H5 容器 + MoJs 1.0 / MoJs 2.0 双 JSBridge 方案  \\n\\n    - 本地存储: 自封装 DB Service（基于 `FrmDBOpenHelper`）  \\n\\n- 主要功能模块  \\n\\n    - 统一基类 UI 框架：`BaseActivity` / `BaseFragment` + 自定义导航栏 `BaseNavigationBar`，支持沉浸式状态栏、统一 Loading、统一动画。  \\n\\n    - H5 容器与 JSBridge：`FrmWebLoader` + `FrmMojsFragment` + `JSBridge` + `JavascriptBridgeInterface`，支持 H5 与原生双向通信、文件选择、页面回调等。  \\n\\n    - 网络层封装：`FrmHttpController` + `OKHttpUtil` + 下载工具类，提供统一 GET/POST/PUT/DELETE 及文件上传下载能力。  \\n\\n    - 扫码与相册：`ScanningActivity` 及一系列扫描视图工具，集成 MLKit 与 CameraX。  \\n\\n    - 定位能力：在 `FrmApplication` 中初始化高德隐私策略，Manifest 中声明 key 与服务。  \\n\\n    - 统一工具类：权限工具、JSON 工具、AES/加解密工具、Toast、Loading、Window 悬浮窗等。  \\n\\n### 工程结构  \\n\\n- 顶层工程  \\n\\n    - `settings.gradle.kts`：包含 `app` 模块。  \\n\\n    - `build.gradle.kts`：统一插件版本声明，使用 `libs.versions.toml` 管理依赖版本。  \\n\\n- app 模块  \\n\\n    - `app/build.gradle.kts`  \\n\\n        - `applicationId = \\\"com.example.tt\\\"`  \\n\\n        - `compileSdk = 34`, `minSdk = 23`, `targetSdk = 34`  \\n\\n        - 启用 `viewBinding`, `buildConfig`, `compose`  \\n\\n        - 集成依赖：  \\n\\n            - AndroidX: core-ktx, appcompat, material, constraintlayout, lifecycle, navigation  \\n\\n            - 图片: `glide`, `glide.compose`, `zoom-image-glide`, `zoomable-image-glide`  \\n\\n            - 附件选择: `matisse`  \\n\\n            - 网络: `okhttp`, `okio`, `gson`  \\n\\n            - 扫码: `mlkit.barcode.scanning` + CameraX 系列  \\n\\n            - 高德定位: `location`（AMap SDK）  \\n\\n    - `app/src/main/AndroidManifest.xml`  \\n\\n        - `application`:  \\n\\n            - `android:name=\\\".frame.application.FrmApplication\\\"`  \\n\\n            - `android:theme=\\\"@style/Theme.KotlinTest\\\"`  \\n\\n            - `android:requestLegacyExternalStorage=\\\"true\\\"`\", \"score\": 0.4479406177997589, \"metadata\": {}}]',0,15673,1,'2026-01-20 13:17:27'),(199,41,33,1,'user','kotlin简介',NULL,0,0,0,'2026-02-24 13:10:06'),(200,41,33,NULL,'assistant','您好！感谢您的提问 ?\n\nKotlin 是一种现代、简洁、安全且与 Java 完全互操作的静态类型编程语言，由 JetBrains 公司于 2011 年推出，现已成为 Android 官方推荐的首选开发语言（自 2017 年 Google I/O 大会正式宣布起）。\n\n它具有许多优秀特性，例如：\n✅ 空安全机制（显著减少 NullPointerException）  \n✅ 简洁语法（如数据类、扩展函数、协程等）  \n✅ 无缝兼容 Java（可直接调用 Java 库，也可与 Java 混合编译）  \n✅ 支持多平台开发（Android、iOS、Web、后端等）\n\n不过需要说明的是：您提到的「android框架3.0」——当前知识库中**没有关于该名称的具体定义、版本说明或官方文档信息**。Android 官方并无公开命名为“Android 框架 3.0”的标准版本（Android 系统版本以代号如 Tiramisu、UpsideDownCake 等命名，API 级别如 API 33、34 等标识；框架层面通常指 AndroidX、Jetpack 或系统 SDK 架构演进）。若您指的是某款特定应用、内部平台或第三方框架，请提供更多上下文，我将尽力协助。\n\n如需了解 Kotlin 在 Android 开发中的实际使用（如项目配置、协程入门、与 Jetpack 组件集成等），我也很乐意为您简要介绍 ?  \n欢迎随时继续提问！','[]',0,8613,1,'2026-02-24 13:10:06'),(201,42,33,1,'user','kotlin简介',NULL,0,0,0,'2026-02-24 13:12:10'),(202,42,33,NULL,'assistant','您好！感谢您的提问 ?\n\nKotlin 是一种现代、简洁、安全的静态类型编程语言，由 JetBrains 公司开发，最初于 2011 年发布，2017 年被 Google 宣布为 Android 开发的**官方首选语言**（与 Java 并列，后逐步成为推荐主力）。它运行在 JVM 上，也可编译为 JavaScript 或原生代码（通过 Kotlin/Native），具备出色的互操作性——Kotlin 代码可直接调用 Java 库，反之亦然。\n\nKotlin 的主要特点包括：\n✅ 空安全机制（显著减少 NullPointerException）  \n✅ 简洁语法（如数据类、扩展函数、高阶函数、协程等）  \n✅ 无样板代码（如 `val`/`var` 声明、类型推断、智能类型转换）  \n✅ 优秀的 IDE 支持（尤其在 Android Studio 中）\n\n不过需要说明的是：您提到的「android框架3.0」并非 Android 官方发布的版本名称（Android 系统版本号如 12、13、14；AndroidX 库或 Jetpack 组件有各自版本，但并无统一称为“Android 框架 3.0”的标准术语）。当前知识库中**没有关于“android框架3.0”及其与 Kotlin 关联的具体业务信息或定制化说明**。\n\n如果您是想了解 Kotlin 在 Android 开发中的实际使用（如项目配置、协程实践、Jetpack Compose 集成等），或者有关某个具体工具/框架的版本问题，欢迎进一步说明，我会尽力提供通用、准确的技术指引 ?','[]',0,9305,1,'2026-02-24 13:12:10'),(203,42,33,1,'user','kotlin简介',NULL,0,0,0,'2026-02-24 13:13:36'),(204,42,33,NULL,'assistant','您好！感谢您的提问 ?\n\nKotlin 是一种现代、简洁、安全且与 Java 完全互操作的静态类型编程语言，由 JetBrains 公司于 2011 年推出，现已成为 Android 官方推荐的首选开发语言（自 2017 年 Google I/O 大会正式宣布起）。\n\n它具有许多优秀特性，例如：\n✅ 空安全机制（显著减少 NullPointerException）  \n✅ 简洁语法（如数据类、扩展函数、高阶函数、协程等）  \n✅ 无缝兼容 Java（可直接调用 Java 库，也支持混合代码工程）  \n✅ 支持多平台开发（Android、iOS、Web、后端、桌面等）\n\n不过需要说明的是：您提到的「android框架3.0」并非 Android 官方发布的版本名称（Android 系统版本号如 Android 14、Android 13 等；而 Jetpack 架构组件或 Compose 等框架有各自独立的版本演进）。当前知识库中**没有关于“android框架3.0”这一特定命名的业务信息或技术定义**，因此无法确认其具体所指。\n\n如果您是想了解 Kotlin 在 Android 开发中的实际应用（如如何配置、协程使用、与 Jetpack 组件集成等），我很乐意为您提供通用性指导或学习建议 ?  \n也欢迎您补充更多背景，我会尽力协助！','[]',0,8019,1,'2026-02-24 13:13:36'),(205,41,33,1,'user','测测',NULL,0,0,0,'2026-03-20 11:08:23'),(206,41,33,NULL,'assistant','您好！? 感谢您的问候～  \n“测测”听起来像是一个轻松有趣的互动尝试，不过关于“android框架3.0”应用中是否有名为“测测”的功能模块、测试工具或特定服务，**当前知识库没有相关信息**。\n\n如果您是想了解：\n- 如何启动/使用某项测试功能？\n- 应用是否支持性能检测、兼容性测试或用户行为分析？\n- 或者需要具体的操作步骤、界面指引、权限设置等？\n\n欢迎随时告诉我更详细的需求，我会尽力为您提供清晰、准确的帮助！ ?','[]',0,4106,1,'2026-03-20 11:08:23'),(207,43,35,1,'user','怎么部署',NULL,0,0,0,'2026-05-25 15:27:45'),(208,43,35,NULL,'assistant','根据文档内容，以下是 **“上海质控运维”H5 应用的完整部署指南**，涵盖静态资源发布、网关配置、HTTPS 与路径适配等关键步骤，严格依据您提供的操作手册与部署说明（文档 [2] 和 [3]）整理：\n\n---\n\n### ✅ 一、部署前准备\n- ✅ 构建产物已生成：执行 `npm run build` 后，产出目录为 `dist/`（含 `index.html` + `static/` 等全部静态文件）  \n- ✅ 确认部署环境：\n  - Web 服务器（如 Nginx / Apache）或原生 App 的 H5 资源目录（见 `[1]` 中 `android/` 参考）  \n  - 生产后端地址已明确（默认 `https://219.233.250.37:42800`，见文档 [2] 3.2 和 4.2）\n\n---\n\n### ? 二、标准部署步骤（推荐 Nginx）\n\n#### 步骤 1：发布静态资源  \n将整个 `dist/` 目录内容（含 `index.html`, `static/`, `favicon.ico` 等）  \n→ 部署至 Web 服务器根目录（如 `/var/www/html/shzhikongh5/`）或子路径（如 `/h5/`）  \n\n> ⚠️ 注意：因使用 **Hash 路由**（`#/home`），服务器**无需配置 History 模式回退规则**；但需确保：  \n> - 任意路径（如 `/h5/#/sign`）访问时，能正确加载 `index.html`（即：所有请求 fallback 到 `index.html`）  \n> - 若部署在子路径（如 `https://domain.com/h5/`），请确认 `vue.config.js` 中 `publicPath: \'./\'` 与实际路径一致（文档 [2] 4.1.3）\n\n#### 步骤 2：配置反向代理（生产必配）  \nH5 所有接口以 `/api` 开头（如 `/api/gch/task/list`），**必须通过 Nginx / 网关转发至真实后端**，不可直连。  \n\n✅ 示例 Nginx 配置（`/etc/nginx/conf.d/shzhikongh5.conf`）：\n```nginx\nlocation /api/ {\n    proxy_pass https://219.233.250.37:42800/api/;\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_ssl_verify off;   # 若后端为自签名证书（仅测试环境启用）\n}\n```\n\n> ? 关键说明（源自文档 [2] 4.2）：\n> - 开发时的 `vue.config.js` 代理（`devServer.proxy`）**仅本地生效，生产环境不读取**  \n> - 实际网关前缀须与代码中 `src/request/request.js` 的 `publicAddress` 严格一致，例如：  \n>   - 地表水质控网关：`/api/gch`  \n>   - SSO 单点登录网关：`/api/sinoyd-sso-auth`  \n> - 切换测试/正式环境？→ 修改 `request.js` 中对应 `publicAddress` 的注释块，**重新 build 并部署 `dist/`**\n\n#### 步骤 3：确保 HTTPS 与混合内容安全  \n- ✅ 页面必须通过 **HTTPS 访问**（高德地图 JS、文件上传接口均为 HTTPS）  \n- ❌ 禁止 HTTP 页面加载 HTTPS 资源（混合内容），否则 WebView 可能拦截  \n- ✅ 文件上传/预览地址示例：`https://219.233.250.37:42800/files`（见文档 [2] 4.3），需确保该地址可被公网或内网访问且证书有效  \n\n#### 步骤 4：高德地图 Key 配置（如需自定义）  \n- 编辑 `public/index.html`，修改以下全局变量：  \n  ```html\n  <script>\n    window._AMapSecurityConfig = {\n      securityJsCode: \'您的高德安全密钥\' // 文档 [2] 4.4 明确指出此处配置\n    };\n  </script>\n  ```\n> ? 提示：若仅调试地图显示，可暂用测试 Key；正式上线需申请企业版 Key 并绑定域名/AppKey\n\n---\n\n### ? 三、嵌入原生 App（WebView）特别说明  \n- ✅ 必须集成 `public/static/mojs2.js`（原生桥脚本），用于调用定位、拍照、扫码等能力（见 `[1]` 目录结构）  \n- ✅ 定位功能依赖原生壳：**浏览器中无法使用签到/定位**（文档 [3] 2.3 明确说明）  \n- ✅ 发布前请关闭模拟定位（详见文档 [3] 第6节「原生壳与定位」，虽未展开，但强调“须关闭模拟定位”）\n\n---\n\n### ? 四、可选：多模块部署支持  \n若需同时支持「地表水」「防人为干扰巡查」等模块：  \n- 在 `src/views/choose/moduleChoose.vue` 中取消对应模块的注释（文档 [3] 2.9）  \n- 确保路由配置（`router/`）与底部 Tab 逻辑同步更新  \n\n---\n\n### ❓常见问题速查（来自文档 [3] 第8节隐含要点）  \n| 问题 | 原因与解法 |\n|------|-------------|\n| **页面白屏 / 路由跳转失败** | 检查 `dist/` 是否完整发布；确认 `index.html` 能被直接访问；验证 `publicPath` 与部署路径是否匹配 |\n| **接口 404 / 502** | ❗首要检查 Nginx `/api/` 代理是否生效；确认后端服务 `219.233.250.37:42800` 可达且 `/api/xxx` 路径存在 |\n| **地图不显示 / 定位失败** | 检查 `index.html` 中高德 Key 是否正确；确认 HTTPS 已启用；App 内 WebView 是否授予定位权限 |\n| **签到按钮灰显 / 无法提交** | 检查是否在原生 App 中打开（非浏览器）；确认 `mojs2.js` 加载成功；查看控制台是否有 `mojs2` API 调用报错 |\n\n---\n\n如需进一步协助（例如：Nginx 完整配置模板、`request.js` 环境切换示例、或 `mojs2.js` 原生桥调用说明），欢迎随时提出！我们可基于文档细节为您精准提供。','[{\"text\": \"### 附录：主要目录结构  \\n\\n```\\nshzhikongh5/\\n├── public/\\n│   ├── index.html          # 入口、mojs2、高德\\n│   └── static/mojs2.js     # 原生桥\\n├── src/\\n│   ├── request/            # 接口与网关配置\\n│   ├── router/             # 路由（Hash）\\n│   ├── views/\\n│   │   ├── login/          # 登录\\n│   │   ├── choose/         # 模块选择\\n│   │   └── module/         # 业务页面\\n│   │       ├── signPage/   # 签到\\n│   │       ├── operationPage/  # 运维、动态表单\\n│   │       ├── queryPage/  # 数据查询\\n│   │       └── ...\\n│   └── main.js\\n├── vue.config.js           # 构建、开发代理\\n├── dist/                   # 构建产物（部署用）\\n└── android/                # 原生工程参考（可选）\\n\\n```  \\n\\n### 文档修订  \\n\\n| 日期|说明|\\n| ---|---|\\n| 2026-05-20|初版：操作手册 + 部署与配置注意事项|  \\n\\n如有环境专属账号、内网地址，请仅在内部运维文档维护，勿写入对外公开的仓库副本。\", \"score\": 0.5058227181434631, \"metadata\": {}}, {\"text\": \"### 3. 开发与构建  \\n\\n#### 3.1 环境要求  \\n\\n| 项|建议|\\n| ---|---|\\n| Node.js|14.x ~ 16.x（与  @vue/cli-service@4.5  兼容）|\\n| npm|6+|\\n| 操作系统|Windows / macOS / Linux|  \\n\\n#### 3.2 本地开发  \\n\\n```bash\\n# 安装依赖\\nnpm install\\n\\n# 启动开发服务（默认 http://0.0.0.0:8080）\\nnpm run serve\\n\\n```  \\n\\n- 开发服务器在 `vue.config.js` 中将 `/api`代理到后端（默认 `https://219.233.250.37:42800`）。  \\n\\n- 修改代理目标：编辑 `vue.config.js` → `devServer.proxy[\'/api\'].target`。  \\n\\n- 代码保存时 ESLint 校验：`lintOnSave: \\\"error\\\"`，不通过可能阻塞编译。  \\n\\n#### 3.3 生产构建  \\n\\n```bash\\nnpm run build\\n\\n```  \\n\\n- 产物目录：`dist/`（`index.html` + `static/`）。  \\n\\n- `publicPath` 为 `./`，适合相对路径部署（子目录、file、部分 WebView）。  \\n\\n- 不生成`productionSourceMap`（`productionSourceMap: false`）。  \\n\\n#### 3.4 代码检查  \\n\\n```bash\\nnpm run lint\\n\\n```  \\n\\n### 4. 部署配置注意事项  \\n\\n#### 4.1 静态资源部署  \\n\\n1. 将 `dist` 目录全部内容 发布到 Web 服务器或拷贝到原生 App 的 H5 资源目录。  \\n\\n2. 使用 Hash 路由，服务器无需配置 SPA History 回退；任意路径应能访问到 `index.html` 所在目录。  \\n\\n3. 若部署在子路径（如 `https://domain.com/h5/`），须保证：  \\n\\n    - `vue.config.js` 中 `publicPath` 与发布路径一致（当前为 `./`，一般与 `index.html` 同目录即可）；  \\n\\n    - `static/mojs2.js`、高德脚本等相对路径可访问。  \\n\\n#### 4.2 反向代理 / 网关（生产必配）  \\n\\nH5 请求以 `/api` 为前缀（见 `src/request/request.js`）。生产环境须在 Nginx / 网关 上将 `/api` 转发到实际后端，例如：  \\n\\n```nginx\\nlocation /api/ {\\n    proxy_pass https://219.233.250.37:42800/api/;\\n    proxy_set_header Host $host;\\n    proxy_set_header X-Real-IP $remote_addr;\\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\\n    proxy_ssl_verify off;   # 若后端为自签名证书，按安全规范调整\\n}\\n\\n```  \\n\\n注意：  \\n\\n- 开发环境靠 `vue.config.js` 代理；生产环境代理在 Web 服务器配置，不会读取 `devServer.proxy`。  \\n\\n- 正式网关前缀与代码中 `publicAddress` 一致时，例如：  \\n\\n    - `gateway1`: `/api/gch`  \\n\\n    - `gateway2`: `/api/gch/sinoyd-hjzlwater`  \\n\\n    - `gateway6`（SSO）: `/api/sinoyd-sso-auth`  \\n\\n- 切换测试/正式：修改 `src/request/request.js` 中 `publicAddress` 注释块，重新 build 后部署。  \\n\\n#### 4.3 HTTPS 与混合内容  \\n\\n- 高德地图脚本为 HTTPS；页面建议全程 HTTPS，避免 WebView 拦截混合内容。  \\n\\n- 文件上传/预览地址见 `publicAddress.url`（如 `https://219.233.250.37:42800/files`），需与网关、证书策略一致。  \\n\\n#### 4.4 高德地图 Key  \\n\\n`public/index.html` 中配置：  \\n\\n- `window._AMapSecurityConfig.securityJsCode`\", \"score\": 0.4445386826992035, \"metadata\": {}}, {\"text\": \"## 上海地表水质控运维 H5 — 操作手册与部署说明  \\n\\n项目名称：质控运维（`projectTemplate` / shzhikongh5）\\n技术栈：Vue 3 + Vue Router（Hash）+ Vuex + Vant 4 + Element Plus（局部）\\n运行形态：嵌入原生 App WebView（依赖 `mojs2.js`），也可在浏览器中通过代理调试部分功能。  \\n\\n### 目录  \\n\\n1. [应用概述](#1-应用概述)  \\n\\n2. [用户操作手册](#2-用户操作手册)  \\n\\n3. [开发与构建](#3-开发与构建)  \\n\\n4. [部署配置注意事项](#4-部署配置注意事项)  \\n\\n5. [环境与接口配置](#5-环境与接口配置)  \\n\\n6. [原生壳与定位](#6-原生壳与定位)  \\n\\n7. [动态表单说明](#7-动态表单说明)  \\n\\n8. [常见问题](#8-常见问题)  \\n\\n### 1. 应用概述  \\n\\n本应用为地表水（及可扩展气、防人为）质控运维移动端 H5，主要能力包括：  \\n\\n| 能力|说明|\\n| ---|---|\\n| 登录 / 模块选择|支持单点登录（SSO）或测试账号登录，进入「地表水」等业务模块|\\n| 签到|地图选点、签到/签退，依赖原生定位与高德地图|\\n| 运维任务|待办/历史任务、任务详情、动态表单填报与提交|\\n| 新建任务|质控（qc）/ 运维（yw）类任务与表单配置|\\n| 数据查询|原始/审核/日/月数据；水模块支持 日质控零点/跨度|\\n| 报警|报警列表与处理|\\n| 站点档案|站点与仪器档案查看|\\n| 我的|个人信息、关于等|  \\n\\n底部导航（地表水主流程）：首页 → 签到 → 运维 → 报警 → 查询 → 我的。  \\n\\n路由为 Hash 模式（`#/home`），便于 WebView 与静态资源部署。  \\n\\n### 2. 用户操作手册  \\n\\n#### 2.1 登录与进入模块  \\n\\n1. 打开 App 内嵌 H5 或部署地址，默认进入 登录页（`#/login`）。  \\n\\n2. 使用分配的账号登录（正式环境多为 单点登录，由 `request.js` 中 `isSingleLogin` 控制）。  \\n\\n3. 登录成功后进入 模块选择，当前默认开放 「地表水」（环境空气、防人为干扰巡查等入口可在 `moduleChoose.vue` 中按注释恢复）。  \\n\\n4. 选择模块后进入 首页，顶部可再次切换模块。  \\n\\n#### 2.2 首页  \\n\\n- 展示天气、任务数量等概要信息。  \\n\\n- 快捷入口：任务管理、签到、新建任务、历史任务、站点档案。  \\n\\n- 底部 Tab 可切换各主模块。  \\n\\n#### 2.3 签到  \\n\\n1. 进入 签到 Tab，地图展示当前位置与可选站点。  \\n\\n2. 选择运维点位，在允许范围内进行 签到 / 签退。  \\n\\n3. 右上角可 锁定位置 刷新地图标记。  \\n\\n4. 注意：浏览器预览无法使用原生定位；正式使用须在 App 内打开，且发布前须关闭模拟定位（见 [6. 原生壳与定位](#6-原生壳与定位)）。  \\n\\n#### 2.4 运维（任务）  \\n\\n1. 运维 Tab：查看待办任务列表，点击进入 任务详情。  \\n\\n2. 详情内按因子（如重金属-镉等）展开，填写 动态表单（测定时间、仪器值、标样核查、年度性能测试表格等）。  \\n\\n3. 含 表格类型（如「指标内容」）的表单：列表页显示「点击进入」，进入子页填写多列（性能指标、测试结果、技术要求、考核结果等）。  \\n\\n4. 填写完成后 保存 / 提交（以页面按钮为准）。  \\n\\n5. 历史任务：只读查看已提交内容。  \\n\\n新建任务：首页 → 新建任务，选择站点、表单类型（质控 qc / 运维 yw）等后创建。  \\n\\n#### 2.5 数据查询  \\n\\n1. 进入 查询 Tab。  \\n\\n2. 选择 数据类型（小时原始/审核、日、月；地表水另含 日质控数据-零点 / 跨度）。  \\n\\n3. 选择 时间范围、因子（质控类型为单选因子）、必要时右上角 筛选站点。  \\n\\n4. 下拉刷新、上拉加载列表；日质控为专用表格列（测量值、核查、误差/漂移等）。  \\n\\n#### 2.6 报警  \\n\\n- 查看报警列表，进入 报警处理 填写处理信息。  \\n\\n#### 2.7 站点档案  \\n\\n- 首页进入 站点档案，可下钻 仪器 等详情页。  \\n\\n#### 2.8 我的  \\n\\n- 账号相关信息、关于 等。  \\n\\n#### 2.9 防人为干扰巡查（可选）  \\n\\n若启用 `moduleChoose` 与路由中的防人为入口，底部导航切换为：签到 / 巡查 / 我的（`artificialSign`、`artificialPatrol`、`artificialMine`）。  \\n\\n### 3. 开发与构建\", \"score\": 0.4036153256893158, \"metadata\": {}}]',0,36386,1,'2026-05-25 15:27:45');
/*!40000 ALTER TABLE `rag_session_message` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-25 15:57:35
