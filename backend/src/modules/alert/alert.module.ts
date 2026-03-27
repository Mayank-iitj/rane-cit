import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert, Machine, Organization } from '../../entities';
import { AlertController } from './alert.controller';
import { AlertService } from './alert.service';

@Module({
	imports: [TypeOrmModule.forFeature([Alert, Machine, Organization])],
	controllers: [AlertController],
	providers: [AlertService],
	exports: [AlertService],
})
export class AlertModule {}
