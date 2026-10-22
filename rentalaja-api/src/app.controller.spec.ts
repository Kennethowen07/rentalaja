import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let controller: AppController;
  const service = { cekKesehatan: vi.fn() };

  beforeEach(async () => {
    service.cekKesehatan.mockReset();
    const modul: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: service }],
    }).compile();

    controller = modul.get(AppController);
  });

  it('mengembalikan ok kalau database terjangkau', async () => {
    service.cekKesehatan.mockResolvedValue({ status: 'ok', database: 'ok' });
    await expect(controller.kesehatan()).resolves.toEqual({ status: 'ok', database: 'ok' });
  });

  it('melempar 503 kalau database tidak terjangkau', async () => {
    service.cekKesehatan.mockResolvedValue({ status: 'gagal', database: 'gagal' });
    await expect(controller.kesehatan()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
