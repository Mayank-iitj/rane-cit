import {
  Body,
  Controller,
  Get,
  Headers,
  MessageEvent,
  Param,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { BatchIngestTelemetryDto, IngestTelemetryDto } from '../../dtos';
import { RealtimeService } from '../../realtime/realtime.service';
import { TelemetryService } from './telemetry.service';

@Controller('telemetry')
export class TelemetryController {
  constructor(
    private readonly telemetryService: TelemetryService,
    private readonly realtimeService: RealtimeService,
  ) {}

  @Post(':machineId/ingest')
  async ingest(
    @Param('machineId') machineId: string,
    @Body() dto: IngestTelemetryDto,
    @Headers('x-organization-id') organizationId = 'public-organization',
  ) {
    return this.telemetryService.ingest(machineId, dto, organizationId);
  }

  @Post(':machineId/batch-ingest')
  async batchIngest(
    @Param('machineId') machineId: string,
    @Body() dto: BatchIngestTelemetryDto,
    @Headers('x-organization-id') organizationId = 'public-organization',
  ) {
    return this.telemetryService.batchIngest(machineId, dto, organizationId);
  }

  @Get(':machineId/latest')
  async latest(
    @Param('machineId') machineId: string,
    @Query('limit') limit = '100',
    @Headers('x-organization-id') organizationId = 'public-organization',
  ) {
    return this.telemetryService.latest(machineId, organizationId, Number(limit));
  }

  @Get(':machineId/stats')
  async stats(
    @Param('machineId') machineId: string,
    @Headers('x-organization-id') organizationId = 'public-organization',
  ) {
    return this.telemetryService.stats(machineId, organizationId);
  }

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.realtimeService.stream('telemetry:new').pipe(
      map((event) => ({
        type: event.channel,
        data: event,
      })),
    );
  }
}
