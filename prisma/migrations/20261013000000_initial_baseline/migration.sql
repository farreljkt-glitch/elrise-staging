-- CreateTable
CREATE TABLE `Client` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(40) NOT NULL,
    `name` VARCHAR(180) NOT NULL,
    `address` TEXT NULL,
    `contactEmail` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(40) NULL,
    `picName` VARCHAR(120) NULL,
    `status` ENUM('AKTIF', 'SUSPEND', 'NONAKTIF') NOT NULL DEFAULT 'AKTIF',
    `brandColor` VARCHAR(20) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Client_code_key`(`code`),
    INDEX `Client_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(180) NOT NULL,
    `address` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Project_clientId_isActive_idx`(`clientId`, `isActive`),
    UNIQUE INDEX `Project_clientId_code_key`(`clientId`, `code`),
    UNIQUE INDEX `Project_clientId_name_key`(`clientId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClientSetting` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `attendanceEnabled` BOOLEAN NOT NULL DEFAULT true,
    `leaveEnabled` BOOLEAN NOT NULL DEFAULT true,
    `payrollEnabled` BOOLEAN NOT NULL DEFAULT true,
    `kasbonGajikuEnabled` BOOLEAN NOT NULL DEFAULT false,
    `workStart` VARCHAR(5) NOT NULL DEFAULT '08:00',
    `workEnd` VARCHAR(5) NOT NULL DEFAULT '17:00',
    `lateToleranceMinutes` INTEGER NOT NULL DEFAULT 0,
    `workDays` JSON NOT NULL,
    `holidays` JSON NOT NULL,
    `requireSelfie` BOOLEAN NOT NULL DEFAULT true,
    `requireGps` BOOLEAN NOT NULL DEFAULT true,
    `requireOfficeIp` BOOLEAN NOT NULL DEFAULT false,
    `attendanceNetworkRule` ENUM('GPS', 'IP', 'GPS_DAN_IP', 'GPS_ATAU_IP') NOT NULL DEFAULT 'GPS',
    `kasbonStartPeriod` VARCHAR(7) NULL,
    `kasbonPlafonPercent` INTEGER NOT NULL DEFAULT 20,
    `kasbonWeeklyCutoffDay` INTEGER NULL,
    `gpsRadiusMeters` INTEGER NOT NULL DEFAULT 100,
    `maxGpsAccuracyMeters` INTEGER NOT NULL DEFAULT 100,
    `annualLeaveQuota` INTEGER NOT NULL DEFAULT 12,
    `alphaDeductionPerDay` BIGINT NOT NULL DEFAULT 0,
    `defaultPayrollCycle` ENUM('A', 'B', 'C', 'D') NOT NULL DEFAULT 'A',
    `fixedAllowanceEnabled` BOOLEAN NOT NULL DEFAULT false,
    `mealAllowancePerDay` BIGINT NOT NULL DEFAULT 0,
    `transportAllowancePerDay` BIGINT NOT NULL DEFAULT 0,
    `overtimeEnabled` BOOLEAN NOT NULL DEFAULT false,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ClientSetting_clientId_key`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(180) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `role` ENUM('SUPERADMIN', 'ADMIN', 'ADMIN_PROJECT', 'PEGAWAI') NOT NULL,
    `clientId` VARCHAR(191) NULL,
    `pegawaiId` VARCHAR(191) NULL,
    `managedProjectId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `mustChangePassword` BOOLEAN NOT NULL DEFAULT true,
    `tokenVersion` INTEGER NOT NULL DEFAULT 0,
    `lastLoginAt` DATETIME(3) NULL,
    `failedLoginCount` INTEGER NOT NULL DEFAULT 0,
    `lockedUntil` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_pegawaiId_key`(`pegawaiId`),
    INDEX `User_clientId_role_isActive_idx`(`clientId`, `role`, `isActive`),
    INDEX `User_clientId_managedProjectId_idx`(`clientId`, `managedProjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pegawai` (
    `id` VARCHAR(191) NOT NULL,
    `idPegawai` VARCHAR(80) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(180) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `jabatan` VARCHAR(120) NULL,
    `perusahaan` VARCHAR(180) NULL,
    `perusahaanInduk` VARCHAR(180) NULL,
    `gajiPokok` BIGINT NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `noRekening` VARCHAR(80) NULL,
    `rekeningLain` VARCHAR(120) NULL,
    `eWallet` VARCHAR(120) NULL,
    `noTelp` VARCHAR(40) NULL,
    `siklusGaji` ENUM('A', 'B', 'C', 'D') NOT NULL DEFAULT 'A',
    `tanggalMasuk` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Pegawai_idPegawai_key`(`idPegawai`),
    INDEX `Pegawai_clientId_projectId_isActive_idx`(`clientId`, `projectId`, `isActive`),
    INDEX `Pegawai_clientId_nama_idx`(`clientId`, `nama`),
    UNIQUE INDEX `Pegawai_clientId_email_key`(`clientId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OfficeLocation` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NULL,
    `name` VARCHAR(120) NOT NULL,
    `lat` DECIMAL(10, 7) NOT NULL,
    `lng` DECIMAL(10, 7) NOT NULL,
    `radiusM` INTEGER NOT NULL DEFAULT 100,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    INDEX `OfficeLocation_clientId_projectId_isActive_idx`(`clientId`, `projectId`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OfficeIp` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(45) NOT NULL,
    `label` VARCHAR(120) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `OfficeIp_clientId_ipAddress_key`(`clientId`, `ipAddress`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Attendance` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `pegawaiId` VARCHAR(191) NOT NULL,
    `tanggal` DATE NOT NULL,
    `checkInAt` DATETIME(3) NULL,
    `checkOutAt` DATETIME(3) NULL,
    `status` ENUM('HADIR', 'TELAT', 'ALPHA', 'CUTI', 'IZIN', 'DINAS', 'LIBUR') NOT NULL DEFAULT 'HADIR',
    `selfiePath` VARCHAR(500) NULL,
    `lat` DECIMAL(10, 7) NULL,
    `lng` DECIMAL(10, 7) NULL,
    `accuracyM` DECIMAL(8, 2) NULL,
    `ip` VARCHAR(45) NULL,
    `suspiciousFlags` JSON NULL,
    `source` ENUM('WEB', 'MOBILE', 'ADMIN_CORRECTION') NOT NULL DEFAULT 'WEB',
    `validatedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Attendance_clientId_tanggal_status_idx`(`clientId`, `tanggal`, `status`),
    INDEX `Attendance_projectId_tanggal_idx`(`projectId`, `tanggal`),
    UNIQUE INDEX `Attendance_pegawaiId_tanggal_key`(`pegawaiId`, `tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AttendanceCorrection` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `pegawaiId` VARCHAR(191) NOT NULL,
    `attendanceId` VARCHAR(191) NULL,
    `requestedDate` DATE NOT NULL,
    `requestedStatus` ENUM('HADIR', 'TELAT', 'ALPHA', 'CUTI', 'IZIN', 'DINAS', 'LIBUR') NULL,
    `requestedCheckIn` DATETIME(3) NULL,
    `requestedCheckOut` DATETIME(3) NULL,
    `reason` TEXT NOT NULL,
    `status` ENUM('MENUNGGU', 'DISETUJUI', 'DITOLAK', 'DIBATALKAN') NOT NULL DEFAULT 'MENUNGGU',
    `reviewedById` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AttendanceCorrection_clientId_status_requestedDate_idx`(`clientId`, `status`, `requestedDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeaveType` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `unit` ENUM('HARI', 'JAM') NOT NULL DEFAULT 'HARI',
    `paid` BOOLEAN NOT NULL DEFAULT true,
    `annualQuota` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `LeaveType_clientId_name_key`(`clientId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeaveRequest` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `pegawaiId` VARCHAR(191) NOT NULL,
    `leaveTypeId` VARCHAR(191) NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `reason` TEXT NOT NULL,
    `attachmentPath` VARCHAR(500) NULL,
    `status` ENUM('MENUNGGU', 'DISETUJUI', 'DITOLAK', 'DIBATALKAN') NOT NULL DEFAULT 'MENUNGGU',
    `reviewedById` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LeaveRequest_clientId_status_startDate_endDate_idx`(`clientId`, `status`, `startDate`, `endDate`),
    INDEX `LeaveRequest_pegawaiId_startDate_endDate_idx`(`pegawaiId`, `startDate`, `endDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeaveBalance` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `pegawaiId` VARCHAR(191) NOT NULL,
    `leaveTypeId` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `quota` INTEGER NOT NULL,
    `used` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LeaveBalance_clientId_year_idx`(`clientId`, `year`),
    UNIQUE INDEX `LeaveBalance_pegawaiId_leaveTypeId_year_key`(`pegawaiId`, `leaveTypeId`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Holiday` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `name` VARCHAR(180) NOT NULL,
    `isNational` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Holiday_clientId_date_key`(`clientId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PayrollPeriod` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `periodCode` VARCHAR(40) NOT NULL,
    `cycle` ENUM('A', 'B', 'C', 'D') NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `status` ENUM('DRAFT', 'REVIEW', 'LOCKED', 'PAID') NOT NULL DEFAULT 'DRAFT',
    `createdById` VARCHAR(191) NOT NULL,
    `lockedById` VARCHAR(191) NULL,
    `lockedAt` DATETIME(3) NULL,
    `paidById` VARCHAR(191) NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PayrollPeriod_clientId_status_startDate_idx`(`clientId`, `status`, `startDate`),
    UNIQUE INDEX `PayrollPeriod_clientId_periodCode_cycle_key`(`clientId`, `periodCode`, `cycle`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PayrollItem` (
    `id` VARCHAR(191) NOT NULL,
    `payrollPeriodId` VARCHAR(191) NOT NULL,
    `pegawaiId` VARCHAR(191) NOT NULL,
    `gajiPokok` BIGINT NOT NULL DEFAULT 0,
    `tunjanganTetap` BIGINT NOT NULL DEFAULT 0,
    `tunjanganMakan` BIGINT NOT NULL DEFAULT 0,
    `tunjanganTransport` BIGINT NOT NULL DEFAULT 0,
    `lembur` BIGINT NOT NULL DEFAULT 0,
    `potonganAlpha` BIGINT NOT NULL DEFAULT 0,
    `kasbonDeduction` BIGINT NOT NULL DEFAULT 0,
    `potonganLain` BIGINT NOT NULL DEFAULT 0,
    `bruto` BIGINT NOT NULL DEFAULT 0,
    `totalPotongan` BIGINT NOT NULL DEFAULT 0,
    `neto` BIGINT NOT NULL DEFAULT 0,
    `hadirDays` INTEGER NOT NULL DEFAULT 0,
    `alphaDays` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PayrollItem_pegawaiId_payrollPeriodId_idx`(`pegawaiId`, `payrollPeriodId`),
    UNIQUE INDEX `PayrollItem_payrollPeriodId_pegawaiId_key`(`payrollPeriodId`, `pegawaiId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KasbonSettlement` (
    `id` VARCHAR(191) NOT NULL,
    `gajikuTxId` VARCHAR(191) NOT NULL,
    `payrollItemId` VARCHAR(191) NOT NULL,
    `nominal` BIGINT NOT NULL,
    `adminFee` BIGINT NOT NULL,
    `settledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `KasbonSettlement_gajikuTxId_key`(`gajikuTxId`),
    INDEX `KasbonSettlement_settledAt_idx`(`settledAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NULL,
    `actorId` VARCHAR(191) NULL,
    `action` ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'LOCK', 'PAY') NOT NULL,
    `entity` VARCHAR(100) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `oldValue` JSON NULL,
    `newValue` JSON NULL,
    `ip` VARCHAR(45) NULL,
    `userAgent` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_clientId_createdAt_idx`(`clientId`, `createdAt`),
    INDEX `AuditLog_actorId_createdAt_idx`(`actorId`, `createdAt`),
    INDEX `AuditLog_entity_entityId_idx`(`entity`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoginThrottle` (
    `id` VARCHAR(191) NOT NULL,
    `fingerprint` CHAR(64) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `windowStartedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `blockedUntil` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LoginThrottle_fingerprint_key`(`fingerprint`),
    INDEX `LoginThrottle_blockedUntil_idx`(`blockedUntil`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IntegrationConnection` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `externalTenantId` VARCHAR(191) NOT NULL,
    `state` ENUM('DISABLED', 'PENDING', 'ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'DISABLED',
    `payrollOwner` VARCHAR(20) NOT NULL DEFAULT 'ELRISE',
    `verifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `IntegrationConnection_clientId_key`(`clientId`),
    UNIQUE INDEX `IntegrationConnection_externalTenantId_key`(`externalTenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IntegrationEmployeeMap` (
    `id` VARCHAR(191) NOT NULL,
    `connectionId` VARCHAR(191) NOT NULL,
    `pegawaiId` VARCHAR(191) NOT NULL,
    `externalEmployeeId` VARCHAR(191) NOT NULL,
    `verifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `IntegrationEmployeeMap_pegawaiId_key`(`pegawaiId`),
    UNIQUE INDEX `IntegrationEmployeeMap_connectionId_externalEmployeeId_key`(`connectionId`, `externalEmployeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IntegrationSettlementOutbox` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `gajikuTxId` VARCHAR(191) NOT NULL,
    `payrollItemId` VARCHAR(191) NOT NULL,
    `externalTenantId` VARCHAR(191) NOT NULL,
    `externalEmployeeId` VARCHAR(191) NOT NULL,
    `amount` BIGINT NOT NULL,
    `payload` JSON NOT NULL,
    `payloadHash` CHAR(64) NOT NULL,
    `status` ENUM('PENDING', 'IN_FLIGHT', 'ACKNOWLEDGED', 'RETRY', 'DEAD_LETTER') NOT NULL DEFAULT 'PENDING',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `nextAttemptAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastError` VARCHAR(500) NULL,
    `acknowledgedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `IntegrationSettlementOutbox_eventId_key`(`eventId`),
    INDEX `IntegrationSettlementOutbox_status_nextAttemptAt_idx`(`status`, `nextAttemptAt`),
    INDEX `IntegrationSettlementOutbox_clientId_status_idx`(`clientId`, `status`),
    UNIQUE INDEX `IntegrationSettlementOutbox_clientId_gajikuTxId_key`(`clientId`, `gajikuTxId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BundleSubscription` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `mode` ENUM('ELRISE_ONLY', 'BUNDLE') NOT NULL DEFAULT 'ELRISE_ONLY',
    `effectiveAt` DATETIME(3) NOT NULL,
    `provisionedByUserId` VARCHAR(191) NOT NULL,
    `activatedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BundleSubscription_clientId_key`(`clientId`),
    INDEX `BundleSubscription_mode_effectiveAt_idx`(`mode`, `effectiveAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BundleLoanPolicy` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `pegawaiId` VARCHAR(191) NULL,
    `mode` ENUM('PERCENT_OF_PRE_KASBON_THP', 'FIXED_IDR') NOT NULL,
    `percentBps` INTEGER NULL,
    `fixedAmount` BIGINT NULL,
    `denominatorDays` INTEGER NOT NULL,
    `effectiveAt` DATETIME(3) NOT NULL,
    `createdByUserId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BundleLoanPolicy_clientId_pegawaiId_effectiveAt_idx`(`clientId`, `pegawaiId`, `effectiveAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeInvitation` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `tokenHash` CHAR(64) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `EmployeeInvitation_tokenHash_key`(`tokenHash`),
    INDEX `EmployeeInvitation_userId_usedAt_idx`(`userId`, `usedAt`),
    INDEX `EmployeeInvitation_clientId_createdAt_idx`(`clientId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminInvitation` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `tokenHash` CHAR(64) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AdminInvitation_tokenHash_key`(`tokenHash`),
    INDEX `AdminInvitation_userId_usedAt_idx`(`userId`, `usedAt`),
    INDEX `AdminInvitation_clientId_createdAt_idx`(`clientId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientSetting` ADD CONSTRAINT `ClientSetting_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_pegawaiId_fkey` FOREIGN KEY (`pegawaiId`) REFERENCES `Pegawai`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_managedProjectId_fkey` FOREIGN KEY (`managedProjectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pegawai` ADD CONSTRAINT `Pegawai_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pegawai` ADD CONSTRAINT `Pegawai_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OfficeLocation` ADD CONSTRAINT `OfficeLocation_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OfficeLocation` ADD CONSTRAINT `OfficeLocation_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OfficeIp` ADD CONSTRAINT `OfficeIp_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_pegawaiId_fkey` FOREIGN KEY (`pegawaiId`) REFERENCES `Pegawai`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceCorrection` ADD CONSTRAINT `AttendanceCorrection_pegawaiId_fkey` FOREIGN KEY (`pegawaiId`) REFERENCES `Pegawai`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveType` ADD CONSTRAINT `LeaveType_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveRequest` ADD CONSTRAINT `LeaveRequest_pegawaiId_fkey` FOREIGN KEY (`pegawaiId`) REFERENCES `Pegawai`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveRequest` ADD CONSTRAINT `LeaveRequest_leaveTypeId_fkey` FOREIGN KEY (`leaveTypeId`) REFERENCES `LeaveType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveRequest` ADD CONSTRAINT `LeaveRequest_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveBalance` ADD CONSTRAINT `LeaveBalance_pegawaiId_fkey` FOREIGN KEY (`pegawaiId`) REFERENCES `Pegawai`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveBalance` ADD CONSTRAINT `LeaveBalance_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Holiday` ADD CONSTRAINT `Holiday_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayrollPeriod` ADD CONSTRAINT `PayrollPeriod_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayrollItem` ADD CONSTRAINT `PayrollItem_payrollPeriodId_fkey` FOREIGN KEY (`payrollPeriodId`) REFERENCES `PayrollPeriod`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayrollItem` ADD CONSTRAINT `PayrollItem_pegawaiId_fkey` FOREIGN KEY (`pegawaiId`) REFERENCES `Pegawai`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KasbonSettlement` ADD CONSTRAINT `KasbonSettlement_payrollItemId_fkey` FOREIGN KEY (`payrollItemId`) REFERENCES `PayrollItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IntegrationConnection` ADD CONSTRAINT `IntegrationConnection_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IntegrationEmployeeMap` ADD CONSTRAINT `IntegrationEmployeeMap_connectionId_fkey` FOREIGN KEY (`connectionId`) REFERENCES `IntegrationConnection`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IntegrationEmployeeMap` ADD CONSTRAINT `IntegrationEmployeeMap_pegawaiId_fkey` FOREIGN KEY (`pegawaiId`) REFERENCES `Pegawai`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BundleSubscription` ADD CONSTRAINT `BundleSubscription_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BundleLoanPolicy` ADD CONSTRAINT `BundleLoanPolicy_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

