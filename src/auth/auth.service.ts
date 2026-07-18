import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto, LoginDto, VerifyTwoFactorDto } from './auth.dto';
import { UserEntity } from '../users/user.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
    private readonly auditService: AuditService,
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

    // --- REGISTRO DE AUDITORÍA ---
    await this.auditService.logAction(user.email, 'ALTA_USUARIO', 'IP_NO_REGISTRADA');

    return this.buildResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.isActive) throw new UnauthorizedException('Credenciales inválidas');

    // VERIFICAR SI ESTÁ BLOQUEADO
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intenta más tarde.');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      // INCREMENTAR INTENTOS
      const attempts = (user.failedAttempts || 0) + 1;
      let lockedUntil = null;
      
      if (attempts >= 3) {
        // Bloquear por 15 minutos (15 * 60 * 1000 milisegundos)
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); 
      }
      
      await this.usersService.updateLockStatus(user.id, attempts, lockedUntil);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // SI ENTRA CON ÉXITO, RESETEAR INTENTOS
    if (user.failedAttempts > 0) {
      await this.usersService.updateLockStatus(user.id, 0, null);
    }

    if (user.twoFactorEnabled) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await this.usersService.setTwoFactorCode(user.id, code, expires);
      await this.mailService.sendTwoFactorCode(user.email, user.name, code);
      return { twoFactorRequired: true, userId: user.id };
    }

    // --- REGISTRO DE AUDITORÍA ---
    await this.auditService.logAction(user.email, 'INICIO_SESION', 'IP_NO_REGISTRADA');

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

    // --- REGISTRO DE AUDITORÍA (Entró exitosamente con 2FA) ---
    await this.auditService.logAction(user.email, 'INICIO_SESION', 'IP_NO_REGISTRADA');

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