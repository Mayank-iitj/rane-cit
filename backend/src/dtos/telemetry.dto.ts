import { IsNumber, IsOptional, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class IngestTelemetryDto {
  @IsNumber()
  spindle_speed: number;

  @IsNumber()
  @IsOptional()
  feed_rate?: number;

  @IsNumber()
  @IsOptional()
  temperature?: number;

  @IsNumber()
  @IsOptional()
  vibration?: number;

  @IsNumber()
  @IsOptional()
  current_draw?: number;

  @IsNumber()
  @IsOptional()
  power_consumption?: number;

  @IsNumber()
  @IsOptional()
  pressure?: number;

  @IsNumber()
  @IsOptional()
  humidity?: number;

  @IsString()
  @IsOptional()
  program_name?: string;

  @IsNumber()
  @IsOptional()
  progress_percent?: number;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  timestamp?: Date;

  @IsOptional()
  raw_data?: Record<string, any>;
}

export class BatchIngestTelemetryDto {
  @Type(() => IngestTelemetryDto)
  datapoints: IngestTelemetryDto[];
}

export class TelemetryResponseDto {
  id: string;
  machine_id: string;
  timestamp: Date;
  spindle_speed: number;
  temperature: number;
  vibration: number;
  power_consumption: number;
  program_name: string;
  created_at: Date;
}

export class LatestTelemetryDto {
  spindle_speed: number;
  temperature: number;
  vibration: number;
  power_consumption: number;
  efficiency_estimated: number;
  timestamp: Date;
}
