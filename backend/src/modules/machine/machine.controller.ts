import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateMachineDto, UpdateMachineDto } from '../../dtos';
import { MachineService } from './machine.service';

@Controller('machines')
export class MachineController {
  constructor(private readonly machineService: MachineService) {}

  @Post()
  async create(
    @Body() dto: CreateMachineDto,
    @Headers('x-organization-id') organizationId = 'public-organization',
  ) {
    return this.machineService.create(dto, organizationId);
  }

  @Get()
  async findAll(@Headers('x-organization-id') organizationId = 'public-organization') {
    return this.machineService.findAll(organizationId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Headers('x-organization-id') organizationId = 'public-organization',
  ) {
    return this.machineService.findOne(id, organizationId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMachineDto,
    @Headers('x-organization-id') organizationId = 'public-organization',
  ) {
    return this.machineService.update(id, dto, organizationId);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Headers('x-organization-id') organizationId = 'public-organization',
  ) {
    return this.machineService.remove(id, organizationId);
  }

  @Post(':id/heartbeat')
  async heartbeat(
    @Param('id') id: string,
    @Headers('x-organization-id') organizationId = 'public-organization',
  ) {
    return this.machineService.heartbeat(id, organizationId);
  }

  @Get(':id/status')
  async status(
    @Param('id') id: string,
    @Headers('x-organization-id') organizationId = 'public-organization',
  ) {
    return this.machineService.getStatus(id, organizationId);
  }
}
