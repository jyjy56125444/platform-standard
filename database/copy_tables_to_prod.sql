-- 复制表结构从 egg_minimal 到 egg_minimal_prod（不复制数据）
-- 在 MySQL Workbench 的 Query 窗口执行

USE egg_minimal_prod;

-- 复制表结构（不复制数据）
CREATE TABLE IF NOT EXISTS `plat_users` LIKE `egg_minimal`.`plat_users`;
CREATE TABLE IF NOT EXISTS `plat_user_log` LIKE `egg_minimal`.`plat_user_log`;
CREATE TABLE IF NOT EXISTS `mobile_app` LIKE `egg_minimal`.`mobile_app`;
CREATE TABLE IF NOT EXISTS `mobile_app_info` LIKE `egg_minimal`.`mobile_app_info`;
CREATE TABLE IF NOT EXISTS `mobile_version` LIKE `egg_minimal`.`mobile_version`;
CREATE TABLE IF NOT EXISTS `mobile_app_log` LIKE `egg_minimal`.`mobile_app_log`;
CREATE TABLE IF NOT EXISTS `mobile_app_user` LIKE `egg_minimal`.`mobile_app_user`;

-- 验证表是否创建成功
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME
FROM 
    INFORMATION_SCHEMA.TABLES 
WHERE 
    TABLE_SCHEMA = 'egg_minimal_prod'
ORDER BY 
    TABLE_NAME;


