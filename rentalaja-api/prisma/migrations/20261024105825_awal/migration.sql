-- Diedit tangan setelah `prisma migrate dev --create-only`.
-- Bagian yang ditambahkan ditandai "TAMBAHAN MANUAL". Sisanya hasil Prisma.

-- TAMBAHAN MANUAL: btree_gist dibutuhkan constraint EXCLUDE di bawah, supaya
-- indeks GiST bisa membandingkan unit_id (teks) dengan operator =.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- CreateEnum
CREATE TYPE "peran" AS ENUM ('PENYEWA', 'MITRA');

-- CreateEnum
CREATE TYPE "kategori" AS ENUM ('MOTOR', 'MOBIL');

-- CreateEnum
CREATE TYPE "jenis_blokir" AS ENUM ('MANUAL', 'SERVIS');

-- CreateEnum
CREATE TYPE "status_pesanan" AS ENUM ('MENUNGGU', 'BERJALAN', 'SELESAI', 'DITOLAK', 'DIBATALKAN');

-- CreateEnum
CREATE TYPE "alasan_batal" AS ENUM ('KEDALUWARSA', 'DIBATALKAN_PENYEWA');

-- CreateEnum
CREATE TYPE "metode_bayar" AS ENUM ('BCA_VA', 'QRIS', 'EWALLET');

-- CreateEnum
CREATE TYPE "jenis_dokumen" AS ENUM ('IDENTITAS', 'SIM');

-- CreateEnum
CREATE TYPE "jenis_serah" AS ENUM ('ANTAR', 'AMBIL');

-- CreateEnum
CREATE TYPE "sisi_foto" AS ENUM ('DEPAN', 'BELAKANG', 'KIRI', 'KANAN');

-- CreateTable
CREATE TABLE "pengguna" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "kata_sandi_hash" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "telepon" TEXT NOT NULL,
    "peran" "peran" NOT NULL,
    "dibuat_pada" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pengguna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mitra" (
    "id" TEXT NOT NULL,
    "pemilik_id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "dibuat_pada" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mitra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "mitra_id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "plat" TEXT NOT NULL,
    "kategori" "kategori" NOT NULL,
    "jenis" TEXT NOT NULL,
    "spesifikasi" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "harga_per_hari" INTEGER NOT NULL,
    "foto" TEXT,
    "area" TEXT NOT NULL,
    "dibuat_pada" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blokir_unit" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "jenis" "jenis_blokir" NOT NULL,
    "mulai" TIMESTAMPTZ(3) NOT NULL,
    "selesai" TIMESTAMPTZ(3) NOT NULL,
    -- TAMBAHAN MANUAL: dihitung database dari mulai dan selesai, tidak pernah
    -- ditulis aplikasi. '[)' = mulai termasuk, selesai tidak, jadi blokir
    -- yang berakhir pukul 09.00 tidak bentrok dengan pesanan mulai 09.00.
    "rentang" tstzrange GENERATED ALWAYS AS (tstzrange("mulai", "selesai", '[)')) STORED,
    "catatan" TEXT,
    "dibuat_pada" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blokir_unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pesanan" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "penyewa_id" TEXT NOT NULL,
    "mulai" TIMESTAMPTZ(3) NOT NULL,
    "selesai" TIMESTAMPTZ(3) NOT NULL,
    -- TAMBAHAN MANUAL: lihat catatan yang sama di blokir_unit.
    "rentang" tstzrange GENERATED ALWAYS AS (tstzrange("mulai", "selesai", '[)')) STORED,
    "status" "status_pesanan" NOT NULL DEFAULT 'MENUNGGU',
    "alasan_batal" "alasan_batal",
    "harga_per_hari" INTEGER NOT NULL,
    "jumlah_hari" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "biaya_layanan" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "diantar" BOOLEAN NOT NULL,
    "titik" TEXT NOT NULL,
    "dibuat_pada" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diterima_pada" TIMESTAMPTZ(3),
    "ditolak_pada" TIMESTAMPTZ(3),
    "dibatalkan_pada" TIMESTAMPTZ(3),
    "kembali_pada" TIMESTAMPTZ(3),

    CONSTRAINT "pesanan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pembayaran" (
    "id" TEXT NOT NULL,
    "pesanan_id" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "metode" "metode_bayar" NOT NULL,
    "dibayar_pada" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pembayaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dokumen_penyewa" (
    "id" TEXT NOT NULL,
    "pesanan_id" TEXT NOT NULL,
    "jenis" "jenis_dokumen" NOT NULL,
    "url" TEXT NOT NULL,
    "diunggah_pada" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dokumen_penyewa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serah_terima" (
    "id" TEXT NOT NULL,
    "pesanan_id" TEXT NOT NULL,
    "jenis" "jenis_serah" NOT NULL,
    "kondisi" JSONB NOT NULL DEFAULT '[]',
    "catatan" TEXT,
    "dicatat_pada" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "serah_terima_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foto_serah" (
    "id" TEXT NOT NULL,
    "serah_terima_id" TEXT NOT NULL,
    "sisi" "sisi_foto" NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "foto_serah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "klaim_kerusakan" (
    "id" TEXT NOT NULL,
    "pesanan_id" TEXT NOT NULL,
    "nominal" INTEGER NOT NULL,
    "keterangan" TEXT NOT NULL,
    "diajukan_pada" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diselesaikan_pada" TIMESTAMPTZ(3),

    CONSTRAINT "klaim_kerusakan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ulasan" (
    "id" TEXT NOT NULL,
    "pesanan_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "penyewa_id" TEXT NOT NULL,
    "skor" DECIMAL(2,1) NOT NULL,
    "isi" TEXT NOT NULL,
    "dibuat_pada" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "balasan" TEXT,
    "dibalas_pada" TIMESTAMPTZ(3),

    CONSTRAINT "ulasan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pengguna_email_key" ON "pengguna"("email");

-- CreateIndex
CREATE UNIQUE INDEX "mitra_pemilik_id_key" ON "mitra"("pemilik_id");

-- CreateIndex
CREATE UNIQUE INDEX "unit_slug_key" ON "unit"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "unit_plat_key" ON "unit"("plat");

-- CreateIndex
CREATE INDEX "unit_mitra_id_idx" ON "unit"("mitra_id");

-- CreateIndex
CREATE INDEX "blokir_unit_unit_id_idx" ON "blokir_unit"("unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "pesanan_kode_key" ON "pesanan"("kode");

-- CreateIndex
CREATE INDEX "pesanan_unit_id_idx" ON "pesanan"("unit_id");

-- CreateIndex
CREATE INDEX "pesanan_penyewa_id_idx" ON "pesanan"("penyewa_id");

-- CreateIndex
CREATE UNIQUE INDEX "pembayaran_pesanan_id_key" ON "pembayaran"("pesanan_id");

-- CreateIndex
CREATE UNIQUE INDEX "dokumen_penyewa_pesanan_id_jenis_key" ON "dokumen_penyewa"("pesanan_id", "jenis");

-- CreateIndex
CREATE UNIQUE INDEX "serah_terima_pesanan_id_jenis_key" ON "serah_terima"("pesanan_id", "jenis");

-- CreateIndex
CREATE UNIQUE INDEX "foto_serah_serah_terima_id_sisi_key" ON "foto_serah"("serah_terima_id", "sisi");

-- CreateIndex
CREATE UNIQUE INDEX "klaim_kerusakan_pesanan_id_key" ON "klaim_kerusakan"("pesanan_id");

-- CreateIndex
CREATE UNIQUE INDEX "ulasan_pesanan_id_key" ON "ulasan"("pesanan_id");

-- CreateIndex
CREATE INDEX "ulasan_unit_id_idx" ON "ulasan"("unit_id");

-- AddForeignKey
ALTER TABLE "mitra" ADD CONSTRAINT "mitra_pemilik_id_fkey" FOREIGN KEY ("pemilik_id") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit" ADD CONSTRAINT "unit_mitra_id_fkey" FOREIGN KEY ("mitra_id") REFERENCES "mitra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blokir_unit" ADD CONSTRAINT "blokir_unit_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pesanan" ADD CONSTRAINT "pesanan_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pesanan" ADD CONSTRAINT "pesanan_penyewa_id_fkey" FOREIGN KEY ("penyewa_id") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_pesanan_id_fkey" FOREIGN KEY ("pesanan_id") REFERENCES "pesanan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dokumen_penyewa" ADD CONSTRAINT "dokumen_penyewa_pesanan_id_fkey" FOREIGN KEY ("pesanan_id") REFERENCES "pesanan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serah_terima" ADD CONSTRAINT "serah_terima_pesanan_id_fkey" FOREIGN KEY ("pesanan_id") REFERENCES "pesanan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foto_serah" ADD CONSTRAINT "foto_serah_serah_terima_id_fkey" FOREIGN KEY ("serah_terima_id") REFERENCES "serah_terima"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "klaim_kerusakan" ADD CONSTRAINT "klaim_kerusakan_pesanan_id_fkey" FOREIGN KEY ("pesanan_id") REFERENCES "pesanan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ulasan" ADD CONSTRAINT "ulasan_pesanan_id_fkey" FOREIGN KEY ("pesanan_id") REFERENCES "pesanan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ulasan" ADD CONSTRAINT "ulasan_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ulasan" ADD CONSTRAINT "ulasan_penyewa_id_fkey" FOREIGN KEY ("penyewa_id") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- =============================================================================
-- TAMBAHAN MANUAL: aturan bisnis yang dijaga database (backend.md bagian 4).
-- Prisma tidak bisa mengekspresikan apa pun di bawah ini di schema.prisma.
-- =============================================================================

-- Batas penyedia membalas pesanan. Satu-satunya tempat angka ini di database.
-- Di aplikasi nilainya BATAS_BALAS_MS; keduanya harus selalu sama.
CREATE FUNCTION batas_balas() RETURNS interval
  LANGUAGE sql IMMUTABLE PARALLEL SAFE
  AS $$ SELECT interval '1 hour' $$;

-- -----------------------------------------------------------------------------
-- 1. Harga dihitung, tidak dibaca dari data
-- -----------------------------------------------------------------------------
ALTER TABLE "unit"
  ADD CONSTRAINT "unit_harga_positif" CHECK ("harga_per_hari" > 0);

ALTER TABLE "pesanan"
  ADD CONSTRAINT "pesanan_rentang_valid" CHECK ("selesai" > "mulai"),
  -- Jumlah hari harus cocok dengan tanggalnya. Tanpa ini, pesanan 5 hari bisa
  -- tersimpan dengan jumlah_hari = 1 dan hanya membayar sehari. Hari parsial
  -- dibulatkan ke atas.
  ADD CONSTRAINT "pesanan_jumlah_hari_sesuai_tanggal"
    CHECK ("jumlah_hari" = CEIL(EXTRACT(EPOCH FROM ("selesai" - "mulai")) / 86400)),
  ADD CONSTRAINT "pesanan_harga_positif" CHECK ("harga_per_hari" > 0),
  ADD CONSTRAINT "pesanan_subtotal_dihitung"
    CHECK ("subtotal" = "harga_per_hari" * "jumlah_hari"),
  ADD CONSTRAINT "pesanan_biaya_layanan_tidak_negatif" CHECK ("biaya_layanan" >= 0),
  ADD CONSTRAINT "pesanan_total_dihitung"
    CHECK ("total" = "subtotal" + "biaya_layanan"),
  -- Alasan batal hanya ada, dan wajib ada, untuk pesanan yang dibatalkan.
  ADD CONSTRAINT "pesanan_alasan_batal_konsisten"
    CHECK (("status" = 'DIBATALKAN') = ("alasan_batal" IS NOT NULL));

ALTER TABLE "blokir_unit"
  ADD CONSTRAINT "blokir_rentang_valid" CHECK ("selesai" > "mulai");

ALTER TABLE "pembayaran"
  ADD CONSTRAINT "pembayaran_jumlah_positif" CHECK ("jumlah" > 0);

ALTER TABLE "klaim_kerusakan"
  ADD CONSTRAINT "klaim_nominal_positif" CHECK ("nominal" > 0);

ALTER TABLE "ulasan"
  ADD CONSTRAINT "ulasan_skor_setengah_bintang"
    CHECK ("skor" BETWEEN 1 AND 5 AND "skor" * 2 = TRUNC("skor" * 2));

-- -----------------------------------------------------------------------------
-- 2. Tidak ada double booking antar pesanan
-- -----------------------------------------------------------------------------
-- Dijaga database, bukan "cari dulu baru insert" di kode. Dua request yang
-- datang bersamaan tidak bisa lolos dua-duanya: yang kedua ditolak saat
-- menulis, bukan saat memeriksa.
ALTER TABLE "pesanan" ADD CONSTRAINT "pesanan_tanpa_tumpang_tindih"
  EXCLUDE USING gist ("unit_id" WITH =, "rentang" WITH &&)
  WHERE ("status" IN ('MENUNGGU', 'BERJALAN'));

-- -----------------------------------------------------------------------------
-- 3. Pesanan vs blokir, dan pesanan yang kedaluwarsa
-- -----------------------------------------------------------------------------
-- EXCLUDE hanya bekerja di dalam satu tabel, padahal blokir ada di tabel lain.
-- Pemeriksaan lintas tabel tetap aman dari balapan karena setiap trigger lebih
-- dulu mengunci baris unit (FOR UPDATE): semua penulisan yang menyentuh slot
-- unit yang sama jadi antre satu per satu.
--
-- Pelanggaran dilempar dengan kode 23P01 (exclusion_violation), sama dengan
-- kode bawaan EXCLUDE, jadi aplikasi cukup menangani satu jenis error untuk
-- "slot sudah terisi".

CREATE FUNCTION pesanan_jaga_slot() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE
  -- Kolom generated belum terisi di trigger BEFORE, jadi rentangnya dihitung
  -- ulang di sini dengan rumus yang sama.
  rentang_baru tstzrange := tstzrange(NEW."mulai", NEW."selesai", '[)');
BEGIN
  -- Penyedia tidak boleh menerima pesanan yang sudah lewat batas balas.
  IF TG_OP = 'UPDATE'
     AND OLD."status" = 'MENUNGGU' AND NEW."status" = 'BERJALAN'
     AND OLD."dibuat_pada" + batas_balas() <= now() THEN
    RAISE EXCEPTION 'Pesanan % sudah lewat batas balas', OLD."kode"
      USING ERRCODE = 'check_violation', CONSTRAINT = 'pesanan_batas_balas';
  END IF;

  IF NEW."status" NOT IN ('MENUNGGU', 'BERJALAN') THEN
    RETURN NEW;
  END IF;

  PERFORM 1 FROM "unit" WHERE "id" = NEW."unit_id" FOR UPDATE;

  -- Pesanan MENUNGGU yang lewat batas balas secara logika sudah batal, tapi
  -- barisnya masih MENUNGGU karena tidak ada cron. EXCLUDE tidak bisa membaca
  -- jam sekarang, jadi tanpa langkah ini baris seperti itu mengunci slotnya
  -- selamanya. Di sini, tepat saat slotnya dibutuhkan, baris yang menghalangi
  -- dicatat DIBATALKAN. Waktu batalnya diisi saat ia benar-benar kedaluwarsa,
  -- bukan saat dicatat.
  UPDATE "pesanan"
     SET "status" = 'DIBATALKAN',
         "alasan_batal" = 'KEDALUWARSA',
         "dibatalkan_pada" = "dibuat_pada" + batas_balas()
   WHERE "unit_id" = NEW."unit_id"
     AND "id" <> NEW."id"
     AND "status" = 'MENUNGGU'
     AND "dibuat_pada" + batas_balas() <= now()
     AND "rentang" && rentang_baru;

  IF EXISTS (
    SELECT 1 FROM "blokir_unit" b
     WHERE b."unit_id" = NEW."unit_id" AND b."rentang" && rentang_baru
  ) THEN
    RAISE EXCEPTION 'Unit diblokir penyedia di rentang %', rentang_baru
      USING ERRCODE = 'exclusion_violation', CONSTRAINT = 'pesanan_tidak_menimpa_blokir';
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER "pesanan_jaga_slot"
  BEFORE INSERT OR UPDATE OF "status", "mulai", "selesai", "unit_id" ON "pesanan"
  FOR EACH ROW EXECUTE FUNCTION pesanan_jaga_slot();

CREATE FUNCTION blokir_jaga_slot() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE
  rentang_baru tstzrange := tstzrange(NEW."mulai", NEW."selesai", '[)');
BEGIN
  PERFORM 1 FROM "unit" WHERE "id" = NEW."unit_id" FOR UPDATE;

  -- Blokir, manual maupun servis, tidak boleh menimpa tanggal yang sudah ada
  -- pesanannya. Pesanan MENUNGGU yang sudah kedaluwarsa tidak dihitung.
  IF EXISTS (
    SELECT 1 FROM "pesanan" p
     WHERE p."unit_id" = NEW."unit_id"
       AND p."rentang" && rentang_baru
       AND (p."status" = 'BERJALAN'
            OR (p."status" = 'MENUNGGU' AND p."dibuat_pada" + batas_balas() > now()))
  ) THEN
    RAISE EXCEPTION 'Blokir tidak bisa menimpa tanggal yang sudah ada pesanannya'
      USING ERRCODE = 'exclusion_violation', CONSTRAINT = 'blokir_tidak_menimpa_pesanan';
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER "blokir_jaga_slot"
  BEFORE INSERT OR UPDATE OF "mulai", "selesai", "unit_id" ON "blokir_unit"
  FOR EACH ROW EXECUTE FUNCTION blokir_jaga_slot();

-- -----------------------------------------------------------------------------
-- 4. Pesanan dibekukan setelah dibuat
-- -----------------------------------------------------------------------------
-- Yang boleh berubah hanya status dan waktu-waktu aksi. Unit, tanggal, dan
-- harga tetap seperti saat penyewa membayar.
CREATE FUNCTION pesanan_beku() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW."unit_id", NEW."penyewa_id", NEW."mulai", NEW."selesai",
      NEW."harga_per_hari", NEW."jumlah_hari", NEW."subtotal",
      NEW."biaya_layanan", NEW."total")
     IS DISTINCT FROM
     (OLD."unit_id", OLD."penyewa_id", OLD."mulai", OLD."selesai",
      OLD."harga_per_hari", OLD."jumlah_hari", OLD."subtotal",
      OLD."biaya_layanan", OLD."total") THEN
    RAISE EXCEPTION 'Unit, tanggal, dan harga pesanan % tidak bisa diubah setelah dibuat', OLD."kode"
      USING ERRCODE = 'check_violation', CONSTRAINT = 'pesanan_beku';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER "pesanan_beku"
  BEFORE UPDATE ON "pesanan"
  FOR EACH ROW EXECUTE FUNCTION pesanan_beku();

-- -----------------------------------------------------------------------------
-- 5. Yang ditagih sama persis dengan yang ditunjukkan
-- -----------------------------------------------------------------------------
CREATE FUNCTION pembayaran_sesuai_total() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE
  total_pesanan integer;
BEGIN
  SELECT "total" INTO total_pesanan FROM "pesanan" WHERE "id" = NEW."pesanan_id";
  IF NEW."jumlah" IS DISTINCT FROM total_pesanan THEN
    RAISE EXCEPTION 'Jumlah bayar % tidak sama dengan total pesanan %', NEW."jumlah", total_pesanan
      USING ERRCODE = 'check_violation', CONSTRAINT = 'pembayaran_sesuai_total';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER "pembayaran_sesuai_total"
  BEFORE INSERT OR UPDATE OF "jumlah", "pesanan_id" ON "pembayaran"
  FOR EACH ROW EXECUTE FUNCTION pembayaran_sesuai_total();
