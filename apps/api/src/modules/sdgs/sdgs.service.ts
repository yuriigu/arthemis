import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSdgDto } from './dto/create-sdg.dto';
import { UpdateSdgDto } from './dto/update-sdg.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class SdgsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSdgDto) {
    return this.prisma.sdg.create({
      data,
    });
  }

  async findAll({ limit, offset }: PaginationDto) {
    // Retorna a lista de ODS para o front (GET /sdg/)
    return this.prisma.sdg.findMany({
      take: limit,
      skip: offset,
      orderBy: { number: 'asc' },
    });
  }

  async findOne(id: string) {
    const sdg = await this.prisma.sdg.findUnique({
      where: { id },
    });
    if (!sdg) throw new NotFoundException('SDG not found');
    return sdg;
  }

  async update(id: string, data: UpdateSdgDto) {
    return this.prisma.sdg.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.prisma.sdg.delete({
      where: { id },
    });
    return true;
  }
}
