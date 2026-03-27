import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert, Machine, Organization, Telemetry } from '../../entities';
import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';

@Module({
	imports: [TypeOrmModule.forFeature([Telemetry, Machine, Alert, Organization])],
	controllers: [TelemetryController],
	providers: [TelemetryService],
	exports: [TelemetryService],
})
export class TelemetryModule {}
