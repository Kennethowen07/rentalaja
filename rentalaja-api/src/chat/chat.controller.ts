import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PenggunaSaatIni, WajibMasuk, type PenggunaToken } from '../auth/penjaga.js';
import { ChatService } from './chat.service.js';
import { KirimPesanDto } from './dto/kirim-pesan.dto.js';

/** Chat per pesanan. Hanya penyewa pemesan dan mitra pemilik unitnya;
 *  pesanan orang lain dijawab 404. */
@Controller('chat')
@WajibMasuk()
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get()
  daftar(@PenggunaSaatIni() p: PenggunaToken) {
    return this.chat.daftar(p);
  }

  /** Membuka percakapan sekaligus menandai pesan lawan bicara dibaca. */
  @Get(':kode')
  buka(@PenggunaSaatIni() p: PenggunaToken, @Param('kode') kode: string) {
    return this.chat.buka(p, kode);
  }

  /** 409 kalau pesanannya sudah ditolak, dibatalkan, atau kedaluwarsa. */
  @Post(':kode')
  kirim(@PenggunaSaatIni() p: PenggunaToken, @Param('kode') kode: string, @Body() dto: KirimPesanDto) {
    return this.chat.kirim(p, kode, dto.isi);
  }
}
