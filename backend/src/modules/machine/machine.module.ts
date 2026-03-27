import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Machine, Organization } from '../../entities';
import { MachineController } from './machine.controller';
import { MachineService } from './machine.service';

@Module({
	imports: [TypeOrmModule.forFeature([Machine, Organization])],
	controllers: [MachineController],
	providers: [MachineService],
	exports: [MachineService],
})
export class MachineModule {}
