import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const rapikan = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** Alamat foto. Upload sungguhan belum ada, jadi yang diterima hanya URL
 *  http(s) atau path statis seperti "/serah-terima/scoopy-depan.webp". */
const POLA_URL_FOTO = /^(https?:\/\/|\/)\S+$/;
const PESAN_URL_FOTO = 'foto harus URL http(s) atau path yang diawali "/".';

/** Satu baris kondisi, mis. { label: "Bensin", nilai: "Setengah" }. */
export class KondisiDto {
  @Transform(rapikan)
  @IsString()
  @Length(1, 40, { message: 'label kondisi harus 1 sampai 40 karakter.' })
  label!: string;

  @Transform(rapikan)
  @IsString()
  @Length(1, 120, { message: 'nilai kondisi harus 1 sampai 120 karakter.' })
  nilai!: string;
}

/** Foto per sisi. Sisi yang tidak dikirim tidak diubah. */
export class FotoSisiDto {
  @IsOptional()
  @IsString()
  @Length(1, 500)
  @Matches(POLA_URL_FOTO, { message: PESAN_URL_FOTO })
  depan?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  @Matches(POLA_URL_FOTO, { message: PESAN_URL_FOTO })
  belakang?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  @Matches(POLA_URL_FOTO, { message: PESAN_URL_FOTO })
  kiri?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  @Matches(POLA_URL_FOTO, { message: PESAN_URL_FOTO })
  kanan?: string;
}

/** Klaim kerusakan saat unit kembali. Dana penyewa ditahan sampai mitra
 *  menandai klaim selesai. */
export class KlaimDto {
  @IsInt({ message: 'nominal klaim harus bilangan bulat rupiah.' })
  @Min(1, { message: 'nominal klaim minimal Rp1.' })
  // Batas kewajaran, bukan aturan bisnis: mencegah angka salah ketik.
  @Max(100_000_000, { message: 'nominal klaim maksimal Rp100.000.000.' })
  nominal!: number;

  @Transform(rapikan)
  @IsString()
  @Length(3, 500, { message: 'keterangan klaim harus 3 sampai 500 karakter.' })
  keterangan!: string;
}

/**
 * Body PUT /mitra/serah-terima/:kode/:jenis.
 *
 * Semua bagian opsional dan DIGABUNG dengan yang sudah tercatat: kondisi
 * yang dikirim menggantikan kondisi lama, foto hanya mengganti sisi yang
 * dikirim, bagian yang tidak dikirim dibiarkan. Mengirim body yang sama dua
 * kali menghasilkan keadaan yang sama (idempoten).
 */
export class CatatSerahTerimaDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'kondisi minimal satu baris.' })
  @ArrayMaxSize(12, { message: 'kondisi maksimal 12 baris.' })
  @ValidateNested({ each: true })
  @Type(() => KondisiDto)
  kondisi?: KondisiDto[];

  // IsObject menolak array: ValidateNested meloloskan [] dan [{...}], lalu
  // fotonya diam-diam diabaikan.
  @IsOptional()
  @IsObject({ message: 'foto harus objek per sisi: { depan, belakang, kiri, kanan }.' })
  @ValidateNested()
  @Type(() => FotoSisiDto)
  foto?: FotoSisiDto;

  @IsOptional()
  @Transform(rapikan)
  @IsString()
  @Length(0, 500, { message: 'catatan maksimal 500 karakter.' })
  catatan?: string;

  /** Hanya untuk jenis ambil. */
  // IsObject menolak array, yang lolos ValidateNested lalu gagal di Prisma
  // (nominal kosong) sebagai 500.
  @IsOptional()
  @IsObject({ message: 'klaim harus objek { nominal, keterangan }.' })
  @ValidateNested()
  @Type(() => KlaimDto)
  klaim?: KlaimDto;
}
