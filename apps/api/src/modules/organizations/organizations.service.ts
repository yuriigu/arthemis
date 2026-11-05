import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // Ajuste o caminho se necessário
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOrganizationDto: CreateOrganizationDto) {
    // No Go: g.db.Create(&reqProponent)
    // No Prisma, o 'id' UUID é gerado automaticamente pelo banco se definido no schema.prisma
    return this.prisma.proponent.create({
      data: {
        name: createOrganizationDto.name,
        email: createOrganizationDto.email,
      },
    });
  }

  async findAll({ limit, offset }: PaginationDto) {
    // No Go: g.db.Preload("Projects").Find(&proponents)
    return this.prisma.proponent.findMany({
      take: limit,
      skip: offset,
      include: {
        projects: true,
      },
    });
  }

  async findOne(id: string) {
    const proponent = await this.prisma.proponent.findUnique({
      where: { id },
      include: { projects: true },
    });

    if (!proponent) {
      throw new NotFoundException('Proponent not found');
    }
    return proponent;
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    return this.prisma.proponent.update({
      where: { id },
      data: updateOrganizationDto,
    });
  }

  async remove(id: string) {
    await this.prisma.proponent.delete({
      where: { id },
    });
    return true; // O Go retornava 'true' no DeleteProponent
  }
}
