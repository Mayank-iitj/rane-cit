import { Controller, Post, Body, Res, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { GcodeService } from './gcode.service';

@Controller('gcode')
export class GcodeController {
  constructor(private readonly gcodeService: GcodeService) {}

  @Post('analyze')
  analyzeGcode(@Body('gcode') gcode: string) {
    if (!gcode || typeof gcode !== 'string') {
      throw new BadRequestException('G-code content required');
    }
    return this.gcodeService.analyzeGcode(gcode);
  }

  @Post('optimize')
  optimizeGcode(@Body('gcode') gcode: string) {
    if (!gcode || typeof gcode !== 'string') {
      throw new BadRequestException('G-code content required');
    }
    return this.gcodeService.optimizeGcode(gcode);
  }
}
