import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { Organization } from './organization.entity';
import { Telemetry } from './telemetry.entity';
import { Alert } from './alert.entity';
import { GcodeProgram } from './gcode-program.entity';

@Entity('machines')
@Unique(['serial_number', 'organization_id'])
export class Machine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  serial_number: string;

  @Column({ default: 'ACTIVE' })
  status: 'ACTIVE' | 'IDLE' | 'RUNNING' | 'ERROR' | 'MAINTENANCE' | 'OFFLINE';

  @Column()
  machine_type: string; // e.g., "CNC Lathe", "Vertical Mill", "5-Axis"

  @Column()
  manufacturer: string;

  @Column({ nullable: true })
  model_number: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'float', default: 0 })
  operating_hours: number;

  @Column({ type: 'float', default: 0 })
  efficiency_score: number; // 0-100

  @Column({ type: 'float', default: 0 })
  utilization_rate: number; // 0-100

  @Column({ type: 'float', default: 0 })
  temperature_celsius: number;

  @Column({ type: 'float', default: 0 })
  vibration_level: number;

  @Column({ nullable: true })
  last_maintenance: Date;

  @Column({ nullable: true })
  next_maintenance: Date;

  @Column({ nullable: true })
  last_heartbeat: Date;

  @Column({ nullable: true })
  ip_address: string;

  @Column({ nullable: true })
  api_key: string;

  @Column({ type: 'jsonb', default: {} })
  specifications: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ default: true })
  is_active: boolean;

  @Column()
  organization_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Organization, org => org.machines, { onDelete: 'CASCADE' })
  organization: Organization;

  @OneToMany(() => Telemetry, telemetry => telemetry.machine, { cascade: ['remove'] })
  telemetry: Telemetry[];

  @OneToMany(() => Alert, alert => alert.machine)
  alerts: Alert[];

  @OneToMany(() => GcodeProgram, program => program.machine)
  gcode_programs: GcodeProgram[];
}
