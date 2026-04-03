import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index } from 'typeorm';
import { Machine } from './machine.entity';

@Entity('telemetry')
@Index(['machine_id', 'created_at'])
@Index(['timestamp'])
export class Telemetry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  machine_id: string;

  @Column({ type: 'datetime' })
  timestamp: Date;

  @Column({ type: 'float', nullable: true })
  spindle_speed: number; // RPM

  @Column({ type: 'float', nullable: true })
  feed_rate: number; // mm/min

  @Column({ type: 'float', nullable: true })
  temperature: number; // Celsius

  @Column({ type: 'float', nullable: true })
  vibration: number;

  @Column({ type: 'float', nullable: true })
  current_draw: number; // Amps

  @Column({ type: 'float', nullable: true })
  power_consumption: number; // kW

  @Column({ type: 'float', nullable: true })
  pressure: number; // PSI

  @Column({ type: 'float', nullable: true })
  humidity: number; // %

  @Column({ nullable: true })
  program_name: string;

  @Column({ type: 'float', nullable: true })
  progress_percent: number;

  @Column({ type: 'simple-json', default: '{}' })
  raw_data: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Machine, machine => machine.telemetry, { onDelete: 'CASCADE' })
  machine: Machine;
}
