-- Sprint 2 / Elrise-only. REVIEWED_HOLD intentionally has no Gajiku side effect.
-- A new table only: no existing payroll, Gajiku DB, or historical kasbon changes.
CREATE TABLE `KasbonRequest` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `pegawaiId` VARCHAR(191) NOT NULL,
    `amount` BIGINT NOT NULL,
    `periodCode` VARCHAR(7) NOT NULL,
    `cycle` ENUM('A', 'B', 'C', 'D') NOT NULL,
    `requestKey` VARCHAR(64) NOT NULL,
    `purpose` VARCHAR(500) NOT NULL,
    `status` ENUM('PENDING_REVIEW', 'REVIEWED_HOLD', 'REJECTED') NOT NULL DEFAULT 'PENDING_REVIEW',
    `reviewerId` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewReason` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `KasbonRequest_clientId_pegawaiId_requestKey_key`(`clientId`, `pegawaiId`, `requestKey`),
    INDEX `KasbonRequest_clientId_status_createdAt_idx`(`clientId`, `status`, `createdAt`),
    INDEX `KasbonRequest_clientId_pegawaiId_createdAt_idx`(`clientId`, `pegawaiId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `KasbonRequest` ADD CONSTRAINT `KasbonRequest_clientId_fkey`
  FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `KasbonRequest` ADD CONSTRAINT `KasbonRequest_clientId_pegawaiId_fkey`
  FOREIGN KEY (`clientId`, `pegawaiId`) REFERENCES `Pegawai`(`clientId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;
