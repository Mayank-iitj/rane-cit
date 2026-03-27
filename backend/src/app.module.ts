import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from './modules/auth/auth.module';
import { MachineModule } from './modules/machine/machine.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AlertModule } from './modules/alert/alert.module';
import { GcodeModule } from './modules/gcode/gcode.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { HealthModule } from './modules/health/health.module';
import { typeOrmConfig, redisConfig } from './config';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.production'],
    }),

    // Database
    TypeOrmModule.forRoot(typeOrmConfig),

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
  ],
})
export class AppModule {}
