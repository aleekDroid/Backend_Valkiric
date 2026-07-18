import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  // Esta es la función que llamaremos cada vez que alguien haga algo importante.
  async logAction(
    usuario: string,
    accion: string,
    ip: string = '0.0.0.0', // Valor por defecto por si no podemos obtener la IP
  ): Promise<void> {
    const newLog = this.auditRepo.create({
      usuario,
      accion,
      ip,
    });
    
    await this.auditRepo.save(newLog);
  }
}