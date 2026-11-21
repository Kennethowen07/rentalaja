-- Rekening tarik saldo jadi terstruktur (bank, nomor, nama pemilik) dan
-- persetujuan pengembalian lebih awal dari kedua pihak.
--
-- Kolom lama mitra.rekening hanya berisi label tersamar ("BCA ···4471") dan
-- tidak bisa diubah jadi nomor lengkap, jadi dibuang. Rekening diisi ulang
-- lewat PUT /mitra/rekening (atau seed).

-- AlterTable
ALTER TABLE "mitra" DROP COLUMN "rekening",
ADD COLUMN     "bank_rekening" TEXT,
ADD COLUMN     "nama_rekening" TEXT,
ADD COLUMN     "nomor_rekening" TEXT,
ADD COLUMN     "rekening_diubah_pada" TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "pesanan" ADD COLUMN     "kembali_awal_mitra_pada" TIMESTAMPTZ(3),
ADD COLUMN     "kembali_awal_penyewa_pada" TIMESTAMPTZ(3);

-- -----------------------------------------------------------------------------
-- TAMBAHAN MANUAL
-- -----------------------------------------------------------------------------

-- Rekening terisi lengkap atau kosong sama sekali. Tanpa ini bisa ada nomor
-- tanpa bank, atau rekening tanpa waktu ubah sehingga kunci 24 jam lolos.
ALTER TABLE "mitra" ADD CONSTRAINT "mitra_rekening_lengkap"
  CHECK (num_nulls("bank_rekening", "nomor_rekening", "nama_rekening", "rekening_diubah_pada") IN (0, 4));

ALTER TABLE "mitra" ADD CONSTRAINT "mitra_nomor_rekening_angka"
  CHECK ("nomor_rekening" ~ '^[0-9]{8,18}$');

ALTER TABLE "mitra" ADD CONSTRAINT "mitra_nama_rekening_valid"
  CHECK (char_length(btrim("nama_rekening")) BETWEEN 2 AND 100);

-- Unit hanya boleh tercatat kembali sebelum hari jatuh temponya (WITA) kalau
-- penyewa DAN mitra sudah setuju. Dijaga saat kembali_pada pertama kali
-- diisi, yaitu saat catatan ambil lengkap dan pesanan jadi SELESAI.
CREATE FUNCTION pesanan_kembali_awal() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."kembali_pada" IS NOT NULL AND OLD."kembali_pada" IS NULL
     AND NEW."kembali_pada" <
         (date_trunc('day', NEW."selesai" AT TIME ZONE 'Asia/Makassar') AT TIME ZONE 'Asia/Makassar')
     AND (NEW."kembali_awal_penyewa_pada" IS NULL OR NEW."kembali_awal_mitra_pada" IS NULL) THEN
    RAISE EXCEPTION 'Pesanan % belum jatuh tempo; pengembalian lebih awal butuh persetujuan penyewa dan mitra', OLD."kode"
      USING ERRCODE = 'check_violation', CONSTRAINT = 'pesanan_kembali_awal';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER "pesanan_kembali_awal"
  BEFORE UPDATE OF "kembali_pada" ON "pesanan"
  FOR EACH ROW EXECUTE FUNCTION pesanan_kembali_awal();
