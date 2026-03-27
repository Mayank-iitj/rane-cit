import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreateMachineDto {
  @IsString()
  name: string;

  @IsString()
  serial_number: string;

  @IsString()
  machine_type: string;

  @IsString()
  manufacturer: string;

  @IsString()
  @IsOptional()
  model_number?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsNumber()
  @IsOptional()
  operating_hours?: number;

  @IsOptional()
  specifications?: Record<string, any>;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateMachineDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsNumber()
  @IsOptional()
  operating_hours?: number;

  @IsEnum(['ACTIVE', 'IDLE', 'RUNNING', 'ERROR', 'MAINTENANCE', 'OFFLINE'])
  @IsOptional()
  status?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class MachineResponseDto {
  id: string;
  name: string;
  serial_number: string;
  status: string;
  machine_type: string;
  manufacturer: string;
  efficiency_score: number;
  utilization_rate: number;
  temperature_celsius: number;
  vibration_level: number;
  last_heartbeat: Date;
  created_at: Date;
  updated_at: Date;
}

export class MachineListDto {
  id: string;
  name: string;
  serial_number: string;
  status: string;
  efficiency_score: number;
  last_heartbeat: Date;
}
