-- Diedit tangan setelah `prisma migrate dev --create-only`.
-- Bagian yang ditambahkan ditandai "TAMBAHAN MANUAL". Sisanya hasil Prisma.
-- Tidak ada statement yang menyentuh kolom generated "rentang".

-- CreateEnum
CREATE TYPE "asal_penyewa" AS ENUM ('WNI', 'WNA');

-- AlterEnum
ALTER TYPE "jenis_dokumen" ADD VALUE 'IDP';

-- AlterTable
ALTER TABLE "mitra" ADD COLUMN     "rekening" TEXT;

-- AlterTable
ALTER TABLE "pesanan" ADD COLUMN     "asal" "asal_penyewa" NOT NULL DEFAULT 'WNI',
ADD COLUMN     "kewarganegaraan" TEXT,
ADD COLUMN     "wajah_terverifikasi_pada" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "pencairan" (
    "id" TEXT NOT NULL,
    "mitra_id" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "rekening" TEXT NOT NULL,
    "diminta_pada" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pencairan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pesan_chat" (
    "id" TEXT NOT NULL,
    "pesanan_id" TEXT NOT NULL,
    "pengirim_id" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "dikirim_pada" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dibaca_pada" TIMESTAMPTZ(3),

    CONSTRAINT "pesan_chat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pencairan_mitra_id_idx" ON "pencairan"("mitra_id");

-- CreateIndex
CREATE INDEX "pesan_chat_pesanan_id_dikirim_pada_idx" ON "pesan_chat"("pesanan_id", "dikirim_pada");

-- AddForeignKey
ALTER TABLE "pencairan" ADD CONSTRAINT "pencairan_mitra_id_fkey" FOREIGN KEY ("mitra_id") REFERENCES "mitra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pesan_chat" ADD CONSTRAINT "pesan_chat_pesanan_id_fkey" FOREIGN KEY ("pesanan_id") REFERENCES "pesanan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pesan_chat" ADD CONSTRAINT "pesan_chat_pengirim_id_fkey" FOREIGN KEY ("pengirim_id") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- =============================================================================
-- TAMBAHAN MANUAL: aturan yang dijaga database untuk fitur lanjutan.
-- Prisma tidak bisa mengekspresikan apa pun di bawah ini di schema.prisma.
-- =============================================================================

-- Tarik saldo selalu positif. Batas atasnya (tidak melebihi saldo) dijaga
-- service dengan mengunci baris mitra, karena saldo tidak disimpan.
ALTER TABLE "pencairan"
  ADD CONSTRAINT "pencairan_jumlah_positif" CHECK ("jumlah" > 0);

-- Pesan chat tidak boleh kosong (spasi saja dihitung kosong) dan dibatasi
-- 2000 karakter.
ALTER TABLE "pesan_chat"
  ADD CONSTRAINT "pesan_chat_isi_valid"
    CHECK (char_length(btrim("isi")) BETWEEN 1 AND 2000);

-- Kewarganegaraan wajib ada untuk WNA, dan hanya untuk WNA.
ALTER TABLE "pesanan"
  ADD CONSTRAINT "pesanan_kewarganegaraan_konsisten"
    CHECK (("asal" = 'WNA') = ("kewarganegaraan" IS NOT NULL));
