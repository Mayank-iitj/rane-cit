import { IsString, IsEnum, IsOptional, IsDate, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

type AlertSeverity = 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';
type AlertCategory = 'ANOMALY' | 'MAINTENANCE' | 'THRESHOLD' | 'SYSTEM' | 'OPERATIONAL';
type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'SNOOZED';

export class CreateAlertDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(['CRITICAL', 'ERROR', 'WARNING', 'INFO'])
  severity: AlertSeverity;

  @IsString()
  alert_type: string;

  @IsEnum(['ANOMALY', 'MAINTENANCE', 'THRESHOLD', 'SYSTEM', 'OPERATIONAL'])
  @IsOptional()
  category?: AlertCategory;

  @IsString()
  @IsOptional()
  recommended_action?: string;

  @IsOptional()
  context?: Record<string, any>;

  @IsNumber()
  @IsOptional()
  confidence_score?: number;
}

export class UpdateAlertDto {
  @IsEnum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'SNOOZED'])
  @IsOptional()
  status?: AlertStatus;

  @IsString()
  @IsOptional()
  resolution_notes?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  snoozed_until?: Date;
}

export class AlertResponseDto {
  id: string;
  machine_id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  alert_type: string;
  category: string;
  confidence_score: number;
  created_at: Date;
  updated_at: Date;
}

export class AlertStatsDto {
  total: number;
  critical: number;
  error: number;
  warning: number;
  open: number;
  resolved: number;
}
