import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Machine } from './machine.entity';
import { ApiKey } from './api-key.entity';
import { AuditLog } from './audit-log.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  logo_url: string;

  @Column({ default: 'TRIAL' })
  tier: 'TRIAL' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

  @Column({ default: true })
  is_active: boolean;

  @Column()
  owner_id: string;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @Column({ default: 0 })
  machine_limit: number;

  @Column({ default: 0 })
  user_limit: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => User, user => user.organization)
  users: User[];

  @OneToMany(() => Machine, machine => machine.organization)
  machines: Machine[];

  @OneToMany(() => ApiKey, key => key.organization)
  api_keys: ApiKey[];

  @OneToMany(() => AuditLog, log => log.organization)
  audit_logs: AuditLog[];
}
