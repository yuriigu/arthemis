import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateActivityDto[]) {
    if (!data || data.length === 0)
      throw new BadRequestException('No activities provided');

    // O Prisma lida com transações de forma muito mais limpa que o GORM
    const activities = await this.prisma.$transaction(
      data.map((activity) =>
        this.prisma.activity.create({
          data: {
            projectId: activity.projectId,
            name: activity.name,
            description: activity.description,
            justification: activity.justification,
            // Conecta as localizações (equivalente ao Replace do GORM)
            activityLocations: activity.locationIds?.length
              ? {
                  create: activity.locationIds.map((id) => ({
                    location: { connect: { id } },
                  })),
                }
              : undefined,
          },
        }),
      ),
    );
    return activities.map(({ id }) => id);
  }

  async findOne(id: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        indicators: true,
        activityLocations: { include: { location: true } },
      },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }

  async update(id: string, data: UpdateActivityDto) {
    return this.prisma.activity.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        justification: data.justification,
      },
    });
  }

  async remove(id: string) {
    await this.prisma.activity.delete({ where: { id } });
    return true;
  }
}
