import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UnregisterDto } from './dto/unregister.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Public()
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('unregister')
  @Roles(UserRole.ADMIN)
  async unregister(@Body() unregisterDto: UnregisterDto) {
    return this.authService.unregister(unregisterDto);
  }

  @Post('validate')
  validate(@CurrentUser() user: { userId: string; role: string }) {
    return {
      message: 'Token is valid.',
      userId: user.userId,
      role: user.role,
    };
  }
}
