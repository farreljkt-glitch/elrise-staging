-- Existing populated Elrise databases require a reviewed staging-clone drift check
-- before running this migration. Do not apply to Gajiku Live.
DROP INDEX `Pegawai_idPegawai_key` ON `Pegawai`;
CREATE UNIQUE INDEX `Pegawai_clientId_idPegawai_key` ON `Pegawai`(`clientId`, `idPegawai`);
