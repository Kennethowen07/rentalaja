import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validasi input global, sesuai backend.md bagian 2. Setiap body dan query
  // wajib lewat DTO. whitelist membuang field yang tidak dideklarasikan, dan
  // forbidNonWhitelisted menolaknya dengan 400 alih-alih diam-diam membuang,
  // jadi klien tahu field-nya salah ketik. Contoh yang dicegah: penyewa
  // mengirim "total": 1000 dan berharap server memakainya.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Menutup koneksi database dengan rapi saat proses dihentikan (Ctrl+C).
  app.enableShutdownHooks();

  const port = app.get(ConfigService).get<number>('PORT') ?? 4000;
  await app.listen(port);

  // Klien utama API ini adalah server lain (rentalaja-web), yang memakai ulang
  // koneksi keep-alive. Bawaan Node menutup koneksi idle setelah 5 detik; kalau
  // klien memakai ulang soket tepat saat itu, jawabannya putus di tengah
  // ("other side closed"), padahal permintaannya sudah diproses. Batas yang
  // lebih panjang dari klien menghilangkan balapan itu. headersTimeout harus
  // lebih besar dari keepAliveTimeout.
  const server = app.getHttpServer();
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;
}
await bootstrap();
