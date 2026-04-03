import { Controller, Get, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Controller('health')
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get()
  async getHealth() {
    try {
      // FIX: Check database connectivity
      const dbHealthy = this.dataSource.isInitialized;
      
      // Check cache connectivity (non-blocking)
      let cacheHealthy = false;
      try {
        await this.cacheManager.set('health_check', 'ok', 5000);
        cacheHealthy = true;
      } catch {
        cacheHealthy = false;
      }

      return {
        status: dbHealthy ? 'ok' : 'degraded',
        service: 'cnc-mayyanks-api',
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: dbHealthy ? 'ok' : 'disconnected' },
          cache: { status: cacheHealthy ? 'ok' : 'unavailable' },
        },
      };
    } catch (error) {
      return {
        status: 'error',
        service: 'cnc-mayyanks-api',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
