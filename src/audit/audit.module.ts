import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './audit-log.entity';
import { AuditService } from './audit.service';

@Module({
  // Conectamos la tabla (entidad) al módulo.
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditService],
  // Exportamos el servicio para poder usarlo en Auth y Users.
  exports: [AuditService], 
})
export class AuditModule {}