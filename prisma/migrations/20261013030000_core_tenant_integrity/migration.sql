-- No schema mutation until integrity checks pass.
-- MySQL 8 CHECK aborts on inconsistent legacy rows (never auto-reassign a tenant).
CREATE TEMPORARY TABLE `_elrise_tenant_preflight` (
  `violations` BIGINT NOT NULL,
  CONSTRAINT `preflight_must_be_clean` CHECK (`violations` = 0)
);
INSERT INTO `_elrise_tenant_preflight` (`violations`) SELECT
 (SELECT COUNT(*) FROM `Pegawai` e JOIN `Project` p ON e.projectId=p.id WHERE e.clientId<>p.clientId)
 +(SELECT COUNT(*) FROM `User` u JOIN `Pegawai` e ON u.pegawaiId=e.id WHERE u.pegawaiId IS NOT NULL AND (u.clientId IS NULL OR u.clientId<>e.clientId))
 +(SELECT COUNT(*) FROM `User` u JOIN `Project` p ON u.managedProjectId=p.id WHERE u.managedProjectId IS NOT NULL AND (u.clientId IS NULL OR u.clientId<>p.clientId))
 +(SELECT COUNT(*) FROM `Attendance` a JOIN `Pegawai` e ON a.pegawaiId=e.id WHERE a.clientId<>e.clientId OR a.projectId<>e.projectId)
 +(SELECT COUNT(*) FROM `Attendance` a JOIN `Project` p ON a.projectId=p.id WHERE a.clientId<>p.clientId)
 +(SELECT COUNT(*) FROM `AttendanceCorrection` c JOIN `Pegawai` e ON c.pegawaiId=e.id WHERE c.clientId<>e.clientId)
 +(SELECT COUNT(*) FROM `LeaveRequest` l JOIN `Pegawai` e ON l.pegawaiId=e.id WHERE l.clientId<>e.clientId)
 +(SELECT COUNT(*) FROM `LeaveRequest` l JOIN `LeaveType` t ON l.leaveTypeId=t.id WHERE l.clientId<>t.clientId)
 +(SELECT COUNT(*) FROM `LeaveBalance` b JOIN `Pegawai` e ON b.pegawaiId=e.id WHERE b.clientId<>e.clientId)
 +(SELECT COUNT(*) FROM `LeaveBalance` b JOIN `LeaveType` t ON b.leaveTypeId=t.id WHERE b.clientId<>t.clientId)
 +(SELECT COUNT(*) FROM `PayrollItem` i JOIN `PayrollPeriod` p ON i.payrollPeriodId=p.id JOIN `Pegawai` e ON i.pegawaiId=e.id WHERE p.clientId<>e.clientId)
 +(SELECT COUNT(*) FROM `IntegrationEmployeeMap` m JOIN `IntegrationConnection` c ON m.connectionId=c.id JOIN `Pegawai` e ON m.pegawaiId=e.id WHERE c.clientId<>e.clientId);
DROP TEMPORARY TABLE `_elrise_tenant_preflight`;

-- DropForeignKey
ALTER TABLE `User` DROP FOREIGN KEY `User_pegawaiId_fkey`;

-- DropForeignKey
ALTER TABLE `User` DROP FOREIGN KEY `User_managedProjectId_fkey`;

-- DropForeignKey
ALTER TABLE `Pegawai` DROP FOREIGN KEY `Pegawai_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `Attendance` DROP FOREIGN KEY `Attendance_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `Attendance` DROP FOREIGN KEY `Attendance_pegawaiId_fkey`;

-- DropForeignKey
ALTER TABLE `AttendanceCorrection` DROP FOREIGN KEY `AttendanceCorrection_pegawaiId_fkey`;

-- DropForeignKey
ALTER TABLE `LeaveRequest` DROP FOREIGN KEY `LeaveRequest_pegawaiId_fkey`;

-- DropForeignKey
ALTER TABLE `LeaveRequest` DROP FOREIGN KEY `LeaveRequest_leaveTypeId_fkey`;

-- DropForeignKey
ALTER TABLE `LeaveBalance` DROP FOREIGN KEY `LeaveBalance_pegawaiId_fkey`;

-- DropForeignKey
ALTER TABLE `PayrollItem` DROP FOREIGN KEY `PayrollItem_payrollPeriodId_fkey`;

-- DropForeignKey
ALTER TABLE `PayrollItem` DROP FOREIGN KEY `PayrollItem_pegawaiId_fkey`;

-- DropForeignKey
ALTER TABLE `KasbonSettlement` DROP FOREIGN KEY `KasbonSettlement_payrollItemId_fkey`;

-- DropForeignKey
ALTER TABLE `IntegrationEmployeeMap` DROP FOREIGN KEY `IntegrationEmployeeMap_connectionId_fkey`;

-- DropForeignKey
ALTER TABLE `IntegrationEmployeeMap` DROP FOREIGN KEY `IntegrationEmployeeMap_pegawaiId_fkey`;

-- MySQL retains implicit single-column FK backing indexes after removing old
-- references. They are no longer represented in Prisma's composite relations.
DROP INDEX `User_managedProjectId_fkey` ON `User`;
DROP INDEX `Pegawai_projectId_fkey` ON `Pegawai`;
DROP INDEX `AttendanceCorrection_pegawaiId_fkey` ON `AttendanceCorrection`;
DROP INDEX `LeaveRequest_leaveTypeId_fkey` ON `LeaveRequest`;
DROP INDEX `KasbonSettlement_payrollItemId_fkey` ON `KasbonSettlement`;

-- AlterTable
ALTER TABLE `PayrollItem` ADD COLUMN `clientId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `KasbonSettlement` ADD COLUMN `clientId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `IntegrationEmployeeMap` ADD COLUMN `clientId` VARCHAR(191) NULL;

-- Backfill only from verified parent relations; never infer tenant from user input.
UPDATE `PayrollItem` i
JOIN `PayrollPeriod` p ON p.id = i.`payrollPeriodId`
SET i.`clientId` = p.`clientId`;
UPDATE `KasbonSettlement` s
JOIN `PayrollItem` i ON i.id = s.`payrollItemId`
SET s.`clientId` = i.`clientId`;
UPDATE `IntegrationEmployeeMap` m
JOIN `IntegrationConnection` c ON c.id = m.`connectionId`
SET m.`clientId` = c.`clientId`;
-- Foreign keys added below abort if employee, period or connection tenant is mismatched.
ALTER TABLE `PayrollItem` MODIFY COLUMN `clientId` VARCHAR(191) NOT NULL;
ALTER TABLE `KasbonSettlement` MODIFY COLUMN `clientId` VARCHAR(191) NOT NULL;
ALTER TABLE `IntegrationEmployeeMap` MODIFY COLUMN `clientId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Project_clientId_id_key` ON `Project`(`clientId`, `id`);

-- CreateIndex
CREATE UNIQUE INDEX `User_clientId_pegawaiId_key` ON `User`(`clientId`, `pegawaiId`);

-- CreateIndex
CREATE UNIQUE INDEX `Pegawai_clientId_id_key` ON `Pegawai`(`clientId`, `id`);

-- CreateIndex
CREATE UNIQUE INDEX `Pegawai_clientId_projectId_id_key` ON `Pegawai`(`clientId`, `projectId`, `id`);

-- CreateIndex
CREATE UNIQUE INDEX `LeaveType_clientId_id_key` ON `LeaveType`(`clientId`, `id`);

-- CreateIndex
CREATE UNIQUE INDEX `PayrollPeriod_clientId_id_key` ON `PayrollPeriod`(`clientId`, `id`);

-- CreateIndex
CREATE UNIQUE INDEX `PayrollItem_clientId_id_key` ON `PayrollItem`(`clientId`, `id`);

-- CreateIndex
CREATE UNIQUE INDEX `IntegrationConnection_clientId_id_key` ON `IntegrationConnection`(`clientId`, `id`);

-- CreateIndex
CREATE UNIQUE INDEX `IntegrationEmployeeMap_clientId_pegawaiId_key` ON `IntegrationEmployeeMap`(`clientId`, `pegawaiId`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_clientId_pegawaiId_fkey` FOREIGN KEY (`clientId`, `pegawaiId`) REFERENCES `Pegawai`(`clientId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_clientId_managedProjectId_fkey` FOREIGN KEY (`clientId`, `managedProjectId`) REFERENCES `Project`(`clientId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pegawai` ADD CONSTRAINT `Pegawai_clientId_projectId_fkey` FOREIGN KEY (`clientId`, `projectId`) REFERENCES `Project`(`clientId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_clientId_projectId_fkey` FOREIGN KEY (`clientId`, `projectId`) REFERENCES `Project`(`clientId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_clientId_projectId_pegawaiId_fkey` FOREIGN KEY (`clientId`, `projectId`, `pegawaiId`) REFERENCES `Pegawai`(`clientId`, `projectId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceCorrection` ADD CONSTRAINT `AttendanceCorrection_clientId_pegawaiId_fkey` FOREIGN KEY (`clientId`, `pegawaiId`) REFERENCES `Pegawai`(`clientId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveRequest` ADD CONSTRAINT `LeaveRequest_clientId_pegawaiId_fkey` FOREIGN KEY (`clientId`, `pegawaiId`) REFERENCES `Pegawai`(`clientId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveRequest` ADD CONSTRAINT `LeaveRequest_clientId_leaveTypeId_fkey` FOREIGN KEY (`clientId`, `leaveTypeId`) REFERENCES `LeaveType`(`clientId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveBalance` ADD CONSTRAINT `LeaveBalance_clientId_pegawaiId_fkey` FOREIGN KEY (`clientId`, `pegawaiId`) REFERENCES `Pegawai`(`clientId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveBalance` ADD CONSTRAINT `LeaveBalance_clientId_leaveTypeId_fkey` FOREIGN KEY (`clientId`, `leaveTypeId`) REFERENCES `LeaveType`(`clientId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayrollItem` ADD CONSTRAINT `PayrollItem_clientId_payrollPeriodId_fkey` FOREIGN KEY (`clientId`, `payrollPeriodId`) REFERENCES `PayrollPeriod`(`clientId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayrollItem` ADD CONSTRAINT `PayrollItem_clientId_pegawaiId_fkey` FOREIGN KEY (`clientId`, `pegawaiId`) REFERENCES `Pegawai`(`clientId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KasbonSettlement` ADD CONSTRAINT `KasbonSettlement_clientId_payrollItemId_fkey` FOREIGN KEY (`clientId`, `payrollItemId`) REFERENCES `PayrollItem`(`clientId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IntegrationEmployeeMap` ADD CONSTRAINT `IntegrationEmployeeMap_clientId_connectionId_fkey` FOREIGN KEY (`clientId`, `connectionId`) REFERENCES `IntegrationConnection`(`clientId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IntegrationEmployeeMap` ADD CONSTRAINT `IntegrationEmployeeMap_clientId_pegawaiId_fkey` FOREIGN KEY (`clientId`, `pegawaiId`) REFERENCES `Pegawai`(`clientId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;
