// Konfigurasi Prisma CLI (migrate, generate, seed).
//
// Prisma 7 tidak lagi membaca url database dari schema.prisma, dan tidak lagi
// memuat .env sendiri. Dua-duanya diurus di sini. Server NestJS tidak memakai
// file ini; ia membaca DATABASE_URL lewat ConfigService.

import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// quiet: dotenv 17 ke atas mencetak baris "injecting env" di setiap perintah.
config({ quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
