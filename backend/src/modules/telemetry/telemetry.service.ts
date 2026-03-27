import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BatchIngestTelemetryDto, IngestTelemetryDto } from '../../dtos';
import { Alert, Machine, Organization, Telemetry } from '../../entities';
import { RealtimeService } from '../../realtime/realtime.service';

@Injectable()
export class TelemetryService {
  constructor(
    @InjectRepository(Telemetry)
    private readonly telemetryRepository: Repository<Telemetry>,
    @InjectRepository(Machine)
    private readonly machineRepository: Repository<Machine>,
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    private readonly realtimeService: RealtimeService,
  ) {}

  async ingest(machineId: string, dto: IngestTelemetryDto, organizationId: string): Promise<Telemetry> {
    const resolvedOrganizationId = await this.resolveOrganizationId(organizationId);
    const machine = await this.getMachine(machineId, resolvedOrganizationId);

    const telemetry = this.telemetryRepository.create({
      machine_id: machine.id,
      timestamp: dto.timestamp || new Date(),
      spindle_speed: dto.spindle_speed,
      feed_rate: dto.feed_rate,
      temperature: dto.temperature,
      vibration: dto.vibration,
      current_draw: dto.current_draw,
      power_consumption: dto.power_consumption,
      pressure: dto.pressure,
      humidity: dto.humidity,
      program_name: dto.program_name,
      progress_percent: dto.progress_percent,
      raw_data: dto.raw_data || {},
    });

    const saved = await this.telemetryRepository.save(telemetry);

    machine.last_heartbeat = new Date();
    machine.temperature_celsius = dto.temperature ?? machine.temperature_celsius;
    machine.vibration_level = dto.vibration ?? machine.vibration_level;
    machine.status = (dto.progress_percent ?? 0) > 0 ? 'RUNNING' : 'IDLE';
    machine.efficiency_score = this.estimateEfficiency(dto);
    machine.utilization_rate = this.estimateUtilization(dto);
    await this.machineRepository.save(machine);

    await this.maybeCreateThresholdAlerts(machine, dto);

    this.realtimeService.publish('telemetry:new', saved);

    return saved;
  }

  async batchIngest(machineId: string, dto: BatchIngestTelemetryDto, organizationId: string): Promise<{ inserted: number }> {
    const resolvedOrganizationId = await this.resolveOrganizationId(organizationId);

    if (!dto.datapoints?.length) {
      return { inserted: 0 };
    }

    for (const datapoint of dto.datapoints) {
      await this.ingest(machineId, datapoint, resolvedOrganizationId);
    }

    return { inserted: dto.datapoints.length };
  }

  async latest(machineId: string, organizationId: string, limit = 100): Promise<Telemetry[]> {
    const resolvedOrganizationId = await this.resolveOrganizationId(organizationId);
    await this.getMachine(machineId, resolvedOrganizationId);

    return this.telemetryRepository.find({
      where: { machine_id: machineId },
      order: { timestamp: 'DESC' },
      take: Math.min(Math.max(limit, 1), 500),
    });
  }

  async stats(machineId: string, organizationId: string): Promise<Record<string, number>> {
    const resolvedOrganizationId = await this.resolveOrganizationId(organizationId);
    await this.getMachine(machineId, resolvedOrganizationId);

    const stats = await this.telemetryRepository
      .createQueryBuilder('t')
      .select('COUNT(*)', 'count')
      .addSelect('AVG(t.temperature)', 'avg_temperature')
      .addSelect('MAX(t.temperature)', 'max_temperature')
      .addSelect('AVG(t.vibration)', 'avg_vibration')
      .addSelect('MAX(t.vibration)', 'max_vibration')
      .addSelect('AVG(t.power_consumption)', 'avg_power')
      .where('t.machine_id = :machineId', { machineId })
      .getRawOne<Record<string, string>>();

    return {
      count: Number(stats?.count || 0),
      avg_temperature: Number(stats?.avg_temperature || 0),
      max_temperature: Number(stats?.max_temperature || 0),
      avg_vibration: Number(stats?.avg_vibration || 0),
      max_vibration: Number(stats?.max_vibration || 0),
      avg_power: Number(stats?.avg_power || 0),
    };
  }

  private async getMachine(machineId: string, organizationId: string): Promise<Machine> {
    const machine = await this.machineRepository.findOne({
      where: { id: machineId, organization_id: organizationId, is_active: true },
    });

    if (!machine) {
      throw new NotFoundException('Machine not found in organization');
    }

    return machine;
  }

  private estimateEfficiency(dto: IngestTelemetryDto): number {
    const progress = Math.min(Math.max(dto.progress_percent ?? 0, 0), 100);
    const tempPenalty = Math.max((dto.temperature ?? 0) - 75, 0) * 0.5;
    const vibPenalty = Math.max((dto.vibration ?? 0) - 6, 0) * 2;
    return Math.max(0, Math.min(100, progress - tempPenalty - vibPenalty + 20));
  }

  private estimateUtilization(dto: IngestTelemetryDto): number {
    const spindle = Math.min((dto.spindle_speed ?? 0) / 120, 100);
    const feed = Math.min((dto.feed_rate ?? 0) / 30, 100);
    return Math.max(0, Math.min(100, spindle * 0.6 + feed * 0.4));
  }

  private async maybeCreateThresholdAlerts(machine: Machine, dto: IngestTelemetryDto): Promise<void> {
    const alerts: Alert[] = [];

    if ((dto.temperature ?? 0) >= 90) {
      alerts.push(
        this.alertRepository.create({
          machine_id: machine.id,
          title: 'High temperature detected',
          description: `Machine exceeded safe temperature with ${(dto.temperature ?? 0).toFixed(1)}C`,
          severity: 'CRITICAL',
          status: 'OPEN',
          alert_type: 'HIGH_TEMPERATURE',
          category: 'THRESHOLD',
          confidence_score: 100,
          context: { threshold: 90, observed: dto.temperature },
        }),
      );
    }

    if ((dto.vibration ?? 0) >= 8) {
      alerts.push(
        this.alertRepository.create({
          machine_id: machine.id,
          title: 'Abnormal vibration detected',
          description: `Vibration level is high at ${(dto.vibration ?? 0).toFixed(2)}`,
          severity: 'WARNING',
          status: 'OPEN',
          alert_type: 'VIBRATION_ANOMALY',
          category: 'ANOMALY',
          confidence_score: 85,
          context: { threshold: 8, observed: dto.vibration },
        }),
      );
    }

    if (!alerts.length) {
      return;
    }

    const saved = await this.alertRepository.save(alerts);
    for (const alert of saved) {
      this.realtimeService.publish('alert:triggered', alert);
    }
  }

  private async resolveOrganizationId(organizationIdOrSlug?: string): Promise<string> {
    if (!organizationIdOrSlug) {
      return this.ensureDefaultOrganization();
    }

    const byId = await this.organizationRepository.findOne({ where: { id: organizationIdOrSlug } });
    if (byId) {
      return byId.id;
    }

    const bySlug = await this.organizationRepository.findOne({ where: { slug: organizationIdOrSlug } });
    if (bySlug) {
      return bySlug.id;
    }

    return this.ensureDefaultOrganization();
  }

  private async ensureDefaultOrganization(): Promise<string> {
    const slug = 'public-organization';
    const existing = await this.organizationRepository.findOne({ where: { slug } });
    if (existing) {
      return existing.id;
    }

    const created = this.organizationRepository.create({
      name: 'Public Organization',
      slug,
      tier: 'TRIAL',
      is_active: true,
      owner_id: '',
      settings: {},
      machine_limit: 100,
      user_limit: 100,
    });

    const saved = await this.organizationRepository.save(created);
    return saved.id;
  }
}
