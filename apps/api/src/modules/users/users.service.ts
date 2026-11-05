import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './enums/user-role.enum';
import * as bcrypt from 'bcrypt';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    const updateData = {
      proponentId: data.proponentId,
      email: data.email,
      role: data.role,
    };
    const select = {
      id: true,
      proponentId: true,
      username: true,
      email: true,
      role: true,
    } as const;

    if (!data.password) {
      const existingUser = await this.prisma.user.findUnique({
        where: { username: data.username },
        select: { id: true },
      });

      if (!existingUser) {
        throw new BadRequestException('Password is required for new users');
      }

      return this.prisma.user.update({
        where: { id: existingUser.id },
        data: updateData,
        select,
      });
    }

    return this.prisma.user.upsert({
      where: { username: data.username },
      create: {
        ...updateData,
        username: data.username,
        role: data.role ?? UserRole.VISITOR,
        password: await bcrypt.hash(data.password, 10),
      },
      update: updateData,
      select,
    });
  }

  async findAll({ limit, offset }: PaginationDto) {
    return this.prisma.user.findMany({
      take: limit,
      skip: offset,
      select: {
        id: true,
        proponentId: true,
        username: true,
        email: true,
        role: true,
        proponent: true,
        password: false, // Garante que a senha não vaze
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        proponentId: true,
        username: true,
        email: true,
        role: true,
        proponent: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, data: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: {
        proponentId: data.proponentId,
        username: data.username,
        email: data.email,
        role: data.role,
      },
      select: {
        id: true,
        proponentId: true,
        username: true,
        email: true,
        role: true,
      },
    });
  }

  async remove(id: string) {
    await this.prisma.user.delete({
      where: { id },
    });
    return true; // Hard delete, igual ao Go
  }
}
