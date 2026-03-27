import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'cnc-mayyanks-api',
      timestamp: new Date().toISOString(),
    };
  }
}
