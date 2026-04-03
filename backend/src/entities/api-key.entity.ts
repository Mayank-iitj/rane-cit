import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Unique } from 'typeorm';
import { Organization } from './organization.entity';

@Entity('api_keys')
@Unique(['key_hash', 'organization_id'])
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organization_id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  key_hash: string; // Never store plaintext keys

  @Column()
  key_prefix: string; // e.g., "cnc_ak_" for UI display

  @Column({ type: 'simple-json', default: '["READ","WRITE"]' })
  permissions: string[];

  @Column({ type: 'simple-json', default: '[]' })
  allowed_ips: string[];

  @Column({ nullable: true })
  expires_at: Date;

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  last_used_at: Date;

  @Column({ default: 0 })
  usage_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Organization, org => org.api_keys, { onDelete: 'CASCADE' })
  organization: Organization;
}
