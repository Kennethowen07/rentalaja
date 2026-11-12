import { ArgumentsHost, BadRequestException, Catch, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { kodeSqlState, SQLSTATE } from './kesalahan-db.js';

/**
 * Jaring pengaman global untuk error database yang sebenarnya kesalahan
 * input, supaya tidak keluar sebagai 500.
 *
 * Kasusnya sekarang satu: PostgreSQL menolak karakter NUL (\0) di parameter
 * teks dengan SQLSTATE 22021, sebelum query sempat dijalankan. Nilai dari
 * URL (/unit/:slug, /mitra/serah-terima/:kode/...) bisa berisi %00, dan
 * memeriksanya satu per satu di setiap service gampang terlupa. Body sudah
 * dijaga DTO; filter ini menutup sisanya di satu tempat.
 *
 * Error lain diteruskan apa adanya ke BaseExceptionFilter, jadi perilaku
 * bawaan NestJS (HttpException ke status-nya, sisanya 500) tidak berubah.
 * Didaftarkan lewat APP_FILTER di AppModule, sehingga test e2e yang membuat
 * aplikasi dari AppModule ikut memakainya.
 */
@Catch()
export class FilterKesalahanDb extends BaseExceptionFilter {
  override catch(exception: unknown, host: ArgumentsHost) {
    if (!(exception instanceof HttpException) && kodeSqlState(exception) === SQLSTATE.TEKS_TIDAK_SAH) {
      return super.catch(new BadRequestException('Parameter berisi karakter yang tidak sah.'), host);
    }
    return super.catch(exception, host);
  }
}
