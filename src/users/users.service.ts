import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private repo: Repository<UserEntity>,
  ) {}

  findAll(): Promise<UserEntity[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { email } });
  }

  async create(data: Partial<UserEntity>): Promise<UserEntity> {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  async update(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    Object.assign(user, data);
    return this.repo.save(user);
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new BadRequestException('Contraseña actual incorrecta');
    user.password = await bcrypt.hash(newPassword, 10);
    await this.repo.save(user);
  }

  async setTwoFactorCode(id: string, code: string | null, expires: Date | null): Promise<void> {
    await this.repo.update(id, { twoFactorCode: code, twoFactorExpires: expires } as any);
  }

  async setTwoFactorEnabled(id: string, enabled: boolean): Promise<void> {
    await this.repo.update(id, { twoFactorEnabled: enabled, twoFactorCode: null, twoFactorExpires: null } as any);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async updateLockStatus(userId: string, failedAttempts: number, lockedUntil: Date | null): Promise<void> {
    await this.usersRepository.update(userId, { failedAttempts, lockedUntil });
  }

  count(): Promise<number> {
    return this.repo.count();
  }
}
