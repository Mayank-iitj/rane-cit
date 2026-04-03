import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Machine } from './machine.entity';

@Entity('gcode_programs')
export class GcodeProgram {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  machine_id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'text' })
  gcode_content: string;

  @Column({ type: 'float', nullable: true })
  estimated_runtime_minutes: number;

  @Column({ type: 'float', nullable: true })
  file_size_bytes: number;

  @Column({ type: 'float', nullable: true })
  optimization_score: number; // 0-100

  @Column({ type: 'text', nullable: true })
  optimized_gcode: string;

  @Column({ type: 'simple-json', default: '{}' })
  optimization_suggestions: Record<string, any>;

  @Column({ type: 'float', default: 0 })
  estimated_cost: number;

  @Column({ type: 'float', default: 0 })
  optimized_estimated_cost: number;

  @Column({ type: 'float', default: 0 })
  potential_savings_percent: number;

  @Column({ default: 'PENDING' })
  status: 'PENDING' | 'APPROVED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

  @Column({ nullable: true })
  last_run_at: Date;

  @Column({ type: 'float', nullable: true })
  actual_runtime_minutes: number;

  @Column({ nullable: true })
  run_count: number;

  @Column({ type: 'simple-json', default: '{}' })
  metadata: Record<string, any>;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Machine, machine => machine.gcode_programs, { onDelete: 'CASCADE' })
  machine: Machine;
}
