import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto, LoginDto, VerifyTwoFactorDto } from './auth.dto';
import { UserEntity } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('El email ya está registrado');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email,
      name: dto.name,
      password: hashed,
    });

    return this.buildResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.isActive) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    if (user.twoFactorEnabled) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await this.usersService.setTwoFactorCode(user.id, code, expires);
      // If email sending fails it throws InternalServerErrorException with a clear message
      await this.mailService.sendTwoFactorCode(user.email, user.name, code);
      return { twoFactorRequired: true, userId: user.id };
    }

    return this.buildResponse(user);
  }

  async verifyTwoFactor(dto: VerifyTwoFactorDto) {
    const user = await this.usersService.findById(dto.userId);
    if (!user || !user.isActive) throw new UnauthorizedException('Usuario no válido');

    if (!user.twoFactorCode || !user.twoFactorExpires) {
      throw new UnauthorizedException('Código no solicitado');
    }
    if (new Date() > user.twoFactorExpires) {
      throw new UnauthorizedException('El código ha expirado');
    }
    if (user.twoFactorCode !== dto.code) {
      throw new UnauthorizedException('Código incorrecto');
    }

    // Clear the used code
    await this.usersService.setTwoFactorCode(user.id, null, null);

    return this.buildResponse(user);
  }

  async enableTwoFactor(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException();
    await this.usersService.setTwoFactorEnabled(userId, true);
    return { twoFactorEnabled: true };
  }

  async disableTwoFactor(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException();
    await this.usersService.setTwoFactorEnabled(userId, false);
    return { twoFactorEnabled: false };
  }

  private buildResponse(user: UserEntity) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);
    const { password, twoFactorCode, twoFactorExpires, ...userSafe } = user as any;
    return { access_token: token, user: userSafe };
  }
}

