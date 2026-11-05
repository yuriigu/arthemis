import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateLocationDto[]) {
    if (!data || data.length === 0)
      throw new BadRequestException('No locations provided');

    const locations = await this.prisma.location.createManyAndReturn({
      data: data.map((loc) => ({
        projectId: loc.projectId,
        ecosystem: loc.ecosystem,
        extent: loc.extent,
        country: loc.country,
        position: loc.position,
      })),
      select: { id: true },
    });
    return locations.map(({ id }) => id);
  }

  async findOne(id: string) {
    const location = await this.prisma.location.findUnique({ where: { id } });
    if (!location) throw new NotFoundException('Location not found');
    return location;
  }

  async update(id: string, data: UpdateLocationDto) {
    return this.prisma.location.update({
      where: { id },
      data: {
        ecosystem: data.ecosystem,
        extent: data.extent,
        country: data.country,
        position: data.position,
      },
    });
  }

  async remove(id: string) {
    await this.prisma.location.delete({ where: { id } });
    return true;
  }
}
