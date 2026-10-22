import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

// Test e2e memakai database sungguhan dari .env, jadi container Postgres
// harus menyala dulu: `docker compose up -d`.
describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('GET /kesehatan menjangkau database', () => {
    return request(app.getHttpServer())
      .get('/kesehatan')
      .expect(200)
      .expect({ status: 'ok', database: 'ok' });
  });

  afterEach(async () => {
    await app.close();
  });
});
