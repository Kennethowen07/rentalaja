import { Transform, Type } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsDefined,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
  ValidateBy,
  ValidateIf,
  ValidateNested,
  type ValidationArguments,
} from 'class-validator';
import { RentangSewaDto } from '../../umum/dto/rentang-sewa.dto.js';

export const METODE_BAYAR = ['BCA_VA', 'QRIS', 'EWALLET'] as const;
export const ASAL_PENYEWA = ['WNI', 'WNA'] as const;
export type AsalPenyewa = (typeof ASAL_PENYEWA)[number];

/** Spasi di tepi dibuang sebelum panjangnya diperiksa. */
const rapikan = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** PostgreSQL tidak bisa menyimpan karakter NUL di kolom teks; tanpa ini
 *  teks berisi NUL lolos validasi lalu gagal di database dengan 500. */
const TanpaNul = (field: string) =>
  Matches(/^[^\0]*$/, { message: `${field} tidak boleh berisi karakter NUL.` });

/** Asal penyewa di body yang sama. Kosong dianggap WNI, sama dengan default
 *  kolom pesanan.asal. */
const asalDari = (args?: ValidationArguments): AsalPenyewa =>
  (args?.object as { asal?: AsalPenyewa } | undefined)?.asal ?? 'WNI';

/** Field yang hanya boleh diisi penyewa WNA. */
const KhususWna = () =>
  ValidateBy({
    name: 'khususWna',
    validator: {
      validate: (_: unknown, args) => asalDari(args) === 'WNA',
      defaultMessage: (args) => `${args?.property} hanya diisi penyewa WNA.`,
    },
  });

/**
 * IDP wajib untuk WNA dan dilarang untuk WNI. Diperiksa di level `dokumen`,
 * bukan di DokumenPenyewaDto, karena objek bersarang tidak bisa membaca
 * `asal` milik induknya.
 */
const DokumenSesuaiAsal = () =>
  ValidateBy({
    name: 'dokumenSesuaiAsal',
    validator: {
      validate: (nilai: unknown, args) => {
        if (typeof nilai !== 'object' || nilai === null) return true; // ditangani IsObject
        const adaIdp = (nilai as { idp?: unknown }).idp != null;
        return asalDari(args) === 'WNA' ? adaIdp : !adaIdp;
      },
      defaultMessage: (args) =>
        asalDari(args) === 'WNA'
          ? 'dokumen.idp (International Driving Permit) wajib untuk penyewa WNA.'
          : 'dokumen.idp hanya untuk penyewa WNA.',
    },
  });

/**
 * Dokumen jaminan pengganti deposit tunai. Isinya URL atau nama berkas hasil
 * unggah; penyimpanan berkasnya sendiri belum ada di backend ini.
 *   identitas  KTP untuk WNI, paspor untuk WNA
 *   sim        SIM Indonesia, atau SIM negara asal untuk WNA
 *   idp        International Driving Permit, hanya WNA
 */
export class DokumenPenyewaDto {
  @Transform(rapikan)
  @IsString()
  @Length(1, 500, { message: 'dokumen.identitas harus 1 sampai 500 karakter.' })
  @TanpaNul('dokumen.identitas')
  identitas!: string;

  @Transform(rapikan)
  @IsString()
  @Length(1, 500, { message: 'dokumen.sim harus 1 sampai 500 karakter.' })
  @TanpaNul('dokumen.sim')
  sim!: string;

  @IsOptional()
  @Transform(rapikan)
  @IsString()
  @Length(1, 500, { message: 'dokumen.idp harus 1 sampai 500 karakter.' })
  @TanpaNul('dokumen.idp')
  idp?: string;
}

/**
 * Body POST /pesanan. Rentang sewanya memakai aturan yang sama dengan
 * pencarian (mulai, durasi, jam), jadi unit yang tampil kosong di pencarian
 * dipesan dengan rentang yang persis sama.
 */
export class BuatPesananDto extends RentangSewaDto {
  /** Slug unit, sama dengan yang ada di URL /unit/:slug. */
  @IsString()
  @Length(1, 120)
  @TanpaNul('unit')
  unit!: string;

  /** true = diantar ke titik, false = ambil sendiri di rental. */
  @IsBoolean()
  diantar!: boolean;

  /** Alamat antar, atau nama tempat ambil. Spasi di tepi dibuang sebelum
   *  panjangnya diperiksa, supaya "   " tidak lolos sebagai alamat. */
  @Transform(rapikan)
  @IsString()
  @Length(3, 200, { message: 'titik harus 3 sampai 200 karakter.' })
  @TanpaNul('titik')
  titik!: string;

  @IsIn(METODE_BAYAR, { message: `metode harus salah satu dari ${METODE_BAYAR.join(', ')}.` })
  metode!: (typeof METODE_BAYAR)[number];

  /**
   * Total yang terakhir dilihat penyewa di layar. Bukan sumber harga: server
   * tetap menghitung sendiri, lalu menolak kalau angkanya berbeda (misalnya
   * penyedia baru saja mengubah harga). Tanpa ini penyewa bisa ditagih angka
   * yang tidak pernah ia lihat.
   */
  @IsInt()
  @Min(1)
  totalDisetujui!: number;

  /** WNI atau wisatawan asing. Kosong = WNI. */
  @IsOptional()
  @IsIn(ASAL_PENYEWA, { message: `asal harus salah satu dari ${ASAL_PENYEWA.join(', ')}.` })
  asal?: AsalPenyewa;

  /** Negara paspor, wajib untuk WNA dan dilarang untuk WNI (juga dijaga
   *  CHECK pesanan_kewarganegaraan_konsisten di database). */
  @ValidateIf((o: BuatPesananDto) => o.asal === 'WNA' || o.kewarganegaraan != null)
  @KhususWna()
  @Transform(rapikan)
  @IsString()
  @Length(2, 60, { message: 'kewarganegaraan harus 2 sampai 60 karakter.' })
  @TanpaNul('kewarganegaraan')
  kewarganegaraan?: string;

  @IsDefined({ message: 'dokumen wajib diisi.' })
  @IsObject({ message: 'dokumen harus berupa objek { identitas, sim, idp? }.' })
  @DokumenSesuaiAsal()
  @ValidateNested()
  @Type(() => DokumenPenyewaDto)
  dokumen!: DokumenPenyewaDto;

  /** Verifikasi wajah (KYC) wajib selesai sebelum memesan. Masih simulasi:
   *  server hanya mencatat waktunya. */
  @Equals(true, { message: 'verifikasiWajah wajib true: selesaikan verifikasi wajah dulu.' })
  verifikasiWajah!: true;
}
