import {
  Body,
  Controller,
  Get,
  Headers,
  MessageEvent,
  Param,
  Patch,
  Post,
  Sse,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { CreateAlertDto, UpdateAlertDto } from '../../dtos';
import { RealtimeService } from '../../realtime/realtime.service';
import { AlertService } from './alert.service';

@Controller('alerts')
export class AlertController {
  constructor(
    private readonly alertService: AlertService,
    private readonly realtimeService: RealtimeService,
  ) {}

  @Get()
  async list(@Headers('x-organization-id') organizationId = 'public-organization') {
    return this.alertService.list(organizationId);
  }

  @Get('stats')
  async stats(@Headers('x-organization-id') organizationId = 'public-organization') {
    return this.alertService.getStats(organizationId);
  }

  @Get('machine/:machineId')
  async listByMachine(
    @Param('machineId') machineId: string,
    @Headers('x-organization-id') organizationId = 'public-organization',
  ) {
    return this.alertService.listByMachine(machineId, organizationId);
  }

  @Post('machine/:machineId')
  async create(
    @Param('machineId') machineId: string,
    @Body() dto: CreateAlertDto,
    @Headers('x-organization-id') organizationId = 'public-organization',
  ) {
    return this.alertService.create(machineId, dto, organizationId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAlertDto,
    @Headers('x-organization-id') organizationId = 'public-organization',
  ) {
    return this.alertService.update(id, dto, organizationId);
  }

  @Post(':id/acknowledge')
  async acknowledge(
    @Param('id') id: string,
    @Headers('x-organization-id') organizationId = 'public-organization',
  ) {
    return this.alertService.acknowledge(id, organizationId);
  }

  @Post(':id/resolve')
  async resolve(
    @Param('id') id: string,
    @Body('notes') notes: string,
    @Headers('x-organization-id') organizationId = 'public-organization',
  ) {
    return this.alertService.resolve(id, notes, organizationId);
  }

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.realtimeService.stream('alert:triggered').pipe(
      map((event) => ({
        type: event.channel,
        data: event,
      })),
    );
  }
}
