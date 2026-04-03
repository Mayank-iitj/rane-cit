import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index } from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity('audit_logs')
@Index(['organization_id', 'created_at'])
@Index(['entity_type', 'entity_id'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organization_id: string;

  @Column({ nullable: true })
  user_id: string;

  @Column()
  action: string; // e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'DOWNLOAD'

  @Column()
  entity_type: string; // e.g., 'Machine', 'User', 'Alert'

  @Column()
  entity_id: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  ip_address: string;

  @Column({ nullable: true })
  user_agent: string;

  @Column({ type: 'simple-json', default: '{}' })
  changes: Record<string, any>; // For UPDATE: { before: {}, after: {} }

  @Column({ type: 'simple-json', default: '{}' })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Organization, org => org.audit_logs, { onDelete: 'CASCADE' })
  organization: Organization;

  @ManyToOne(() => User, user => user.audit_logs, { nullable: true, onDelete: 'SET NULL' })
  user: User;
}
