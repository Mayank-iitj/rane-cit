import { Module } from '@nestjs/common';
import { GcodeService } from './gcode.service';
import { GcodeController } from './gcode.controller';

@Module({
  controllers: [GcodeController],
  providers: [GcodeService],
  exports: [GcodeService],
})
export class GcodeModule {}
