import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

const isTypeScriptRuntime = __filename.endsWith('.ts');
const defaultDbType = (process.env.DB_TYPE || 'postgres') as 'postgres' | 'sqlite';

const entityPaths = isTypeScriptRuntime
  ? [path.join(process.cwd(), 'src', 'entities', '*.entity.ts')]
  : [path.join(process.cwd(), 'dist', 'entities', '*.entity.js')];

const migrationPaths = isTypeScriptRuntime
  ? [path.join(process.cwd(), 'src', 'migrations', '*.ts')]
  : [path.join(process.cwd(), 'dist', 'migrations', '*.js')];

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  ...( (configService.get('DB_TYPE') || defaultDbType) === 'sqlite'
    ? {
        type: 'sqlite' as const,
        database: path.join(process.cwd(), 'data', 'cnc-dev.sqlite'),
        synchronize: true,
      }
    : {
        type: 'postgres' as const,
        host: String(configService.get('DB_HOST') || 'localhost'),
        port: Number(configService.get('DB_PORT') || 5432),
        username: String(configService.get('DB_USER') || 'cnc_mayyanks'),
        password: String(configService.get('DB_PASSWORD') || 'cnc_secret'),
        database: String(configService.get('DB_NAME') || 'cnc_mayyanks_db'),
        ssl: configService.get('DB_SSL') === 'true',
        extra: {
          max: 20,
          min: 5,
        },
      }),
  entities: entityPaths,
  migrations: migrationPaths,
  migrationsTableName: 'migrations',
  logging: configService.get('NODE_ENV') === 'development',
});

export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  ttl: 300,
};

export const typeOrmConfig: TypeOrmModuleOptions = {
  ...( (process.env.DB_TYPE || defaultDbType) === 'sqlite'
    ? {
        type: 'sqlite' as const,
        database: path.join(process.cwd(), 'data', 'cnc-dev.sqlite'),
        synchronize: true,
      }
    : {
        type: 'postgres' as const,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER || 'cnc_mayyanks',
        password: process.env.DB_PASSWORD || 'cnc_secret',
        database: process.env.DB_NAME || 'cnc_mayyanks_db',
        ssl: process.env.DB_SSL === 'true',
        extra: {
          max: 20,
          min: 5,
        },
      }),
  entities: entityPaths,
  migrations: migrationPaths,
  logging: process.env.NODE_ENV === 'development',
  migrationsTableName: 'migrations',
};
