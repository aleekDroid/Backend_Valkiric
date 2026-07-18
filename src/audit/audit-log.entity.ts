import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  usuario: string; // Email del usuario que realizó la acción

  @Column()
  accion: string; // Ej: 'INICIO_SESION', 'ALTA_USUARIO', 'CAMBIO_PASSWORD'

  @Column({ nullable: true })
  ip: string; // Dirección IP desde donde se hizo la petición

  @CreateDateColumn()
  fecha: Date; // Fecha y hora automática
}