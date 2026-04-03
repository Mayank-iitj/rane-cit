import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Index } from 'typeorm';
import { Machine } from './machine.entity';

@Entity('alerts')
@Index(['machine_id', 'created_at'])
@Index(['severity', 'status'])
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  machine_id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ default: 'WARNING' })
  severity: 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';

  @Column({ default: 'OPEN' })
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'SNOOZED';

  @Column()
  alert_type: string; // e.g., "HIGH_TEMPERATURE", "VIBRATION_ANOMALY", "EFFICIENCY_DROP"

  @Column({ default: 'ANOMALY' })
  category: 'ANOMALY' | 'MAINTENANCE' | 'THRESHOLD' | 'SYSTEM' | 'OPERATIONAL';

  @Column({ nullable: true })
  recommended_action: string;

  @Column({ type: 'simple-json', default: '{}' })
  context: Record<string, any>;

  @Column({ nullable: true })
  acknowledged_at: Date;

  @Column({ nullable: true })
  resolved_at: Date;

  @Column({ nullable: true })
  snoozed_until: Date;

  @Column({ nullable: true })
  resolution_notes: string;

  @Column({ type: 'float', default: 0 })
  confidence_score: number; // 0-100 for ML predictions

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Machine, machine => machine.alerts, { onDelete: 'CASCADE' })
  machine: Machine;
}
