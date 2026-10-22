import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { AppService, type Kesehatan } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** 200 kalau server DAN database sehat, 503 kalau database tidak terjangkau,
   *  supaya pemantau (atau healthcheck Docker) bisa membedakannya. */
  @Get('kesehatan')
  async kesehatan(): Promise<Kesehatan> {
    const hasil = await this.appService.cekKesehatan();
    if (hasil.status !== 'ok') throw new ServiceUnavailableException(hasil);
    return hasil;
  }
}
