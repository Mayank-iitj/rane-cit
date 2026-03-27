import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { Organization } from './organization.entity';
import { AuditLog } from './audit-log.entity';

@Entity('users')
@Unique(['email', 'organization_id'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  password_hash: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({ default: 'USER' })
  role: 'OWNER' | 'ADMIN' | 'USER' | 'VIEWER' | 'GUEST';

  @Column({ default: 'ACTIVE' })
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

  @Column({ nullable: true })
  google_id: string;

  @Column({ nullable: true })
  last_login_at: Date;

  @Column({ default: false })
  email_verified: boolean;

  @Column({ default: false })
  two_fa_enabled: boolean;

  @Column({ nullable: true })
  two_fa_secret: string;

  @Column({ default: true })
  notifications_enabled: boolean;

  @Column({ type: 'jsonb', default: {} })
  preferences: Record<string, any>;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Organization, org => org.users, { onDelete: 'CASCADE' })
  organization: Organization;

  @OneToMany(() => AuditLog, log => log.user)
  audit_logs: AuditLog[];

  // Computed property
  get full_name(): string {
    return `${this.first_name} ${this.last_name}`;
  }
}
