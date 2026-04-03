import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import * as path from 'path';
import { AuthModule } from './modules/auth/auth.module';
import { MachineModule } from './modules/machine/machine.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AlertModule } from './modules/alert/alert.module';
import { GcodeModule } from './modules/gcode/gcode.module';
import { CopilotModule } from './modules/copilot/copilot.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { HealthModule } from './modules/health/health.module';
import { getTypeOrmConfig, redisConfig } from './config';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.join(process.cwd(), '.env'),
        path.join(process.cwd(), '.env.production'),
        path.join(__dirname, '..', '.env'),
        path.join(__dirname, '..', '.env.production'),
      ],
    }),

    // Database - Use factory function to ensure env vars are loaded
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => getTypeOrmConfig(configService),
    }),

    // Cache / Redis
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => redisConfig,
    }),

    RealtimeModule,

    // Core Modules (ordered by dependency)
    HealthModule,
    TenantModule,
    AuthModule,
    MachineModule,
    TelemetryModule,
    AlertModule,
    AnalyticsModule,
    GcodeModule,
    CopilotModule,
  ],
})
export class AppModule {}
