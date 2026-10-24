import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PenjagaJwt, PenjagaPeran } from './penjaga.js';

/** Global supaya penjaga JWT bisa dipakai controller module mana pun tanpa
 *  mengimpor AuthModule satu per satu. */
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.getOrThrow<string>('JWT_SECRET');
        if (secret.length < 32) throw new Error('JWT_SECRET minimal 32 karakter.');
        return { secret, signOptions: { expiresIn: '7d' } };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PenjagaJwt, PenjagaPeran],
  exports: [JwtModule, PenjagaJwt, PenjagaPeran],
})
export class AuthModule {}
