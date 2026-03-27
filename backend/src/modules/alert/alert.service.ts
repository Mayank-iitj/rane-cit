import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateAlertDto, UpdateAlertDto } from '../../dtos';
import { Alert, Machine, Organization } from '../../entities';
import { RealtimeService } from '../../realtime/realtime.service';

@Injectable()
export class AlertService {
  constructor(
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
    @InjectRepository(Machine)
    private readonly machineRepository: Repository<Machine>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    private readonly realtimeService: RealtimeService,
  ) {}

  async create(machineId: string, dto: CreateAlertDto, organizationId: string): Promise<Alert> {
    const resolvedOrganizationId = await this.resolveOrganizationId(organizationId);
    await this.ensureMachineInOrganization(machineId, resolvedOrganizationId);

    const alert = this.alertRepository.create({
      ...dto,
      machine_id: machineId,
      status: 'OPEN',
      context: dto.context || {},
      confidence_score: dto.confidence_score || 0,
      category: dto.category || 'ANOMALY',
    });

    const saved = await this.alertRepository.save(alert);
    this.realtimeService.publish('alert:triggered', saved);

    return saved;
  }

  async list(organizationId: string): Promise<Alert[]> {
    const resolvedOrganizationId = await this.resolveOrganizationId(organizationId);
    const machineIds = await this.getOrganizationMachineIds(resolvedOrganizationId);
    if (!machineIds.length) {
      return [];
    }

    return this.alertRepository.find({
      where: { machine_id: In(machineIds) },
      order: { created_at: 'DESC' },
      take: 200,
    });
  }

  async listByMachine(machineId: string, organizationId: string): Promise<Alert[]> {
    const resolvedOrganizationId = await this.resolveOrganizationId(organizationId);
    await this.ensureMachineInOrganization(machineId, resolvedOrganizationId);

    return this.alertRepository.find({
      where: { machine_id: machineId },
      order: { created_at: 'DESC' },
      take: 200,
    });
  }

  async update(id: string, dto: UpdateAlertDto, organizationId: string): Promise<Alert> {
    const resolvedOrganizationId = await this.resolveOrganizationId(organizationId);
    const alert = await this.getAlertInOrganization(id, resolvedOrganizationId);

    if (dto.status) {
      alert.status = dto.status;
      if (dto.status === 'ACKNOWLEDGED') {
        alert.acknowledged_at = new Date();
      }
      if (dto.status === 'RESOLVED') {
        alert.resolved_at = new Date();
      }
      if (dto.status === 'SNOOZED' && dto.snoozed_until) {
        alert.snoozed_until = dto.snoozed_until;
      }
    }

    if (dto.resolution_notes !== undefined) {
      alert.resolution_notes = dto.resolution_notes;
    }

    const updated = await this.alertRepository.save(alert);
    this.realtimeService.publish('alert:updated', updated);
    return updated;
  }

  async acknowledge(id: string, organizationId: string): Promise<Alert> {
    return this.update(id, { status: 'ACKNOWLEDGED' }, organizationId);
  }

  async resolve(id: string, notes: string | undefined, organizationId: string): Promise<Alert> {
    return this.update(id, { status: 'RESOLVED', resolution_notes: notes }, organizationId);
  }

  async getStats(organizationId: string): Promise<Record<string, number>> {
    const resolvedOrganizationId = await this.resolveOrganizationId(organizationId);
    const machineIds = await this.getOrganizationMachineIds(resolvedOrganizationId);
    if (!machineIds.length) {
      return {
        total: 0,
        critical: 0,
        error: 0,
        warning: 0,
        open: 0,
        resolved: 0,
      };
    }

    const alerts = await this.alertRepository.find({
      where: { machine_id: In(machineIds) },
    });

    return {
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === 'CRITICAL').length,
      error: alerts.filter((a) => a.severity === 'ERROR').length,
      warning: alerts.filter((a) => a.severity === 'WARNING').length,
      open: alerts.filter((a) => a.status === 'OPEN').length,
      resolved: alerts.filter((a) => a.status === 'RESOLVED').length,
    };
  }

  private async ensureMachineInOrganization(machineId: string, organizationId: string): Promise<void> {
    const machine = await this.machineRepository.findOne({
      where: { id: machineId, organization_id: organizationId, is_active: true },
    });

    if (!machine) {
      throw new NotFoundException('Machine not found in organization');
    }
  }

  private async getOrganizationMachineIds(organizationId: string): Promise<string[]> {
    const machines = await this.machineRepository.find({
      where: { organization_id: organizationId, is_active: true },
      select: ['id'],
    });
    return machines.map((m) => m.id);
  }

  private async getAlertInOrganization(id: string, organizationId: string): Promise<Alert> {
    const alert = await this.alertRepository.findOne({ where: { id } });
    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    await this.ensureMachineInOrganization(alert.machine_id, organizationId);
    return alert;
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
