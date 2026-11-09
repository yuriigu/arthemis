import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service'; // Ajuste o caminho se necessário
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UnregisterDto } from './dto/unregister.dto';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: RegisterDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        role: UserRole.VISITOR,
      },
    });

    return { id: user.id, username: user.username, role: user.role };
  }

  async login(data: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !(await bcrypt.compare(data.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, role: user.role };

    return {
      token: this.jwtService.sign(payload),
    };
  }

  async unregister(data: UnregisterDto) {
    const user = await this.prisma.user.delete({
      where: { username: data.username },
    });
    return { id: user.id, username: user.username, role: user.role };
  }
}
