import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMachineDto, UpdateMachineDto } from '../../dtos';
import { Machine, Organization } from '../../entities';
import { RealtimeService } from '../../realtime/realtime.service';

@Injectable()
export class MachineService {
  constructor(
    @InjectRepository(Machine)
    private readonly machineRepository: Repository<Machine>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    private readonly realtimeService: RealtimeService,
  ) {}

  async create(dto: CreateMachineDto, organizationId: string): Promise<Machine> {
    const resolvedOrganizationId = await this.resolveOrganizationId(organizationId);

    const existing = await this.machineRepository.findOne({
      where: { serial_number: dto.serial_number, organization_id: resolvedOrganizationId },
    });

    if (existing) {
      throw new ConflictException('Machine with this serial number already exists');
    }

    const machine = this.machineRepository.create({
      ...dto,
      organization_id: resolvedOrganizationId,
      status: 'ACTIVE',
      last_heartbeat: new Date(),
      specifications: dto.specifications || {},
      metadata: dto.metadata || {},
    });

    const saved = await this.machineRepository.save(machine);
    this.realtimeService.publish('machine:created', saved);
    return saved;
  }

  async findAll(organizationId: string): Promise<Machine[]> {
    const resolvedOrganizationId = await this.resolveOrganizationId(organizationId);

    return this.machineRepository.find({
      where: { organization_id: resolvedOrganizationId, is_active: true },
      order: { updated_at: 'DESC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<Machine> {
    const resolvedOrganizationId = await this.resolveOrganizationId(organizationId);

    const machine = await this.machineRepository.findOne({
      where: { id, organization_id: resolvedOrganizationId, is_active: true },
    });

    if (!machine) {
      throw new NotFoundException('Machine not found');
    }

    return machine;
  }

  async update(id: string, dto: UpdateMachineDto, organizationId: string): Promise<Machine> {
    const machine = await this.findOne(id, organizationId);
    Object.assign(machine, dto);

    const updated = await this.machineRepository.save(machine);
    this.realtimeService.publish('machine:updated', updated);
    return updated;
  }

  async remove(id: string, organizationId: string): Promise<{ success: boolean }> {
    const machine = await this.findOne(id, organizationId);
    machine.is_active = false;
    machine.status = 'OFFLINE';

    await this.machineRepository.save(machine);
    this.realtimeService.publish('machine:removed', { id, organization_id: machine.organization_id });

    return { success: true };
  }

  async heartbeat(id: string, organizationId: string): Promise<Machine> {
    const machine = await this.findOne(id, organizationId);
    machine.last_heartbeat = new Date();

    const updated = await this.machineRepository.save(machine);
    this.realtimeService.publish('machine:heartbeat', {
      machine_id: updated.id,
      last_heartbeat: updated.last_heartbeat,
    });

    return updated;
  }

  async getStatus(id: string, organizationId: string): Promise<Record<string, unknown>> {
    const machine = await this.findOne(id, organizationId);
    return {
      machine_id: machine.id,
      status: machine.status,
      last_heartbeat: machine.last_heartbeat,
      efficiency_score: machine.efficiency_score,
      utilization_rate: machine.utilization_rate,
      temperature_celsius: machine.temperature_celsius,
      vibration_level: machine.vibration_level,
    };
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
